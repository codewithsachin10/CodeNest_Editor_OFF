/**
 * CodeNest Studio — Auto-Updater Module
 *
 * Production-grade auto-update system using electron-updater.
 * - Silent background check on launch
 * - Non-intrusive update banner via IPC
 * - User-controlled install & restart
 * - Graceful offline handling (skip silently)
 * - Safe rollback — never blocks the app
 */

const { autoUpdater } = require('electron-updater');
const { ipcMain } = require('electron');

let mainWindowRef = null;
let updateState = {
    checking: false,
    available: false,
    downloaded: false,
    downloading: false,
    progress: 0,
    version: null,
    releaseNotes: null,
    error: null,
};

/**
 * Initialize the auto-updater.
 * Call once from main.cjs after mainWindow is created.
 *
 * @param {BrowserWindow} mainWindow
 */
function initAutoUpdater(mainWindow) {
    mainWindowRef = mainWindow;

    // ─── Configuration ─────────────────────────────────────────────
    autoUpdater.autoDownload = false;         // Don't auto-download — user must consent
    autoUpdater.autoInstallOnAppQuit = true;  // Install on quit if downloaded
    autoUpdater.allowPrerelease = false;      // Stable channel only
    autoUpdater.allowDowngrade = false;       // Never rollback without explicit action

    // Suppress error dialogs — we handle everything via IPC
    autoUpdater.logger = {
        info: (msg) => console.log('[Updater]', msg),
        warn: (msg) => console.warn('[Updater]', msg),
        error: (msg) => console.error('[Updater]', msg),
        debug: (msg) => console.log('[Updater:debug]', msg),
    };

    // ─── Events ────────────────────────────────────────────────────

    autoUpdater.on('checking-for-update', () => {
        updateState = { ...updateState, checking: true, error: null };
        sendToRenderer('updater:state', updateState);
    });

    autoUpdater.on('update-available', (info) => {
        updateState = {
            ...updateState,
            checking: false,
            available: true,
            version: info.version || null,
            releaseNotes: info.releaseNotes || null,
        };
        sendToRenderer('updater:state', updateState);
    });

    autoUpdater.on('update-not-available', () => {
        updateState = {
            ...updateState,
            checking: false,
            available: false,
        };
        sendToRenderer('updater:state', updateState);
    });

    autoUpdater.on('download-progress', (progress) => {
        updateState = {
            ...updateState,
            downloading: true,
            progress: Math.round(progress.percent || 0),
        };
        sendToRenderer('updater:state', updateState);
    });

    autoUpdater.on('update-downloaded', (info) => {
        updateState = {
            ...updateState,
            downloading: false,
            downloaded: true,
            version: info.version || updateState.version,
        };
        sendToRenderer('updater:state', updateState);
    });

    autoUpdater.on('error', (err) => {
        // Don't show errors if offline — just silently skip
        const isOffline = err?.message?.includes('net::ERR_INTERNET_DISCONNECTED') ||
            err?.message?.includes('net::ERR_NETWORK_CHANGED') ||
            err?.message?.includes('getaddrinfo ENOTFOUND') ||
            err?.message?.includes('ECONNREFUSED') ||
            err?.message?.includes('ETIMEDOUT');

        updateState = {
            ...updateState,
            checking: false,
            downloading: false,
            error: isOffline ? null : (err?.message || 'Update check failed'),
        };
        sendToRenderer('updater:state', updateState);
    });

    // ─── IPC Handlers ──────────────────────────────────────────────

    ipcMain.handle('updater:checkForUpdates', async () => {
        try {
            await autoUpdater.checkForUpdates();
            return { success: true };
        } catch (e) {
            return { error: e.message };
        }
    });

    ipcMain.handle('updater:downloadUpdate', async () => {
        try {
            await autoUpdater.downloadUpdate();
            return { success: true };
        } catch (e) {
            return { error: e.message };
        }
    });

    ipcMain.handle('updater:installUpdate', () => {
        // Quit and install — user initiated
        autoUpdater.quitAndInstall(false, true);
    });

    ipcMain.handle('updater:getState', () => {
        return updateState;
    });

    // ─── Auto-check on launch (delayed to not block startup) ──────
    setTimeout(() => {
        console.log('[Updater] Checking for updates...');
        autoUpdater.checkForUpdates().catch((err) => {
            console.log('[Updater] Auto-check skipped:', err?.message);
        });
    }, 5000); // 5s after window is ready
}

/**
 * Send a message to the renderer process.
 */
function sendToRenderer(channel, data) {
    try {
        if (mainWindowRef && !mainWindowRef.isDestroyed()) {
            mainWindowRef.webContents.send(channel, data);
        }
    } catch (e) {
        // Window might be closing — ignore
    }
}

module.exports = { initAutoUpdater };
