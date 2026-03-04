const { app, BrowserWindow, ipcMain, dialog, shell, safeStorage, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn, exec } = require('child_process');
const os = require('os');
const pty = require('node-pty');
const { initAutoUpdater } = require('./updater.cjs');
const { initLogger } = require('./core/Logger.cjs');
const { registerExecutionHandlers, getExecutionService } = require('./ipc/executionHandlers.cjs');
const { killProcessTree } = require('./system/WindowsKillTree.cjs');

// Initialize logger as early as possible
initLogger(app.getPath('userData'));

// Global error handlers — prevent silent crashes, route through Logger
process.on('uncaughtException', (err) => {
    const Logger = require('./core/Logger.cjs');
    Logger.error('Uncaught Exception', { message: err.message, stack: err.stack });
});
process.on('unhandledRejection', (reason) => {
    const Logger = require('./core/Logger.cjs');
    Logger.error('Unhandled Rejection', { reason: String(reason) });
});

// Keep a global reference of the window object
let mainWindow;
let splashWindow;

// Workspace and settings paths
const userDataPath = app.getPath('userData');
const settingsPath = path.join(userDataPath, 'settings.json');
let workspacePath = null;
let runningProcesses = new Map();
let ptyProcesses = new Map();

// Secure auth token storage path
const authTokenPath = path.join(userDataPath, '.auth_token');

/**
 * Validate that a file path is within allowed directories (workspace or home).
 * Prevents path-traversal attacks via the IPC bridge.
 */
function isPathAllowed(targetPath) {
    if (!targetPath || typeof targetPath !== 'string') return false;
    const resolved = path.resolve(targetPath);
    const home = os.homedir();
    // Allow access within the workspace, home directory, or app data
    if (resolved.startsWith(home)) return true;
    if (workspacePath && resolved.startsWith(path.resolve(workspacePath))) return true;
    if (resolved.startsWith(userDataPath)) return true;
    // On macOS, also allow /tmp for temp operations
    if (process.platform === 'darwin' && resolved.startsWith('/tmp')) return true;
    if (process.platform !== 'win32' && resolved.startsWith('/tmp')) return true;
    return false;
}

// Default settings
const defaultSettings = {
    workspace: null,
    theme: 'dark-plus',
    setupComplete: false,
    detectedLanguages: {
        python: null,
        node: null,
        gcc: null,
        java: null
    }
};

// Load settings
function loadSettings() {
    try {
        if (fs.existsSync(settingsPath)) {
            return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        }
    } catch (e) {
        const Logger = require('./core/Logger.cjs');
        Logger.error('Failed to load settings', { error: e.message });
    }
    return { ...defaultSettings };
}

// Save settings
function saveSettings(settings) {
    try {
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    } catch (e) {
        const Logger = require('./core/Logger.cjs');
        Logger.error('Failed to save settings', { error: e.message });
    }
}

// Create splash window
function createSplashWindow() {
    splashWindow = new BrowserWindow({
        width: 400,
        height: 300,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    splashWindow.loadFile(path.join(__dirname, 'splash.html'));
    splashWindow.center();

    // Inject real version into splash screen
    splashWindow.webContents.on('did-finish-load', () => {
        const ver = app.getVersion();
        splashWindow?.webContents.executeJavaScript(
            `document.getElementById('app-version').textContent = 'v${ver}';`
        ).catch(() => {});
    });
}

// Create main window
function createMainWindow() {
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        frame: false, // Custom title bar
        titleBarStyle: 'hidden',
        backgroundColor: '#020617',
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,       // node-pty requires this off
            webSecurity: true,    // Enforce same-origin policy
            preload: path.join(__dirname, 'preload.cjs')
        }
    });

    // Load the app
    if (isDev) {
        mainWindow.loadURL('http://localhost:5174');
        // mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        if (splashWindow) {
            splashWindow.close();
            splashWindow = null;
        }
        mainWindow.show();
        mainWindow.focus();
    });

    // ─── Auto-Updater ──────────────────────────────────────────
    initAutoUpdater(mainWindow);

    // ─── Execution Engine (NEW) ───────────────────────────────
    registerExecutionHandlers(mainWindow, {
        getSettings: () => loadSettings(),
        bundledRuntimesPath: app.isPackaged
            ? path.join(process.resourcesPath, 'runtime')
            : null,
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// App ready
app.whenReady().then(() => {
    createSplashWindow();

    // Delay main window to show splash
    setTimeout(() => {
        createMainWindow();
    }, 1500);
});

// Quit when all windows are closed
app.on('window-all-closed', async () => {
    // NEW: Use ProcessManager for clean shutdown with tree kill
    const executionService = getExecutionService();
    if (executionService) {
        await executionService.getProcessManager().killAll(runningProcesses, ptyProcesses);
    } else {
        // Fallback: kill processes directly with tree kill
        for (const [id, proc] of runningProcesses) {
            try {
                if (proc.pid) await killProcessTree(proc.pid);
                else proc.kill();
            } catch { /* already dead */ }
        }
        runningProcesses.clear();

        for (const [id, proc] of ptyProcesses) {
            try { proc.kill(); } catch { /* already dead */ }
        }
        ptyProcesses.clear();
    }

    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// ─── Safety: kill ALL processes on unexpected quit ───────────────────────
app.on('before-quit', async (event) => {
    const Logger = require('./core/Logger.cjs');
    Logger.info('App quitting — cleaning up processes');

    const executionService = getExecutionService();
    if (executionService) {
        await executionService.getProcessManager().killAll(runningProcesses, ptyProcesses);
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createMainWindow();
    }
});

// ==========================================
// IPC HANDLERS
// ==========================================

// Window controls
ipcMain.handle('window:minimize', () => mainWindow?.minimize());
ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow?.maximize();
    }
});
ipcMain.handle('window:close', () => mainWindow?.close());
ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized());

// Settings
ipcMain.handle('settings:get', () => loadSettings());
ipcMain.handle('settings:set', (event, settings) => {
    saveSettings(settings);
    return true;
});

// Dialog: Select workspace folder
ipcMain.handle('dialog:openFolder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory', 'createDirectory'],
        title: 'Select Workspace Folder'
    });

    if (!result.canceled && result.filePaths.length > 0) {
        workspacePath = result.filePaths[0];
        const settings = loadSettings();
        settings.workspace = workspacePath;
        saveSettings(settings);
        return workspacePath;
    }
    return null;
});

// Get workspace path
ipcMain.handle('workspace:get', () => {
    if (!workspacePath) {
        const settings = loadSettings();
        workspacePath = settings.workspace;
    }
    return workspacePath;
});

// Set workspace path
ipcMain.handle('workspace:set', (event, path) => {
    workspacePath = path;
    const settings = loadSettings();
    settings.workspace = path;
    saveSettings(settings);
    return true;
});

// Create default project files
ipcMain.handle('workspace:createDefaults', async (event, folderPath) => {
    try {
        const files = [
            {
                name: 'hello.py',
                content: `# My first Python program

def main():
    print("Hello, World!")
    print("Welcome to CodeNest!")

if __name__ == "__main__":
    main()
`
            },
            {
                name: 'main.c',
                content: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    printf("Welcome to CodeNest!\\n");
    return 0;
}
`
            },
            {
                name: 'Main.java',
                content: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        System.out.println("Welcome to CodeNest!");
    }
}
`
            },
            {
                name: 'README.md',
                content: `# My CodeNest Workspace

Welcome to your coding workspace!

## Getting Started
- Open hello.py to start with Python
- Open main.c to try C programming
- Open Main.java for Java

Happy coding! 🚀
`
            }
        ];

        for (const file of files) {
            const filePath = path.join(folderPath, file.name);
            if (!fs.existsSync(filePath)) {
                fs.writeFileSync(filePath, file.content);
            }
        }

        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
});

// File system operations
ipcMain.handle('fs:readDir', async (event, dirPath) => {
    try {
        const items = fs.readdirSync(dirPath, { withFileTypes: true });
        return items.map(item => ({
            name: item.name,
            isDirectory: item.isDirectory(),
            path: path.join(dirPath, item.name)
        }));
    } catch (e) {
        return { error: e.message };
    }
});

ipcMain.handle('fs:readFile', async (event, filePath) => {
    if (!isPathAllowed(filePath)) return { error: 'Access denied: path outside workspace' };
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (e) {
        return { error: e.message };
    }
});

ipcMain.handle('fs:writeFile', async (event, filePath, content) => {
    if (!isPathAllowed(filePath)) return { error: 'Access denied: path outside workspace' };
    try {
        fs.writeFileSync(filePath, content, 'utf8');
        return { success: true };
    } catch (e) {
        return { error: e.message };
    }
});

ipcMain.handle('fs:createFile', async (event, filePath, content = '') => {
    if (!isPathAllowed(filePath)) return { error: 'Access denied: path outside workspace' };
    try {
        fs.writeFileSync(filePath, content, 'utf8');
        return { success: true };
    } catch (e) {
        return { error: e.message };
    }
});

ipcMain.handle('fs:createFolder', async (event, folderPath) => {
    try {
        fs.mkdirSync(folderPath, { recursive: true });
        return { success: true };
    } catch (e) {
        return { error: e.message };
    }
});

ipcMain.handle('fs:rename', async (event, oldPath, newPath) => {
    try {
        fs.renameSync(oldPath, newPath);
        return { success: true };
    } catch (e) {
        return { error: e.message };
    }
});

ipcMain.handle('fs:delete', async (event, targetPath) => {
    if (!isPathAllowed(targetPath)) return { error: 'Access denied: path outside workspace' };
    try {
        const stat = fs.statSync(targetPath);
        if (stat.isDirectory()) {
            fs.rmSync(targetPath, { recursive: true });
        } else {
            fs.unlinkSync(targetPath);
        }
        return { success: true };
    } catch (e) {
        return { error: e.message };
    }
});

ipcMain.handle('fs:exists', async (event, targetPath) => {
    return fs.existsSync(targetPath);
});

// Dialog: Open file/folder dialog (used by NewProjectModal)
ipcMain.handle('dialog:showOpenDialog', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, options || {
        properties: ['openDirectory', 'createDirectory'],
        title: 'Select Location'
    });
    return result;
});

// Alias fs:mkdir to fs:createFolder for consistency
ipcMain.handle('fs:mkdir', async (event, folderPath) => {
    try {
        fs.mkdirSync(folderPath, { recursive: true });
        return { success: true };
    } catch (e) {
        return { error: e.message };
    }
});

// Detect installed compilers/interpreters
ipcMain.handle('system:detectLanguages', async () => {
    const results = {
        python: null,
        node: null,
        gcc: null,
        java: null
    };

    const checkCommand = (cmd) => {
        return new Promise((resolve) => {
            exec(`${cmd} --version`, (error, stdout) => {
                if (!error && stdout) {
                    resolve(stdout.trim().split('\n')[0]);
                } else {
                    resolve(null);
                }
            });
        });
    };

    // Check Python (try python3 first on Mac/Linux)
    results.python = await checkCommand('python3') || await checkCommand('python');

    // Check Node.js
    results.node = await checkCommand('node');

    // Check GCC
    results.gcc = await checkCommand('gcc');

    // Check Java
    results.java = await checkCommand('java');

    // Save to settings
    const settings = loadSettings();
    settings.detectedLanguages = results;
    saveSettings(settings);

    return results;
});

// Terminal execution — HARDENED with timeout and tree kill
ipcMain.handle('terminal:execute', (event, command, cwd) => {
    return new Promise((resolve) => {
        const Logger = require('./core/Logger.cjs');
        const id = Date.now().toString();
        const workingDir = cwd || workspacePath || os.homedir();

        // Validate CWD
        if (!isPathAllowed(workingDir)) {
            resolve({ id, error: 'Working directory not allowed' });
            return;
        }

        // Parse command
        const parts = command.trim().split(' ');
        let cmd = parts[0];
        let args = parts.slice(1);

        // Handle Python - use python3 on Mac/Linux
        if (cmd === 'python' && process.platform !== 'win32') {
            cmd = 'python3';
        }

        Logger.execution('terminal:execute', { cmd, args, cwd: workingDir });

        const proc = spawn(cmd, args, {
            cwd: workingDir,
            shell: true,
            env: { ...process.env, PYTHONUNBUFFERED: '1' }
        });

        runningProcesses.set(id, proc);

        let output = [];
        let stdoutLength = 0;
        const MAX_OUTPUT = 5 * 1024 * 1024; // 5MB cap
        let resolved = false;

        const safeResolve = (result) => {
            if (resolved) return;
            resolved = true;
            runningProcesses.delete(id);
            resolve(result);
        };

        // Enforce 60s timeout for terminal:execute
        const timeoutTimer = setTimeout(async () => {
            if (!resolved && proc.pid) {
                Logger.warn('terminal:execute timeout', { id, pid: proc.pid });
                await killProcessTree(proc.pid);
                safeResolve({ id, error: 'Execution timed out (60s)' });
            }
        }, 60000);

        proc.stdout.on('data', (data) => {
            const text = data.toString();
            stdoutLength += text.length;
            if (stdoutLength < MAX_OUTPUT) {
                output.push({ type: 'stdout', text });
            }
            mainWindow?.webContents.send('terminal:output', { id, type: 'stdout', text });
        });

        proc.stderr.on('data', (data) => {
            const text = data.toString();
            output.push({ type: 'stderr', text });
            mainWindow?.webContents.send('terminal:output', { id, type: 'stderr', text });
        });

        proc.on('close', (code) => {
            clearTimeout(timeoutTimer);
            mainWindow?.webContents.send('terminal:exit', { id, code });
            safeResolve({ id, code, output });
        });

        proc.on('error', (err) => {
            clearTimeout(timeoutTimer);
            const friendlyError = getFriendlyError(err, cmd);
            mainWindow?.webContents.send('terminal:error', { id, error: friendlyError });
            safeResolve({ id, error: friendlyError });
        });
    });
});

// Kill running process — HARDENED with tree kill
ipcMain.handle('terminal:kill', async (event, id) => {
    const proc = runningProcesses.get(id);
    if (proc) {
        try {
            if (proc.pid) {
                await killProcessTree(proc.pid);
            } else {
                proc.kill();
            }
            runningProcesses.delete(id);
            return { success: true };
        } catch (e) {
            runningProcesses.delete(id);
            return { error: e.message };
        }
    }
    return { error: 'Process not found' };
});

// Helper: Get friendly error message
function getFriendlyError(err, cmd) {
    if (err.code === 'ENOENT') {
        const langMap = {
            'python': 'Python is not installed. Please install Python from python.org',
            'python3': 'Python is not installed. Please install Python from python.org',
            'node': 'Node.js is not installed. Please install Node.js from nodejs.org',
            'gcc': 'GCC is not installed. Please install a C compiler.',
            'javac': 'Java JDK is not installed. Please install Java from adoptium.net',
            'java': 'Java is not installed. Please install Java from adoptium.net'
        };
        return langMap[cmd] || `Command '${cmd}' not found. Please make sure it's installed.`;
    }
    return err.message;
}

// Open external links
ipcMain.handle('shell:openExternal', (event, url) => {
    shell.openExternal(url);
});

// Get app info
ipcMain.handle('app:getInfo', () => ({
    version: app.getVersion(),
    name: app.getName(),
    platform: process.platform,
    isPackaged: app.isPackaged
}));

// Get path
ipcMain.handle('app:getPath', (event, name) => {
    return app.getPath(name);
});

// ============================================
// PTY (Real Terminal) Handlers
// ============================================

// Spawn a PTY process — HARDENED with logging
ipcMain.handle('pty:spawn', (event, { cmd, args = [], cwd, env = {} }) => {
    const Logger = require('./core/Logger.cjs');
    const id = `pty-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
        // Determine shell based on platform
        const shell = process.platform === 'win32'
            ? 'powershell.exe'
            : (process.env.SHELL || '/bin/zsh');

        let command = shell;
        let commandArgs = [];

        if (cmd) {
            // Run command directly (no shell wrapper) for better argument handling
            command = cmd;
            commandArgs = args;
        }

        const ptyProcess = pty.spawn(command, commandArgs, {
            name: 'xterm-256color',
            cols: 80,
            rows: 24,
            cwd: cwd || workspacePath || process.env.HOME,
            env: { ...process.env, ...env, PYTHONUNBUFFERED: '1', PYTHONIOENCODING: 'utf-8' }
        });

        ptyProcesses.set(id, ptyProcess);

        Logger.execution('pty:spawn', { id, command, args: commandArgs });

        // Send data to renderer
        ptyProcess.onData((data) => {
            mainWindow?.webContents.send('pty:data', { id, data });
        });

        // Handle exit
        ptyProcess.onExit(({ exitCode, signal }) => {
            Logger.execution('pty:exit', { id, exitCode, signal });
            ptyProcesses.delete(id);
            mainWindow?.webContents.send('pty:exit', { id, exitCode, signal });
        });

        return { id, success: true };
    } catch (err) {
        Logger.error('Failed to spawn PTY', { error: err.message });
        return { id, error: err.message };
    }
});

// Write to PTY stdin
ipcMain.handle('pty:write', (event, { id, data }) => {
    const ptyProcess = ptyProcesses.get(id);
    if (ptyProcess) {
        ptyProcess.write(data);
        return { success: true };
    }
    return { error: 'PTY not found' };
});

// Resize PTY
ipcMain.handle('pty:resize', (event, { id, cols, rows }) => {
    const ptyProcess = ptyProcesses.get(id);
    if (ptyProcess) {
        ptyProcess.resize(cols, rows);
        return { success: true };
    }
    return { error: 'PTY not found' };
});

// Kill PTY — HARDENED with tree kill
ipcMain.handle('pty:kill', async (event, id) => {
    const Logger = require('./core/Logger.cjs');
    const ptyProcess = ptyProcesses.get(id);
    if (ptyProcess) {
        try {
            // PTY processes on Windows also have child trees
            if (ptyProcess.pid) {
                Logger.execution('pty:kill', { id, pid: ptyProcess.pid });
                await killProcessTree(ptyProcess.pid).catch(() => {});
            }
            try { ptyProcess.kill(); } catch { /* already dead */ }
            ptyProcesses.delete(id);
            return { success: true };
        } catch (e) {
            ptyProcesses.delete(id);
            return { error: e.message };
        }
    }
    return { error: 'PTY not found' };
});

// ============================================
// Auth — Secure Token Storage (safeStorage)
// ============================================

ipcMain.handle('auth:storeToken', async (event, token) => {
    try {
        if (safeStorage.isEncryptionAvailable()) {
            const encrypted = safeStorage.encryptString(token);
            fs.writeFileSync(authTokenPath, encrypted);
        } else {
            // Fallback: store plain (not ideal, but works on all platforms)
            fs.writeFileSync(authTokenPath, token, 'utf8');
        }
        return { success: true };
    } catch (e) {
        return { error: e.message };
    }
});

ipcMain.handle('auth:getToken', async () => {
    try {
        if (!fs.existsSync(authTokenPath)) return null;

        if (safeStorage.isEncryptionAvailable()) {
            const encrypted = fs.readFileSync(authTokenPath);
            return safeStorage.decryptString(encrypted);
        } else {
            return fs.readFileSync(authTokenPath, 'utf8');
        }
    } catch (e) {
        return null;
    }
});

ipcMain.handle('auth:clearToken', async () => {
    try {
        if (fs.existsSync(authTokenPath)) {
            fs.unlinkSync(authTokenPath);
        }
        return { success: true };
    } catch (e) {
        return { error: e.message };
    }
});

// Get Python path (embedded or system)
ipcMain.handle('runtime:getPythonPath', async () => {
    // Check for embedded Python first
    const embeddedPython = path.join(app.getPath('userData'), 'runtimes', 'python',
        process.platform === 'win32' ? 'python.exe' : 'bin/python3');

    if (fs.existsSync(embeddedPython)) {
        return { path: embeddedPython, type: 'embedded' };
    }

    // Check system Python
    const pythonCommands = process.platform === 'win32'
        ? ['python', 'python3', 'py']
        : ['python3', 'python'];

    for (const cmd of pythonCommands) {
        try {
            const result = await new Promise((resolve) => {
                const child = exec(`${cmd} --version`, { timeout: 2000 }, (err, stdout) => {
                    if (!err && stdout) {
                        resolve({ found: true, version: stdout.trim() });
                    } else {
                        resolve({ found: false });
                    }
                    // Kill child if it hangs (though maxBuffer/timeout should handle it)
                });

                // Double safety timeout
                const timer = setTimeout(() => {
                    child.kill();
                    resolve({ found: false });
                }, 2100);

                child.on('exit', () => clearTimeout(timer));
            });
            if (result.found) {
                return { path: cmd, type: 'system', version: result.version };
            }
        } catch (e) {
            continue;
        }
    }

    return { path: null, error: 'Python not found' };
});

// Download file
ipcMain.handle('runtime:download', async (event, { url, targetPath }) => {
    const https = require('https');

    return new Promise((resolve) => {
        const download = (downloadUrl, redirectCount = 0) => {
            if (redirectCount > 5) {
                resolve({ error: 'Too many redirects' });
                return;
            }

            https.get(downloadUrl, (response) => {
                // Handle redirects
                if (response.statusCode === 301 || response.statusCode === 302) {
                    if (response.headers.location) {
                        download(response.headers.location, redirectCount + 1);
                        return;
                    }
                }

                if (response.statusCode !== 200) {
                    resolve({ error: `Download failed with status ${response.statusCode}` });
                    return;
                }

                const file = fs.createWriteStream(targetPath);
                const total = parseInt(response.headers['content-length'] || 0, 10);
                let downloaded = 0;

                response.on('data', (chunk) => {
                    downloaded += chunk.length;
                    const progress = total ? Math.round((downloaded / total) * 100) : 0;
                    mainWindow?.webContents.send('download:progress', progress);
                });

                response.pipe(file);

                file.on('finish', () => {
                    file.close();
                    resolve({ success: true });
                });

                file.on('error', (err) => {
                    fs.unlink(targetPath, () => { });
                    resolve({ error: err.message });
                });

            }).on('error', (err) => {
                fs.unlink(targetPath, () => { });
                resolve({ error: err.message });
            });
        };

        download(url);
    });
});

// Extract archive
ipcMain.handle('runtime:extract', async (event, { archivePath, targetDir }) => {
    const fs = require('fs');

    // Create target dir
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    return new Promise((resolve) => {
        let cmd, args;

        if (process.platform === 'win32') {
            // Use PowerShell for zip/tar on Windows
            cmd = 'powershell';
            // Assuming tar.gz for python builds
            args = ['-Command', `tar -xzf "${archivePath}" -C "${targetDir}"`];
        } else {
            // Use tar on macOS/Linux
            cmd = 'tar';
            args = ['-xzf', archivePath, '-C', targetDir];
        }

        const proc = spawn(cmd, args);

        proc.on('close', (code) => {
            if (code === 0) {
                // Cleanup archive
                fs.unlink(archivePath, () => { });
                resolve({ success: true });
            } else {
                resolve({ error: `Extraction failed with code ${code}` });
            }
        });

        proc.on('error', (err) => {
            resolve({ error: err.message });
        });
    });
});
