/**
 * CodeNest Studio — Execution IPC Handlers
 *
 * Registers IPC handlers for the execution pipeline.
 * These are the ONLY IPC channels for code execution:
 *
 *   execution:run   → Start execution (returns ExecutionResult)
 *   execution:stop  → Stop current execution
 *   execution:state → Get current lock state
 *
 * The renderer streams are:
 *   execution:stdout       → Stdout data chunk
 *   execution:stderr       → Stderr data chunk
 *   execution:state-change → State transitions (saving → compiling → running → done)
 */

const { ipcMain } = require('electron');
const { ExecutionService } = require('../core/ExecutionService.cjs');
const Logger = require('../core/Logger.cjs');

/** @type {ExecutionService | null} */
let executionService = null;

/**
 * Initialize execution IPC handlers.
 *
 * @param {import('electron').BrowserWindow} mainWindow
 * @param {object} options
 * @param {function(): object} options.getSettings — Get current app settings
 * @param {string} [options.bundledRuntimesPath]
 */
function registerExecutionHandlers(mainWindow, options) {
    // Create the ExecutionService instance
    executionService = new ExecutionService({
        sendToRenderer: (channel, data) => {
            try {
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send(channel, data);
                }
            } catch {
                // Window closing — ignore
            }
        },
        getSettings: options.getSettings,
        platform: process.platform,
        bundledRuntimesPath: options.bundledRuntimesPath,
    });

    // ─── execution:run ───────────────────────────────────────────────
    ipcMain.handle('execution:run', async (event, request) => {
        try {
            if (!request || !request.filePath) {
                return {
                    success: false,
                    stdout: '',
                    stderr: 'Invalid execution request: filePath is required.',
                    exitCode: 1,
                    errorType: 'system',
                    errorMessage: 'Invalid request.',
                    language: 'unknown',
                    durationMs: 0,
                    killed: false,
                    errorLine: null,
                    errorColumn: null,
                };
            }

            return await executionService.run(request);
        } catch (err) {
            Logger.error('IPC execution:run error', { error: err.message });
            return {
                success: false,
                stdout: '',
                stderr: err.message,
                exitCode: 1,
                errorType: 'system',
                errorMessage: err.message,
                language: 'unknown',
                durationMs: 0,
                killed: false,
                errorLine: null,
                errorColumn: null,
            };
        }
    });

    // ─── execution:stop ──────────────────────────────────────────────
    ipcMain.handle('execution:stop', async () => {
        try {
            if (executionService) {
                return await executionService.stop();
            }
            return { success: false };
        } catch (err) {
            Logger.error('IPC execution:stop error', { error: err.message });
            return { success: false, error: err.message };
        }
    });

    // ─── execution:state ─────────────────────────────────────────────
    ipcMain.handle('execution:state', () => {
        if (executionService) {
            return executionService.getState();
        }
        return { locked: false, runId: 0 };
    });

    Logger.info('Execution IPC handlers registered');
}

/**
 * Get the ExecutionService instance (for cleanup on app quit).
 * @returns {ExecutionService | null}
 */
function getExecutionService() {
    return executionService;
}

module.exports = { registerExecutionHandlers, getExecutionService };
