/**
 * CodeNest Studio — Structured Logger
 *
 * File-based logging for the main process.
 * Writes to {userData}/logs/app.log with automatic rotation.
 *
 * Log format:
 *   [2026-03-04T22:00:00.000Z] [INFO] Message
 *   [2026-03-04T22:00:01.000Z] [EXEC] run:start {"language":"python"}
 *
 * Rules:
 *   - Every execution event is logged
 *   - Every error is logged
 *   - Logs rotate at 5MB
 *   - Safe to call from anywhere in main process
 */

const fs = require('fs');
const path = require('path');

const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5 MB

let logDir = null;
let logFile = null;
let initialized = false;

/**
 * Initialize the logger with the app's userData path.
 * Call once during app startup.
 *
 * @param {string} userDataPath — app.getPath('userData')
 */
function initLogger(userDataPath) {
    logDir = path.join(userDataPath, 'logs');
    logFile = path.join(logDir, 'app.log');

    try {
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        rotateIfNeeded();
        initialized = true;
        info('Logger initialized', { logFile });
    } catch (err) {
        console.error('[Logger] Failed to initialize:', err.message);
    }
}

/**
 * Write an INFO level log.
 * @param {string} msg
 * @param {object} [data]
 */
function info(msg, data) {
    write('INFO', msg, data);
}

/**
 * Write a WARN level log.
 * @param {string} msg
 * @param {object} [data]
 */
function warn(msg, data) {
    write('WARN', msg, data);
}

/**
 * Write an ERROR level log.
 * @param {string} msg
 * @param {object} [data]
 */
function error(msg, data) {
    write('ERROR', msg, data);
}

/**
 * Write an EXEC level log (execution events).
 * @param {string} event — e.g., 'run:start', 'run:exit', 'kill:tree'
 * @param {object} [data] — structured data
 */
function execution(event, data) {
    write('EXEC', event, data);
}

/**
 * Internal write function.
 * @param {string} level
 * @param {string} msg
 * @param {object} [data]
 */
function write(level, msg, data) {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ' ' + JSON.stringify(data) : '';
    const line = `[${timestamp}] [${level}] ${msg}${dataStr}\n`;

    // Always write to console
    if (level === 'ERROR') {
        console.error(line.trimEnd());
    } else if (level === 'WARN') {
        console.warn(line.trimEnd());
    } else {
        console.log(line.trimEnd());
    }

    // Write to file (best effort — never crash on log failure)
    if (initialized && logFile) {
        try {
            fs.appendFileSync(logFile, line);
        } catch {
            // Disk full or permissions — ignore
        }
    }
}

/**
 * Rotate log file if it exceeds MAX_LOG_SIZE.
 */
function rotateIfNeeded() {
    try {
        if (!logFile || !fs.existsSync(logFile)) return;

        const stat = fs.statSync(logFile);
        if (stat.size > MAX_LOG_SIZE) {
            const rotated = logFile + '.1';
            // Remove old rotated file
            if (fs.existsSync(rotated)) {
                fs.unlinkSync(rotated);
            }
            // Rotate current to .1
            fs.renameSync(logFile, rotated);
        }
    } catch {
        // Ignore rotation errors
    }
}

/**
 * Get the path to the log file (for About/Diagnostics screen).
 * @returns {string|null}
 */
function getLogPath() {
    return logFile;
}

module.exports = {
    initLogger,
    info,
    warn,
    error,
    execution,
    getLogPath,
};
