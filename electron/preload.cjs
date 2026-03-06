const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // Window controls
    window: {
        minimize: () => ipcRenderer.invoke('window:minimize'),
        maximize: () => ipcRenderer.invoke('window:maximize'),
        close: () => ipcRenderer.invoke('window:close'),
        isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
    },

    // Settings
    settings: {
        get: () => ipcRenderer.invoke('settings:get'),
        set: (settings) => ipcRenderer.invoke('settings:set', settings),
    },

    // Dialogs
    dialog: {
        openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
        showOpenDialog: (options) => ipcRenderer.invoke('dialog:showOpenDialog', options),
    },

    // Workspace
    workspace: {
        get: () => ipcRenderer.invoke('workspace:get'),
        set: (path) => ipcRenderer.invoke('workspace:set', path),
        createDefaults: (folderPath) => ipcRenderer.invoke('workspace:createDefaults', folderPath),
    },

    // File system
    fs: {
        readDir: (dirPath) => ipcRenderer.invoke('fs:readDir', dirPath),
        readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
        writeFile: (filePath, content) => ipcRenderer.invoke('fs:writeFile', filePath, content),
        createFile: (filePath, content) => ipcRenderer.invoke('fs:createFile', filePath, content),
        createFolder: (folderPath) => ipcRenderer.invoke('fs:createFolder', folderPath),
        mkdir: (folderPath) => ipcRenderer.invoke('fs:mkdir', folderPath),
        rename: (oldPath, newPath) => ipcRenderer.invoke('fs:rename', oldPath, newPath),
        delete: (targetPath) => ipcRenderer.invoke('fs:delete', targetPath),
        exists: (targetPath) => ipcRenderer.invoke('fs:exists', targetPath),
    },

    // System detection
    system: {
        detectLanguages: () => ipcRenderer.invoke('system:detectLanguages'),
    },

    // Terminal
    terminal: {
        execute: (command, cwd) => ipcRenderer.invoke('terminal:execute', command, cwd),
        kill: (id) => ipcRenderer.invoke('terminal:kill', id),
        onOutput: (callback) => {
            const handler = (event, data) => callback(data);
            ipcRenderer.on('terminal:output', handler);
            return () => ipcRenderer.removeListener('terminal:output', handler);
        },
        onExit: (callback) => {
            const handler = (event, data) => callback(data);
            ipcRenderer.on('terminal:exit', handler);
            return () => ipcRenderer.removeListener('terminal:exit', handler);
        },
        onError: (callback) => {
            const handler = (event, data) => callback(data);
            ipcRenderer.on('terminal:error', handler);
            return () => ipcRenderer.removeListener('terminal:error', handler);
        },
    },

    // Shell
    shell: {
        openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
    },

    // App info
    app: {
        getInfo: () => ipcRenderer.invoke('app:getInfo'),
        getPath: (name) => ipcRenderer.invoke('app:getPath', name),
    },

    // PTY (Real Terminal)
    pty: {
        spawn: (options) => ipcRenderer.invoke('pty:spawn', options),
        write: (id, data) => ipcRenderer.invoke('pty:write', { id, data }),
        resize: (id, cols, rows) => ipcRenderer.invoke('pty:resize', { id, cols, rows }),
        kill: (id) => ipcRenderer.invoke('pty:kill', id),
        onData: (callback) => {
            const handler = (event, data) => callback(data);
            ipcRenderer.on('pty:data', handler);
            return () => ipcRenderer.removeListener('pty:data', handler);
        },
        onExit: (callback) => {
            const handler = (event, data) => callback(data);
            ipcRenderer.on('pty:exit', handler);
            return () => ipcRenderer.removeListener('pty:exit', handler);
        },
    },

    // Runtime detection & management
    runtime: {
        getPythonPath: () => ipcRenderer.invoke('runtime:getPythonPath'),
        download: (url, targetPath) => ipcRenderer.invoke('runtime:download', { url, targetPath }),
        extract: (archivePath, targetDir) => ipcRenderer.invoke('runtime:extract', { archivePath, targetDir }),
        onProgress: (callback) => {
            const handler = (event, progress) => callback(progress);
            ipcRenderer.on('download:progress', handler);
            return () => ipcRenderer.removeListener('download:progress', handler);
        },
    },

    // ═══ Execution Engine (NEW — deterministic pipeline) ═══════════════
    // This is the ONLY API for running user code.
    // UI must call execution.run() instead of pty.spawn() for the Run button.
    execution: {
        run: (request) => ipcRenderer.invoke('execution:run', request),
        stop: () => ipcRenderer.invoke('execution:stop'),
        getState: () => ipcRenderer.invoke('execution:state'),
        onStdout: (callback) => {
            const handler = (event, data) => callback(data);
            ipcRenderer.on('execution:stdout', handler);
            return () => ipcRenderer.removeListener('execution:stdout', handler);
        },
        onStderr: (callback) => {
            const handler = (event, data) => callback(data);
            ipcRenderer.on('execution:stderr', handler);
            return () => ipcRenderer.removeListener('execution:stderr', handler);
        },
        onStateChange: (callback) => {
            const handler = (event, data) => callback(data);
            ipcRenderer.on('execution:state-change', handler);
            return () => ipcRenderer.removeListener('execution:state-change', handler);
        },
    },

    // Auth — secure token storage via safeStorage
    auth: {
        storeToken: (token) => ipcRenderer.invoke('auth:storeToken', token),
        getToken: () => ipcRenderer.invoke('auth:getToken'),
        clearToken: () => ipcRenderer.invoke('auth:clearToken'),
    },

    // Mini Offline Git
    git: {
        init: (path) => ipcRenderer.invoke('git:init', path),
        status: (path) => ipcRenderer.invoke('git:status', path),
        commit: (path, msg) => ipcRenderer.invoke('git:commit', path, msg),
        log: (path) => ipcRenderer.invoke('git:log', path),
        restore: (path, hash) => ipcRenderer.invoke('git:restore', path, hash),
    },

    // Auto-Updater
    updater: {
        checkForUpdates: () => ipcRenderer.invoke('updater:checkForUpdates'),
        downloadUpdate: () => ipcRenderer.invoke('updater:downloadUpdate'),
        installUpdate: () => ipcRenderer.invoke('updater:installUpdate'),
        getState: () => ipcRenderer.invoke('updater:getState'),
        onStateChange: (callback) => {
            const handler = (event, state) => callback(state);
            ipcRenderer.on('updater:state', handler);
            return () => ipcRenderer.removeListener('updater:state', handler);
        },
    },

    // Check if running in Electron
    isElectron: true,
});
