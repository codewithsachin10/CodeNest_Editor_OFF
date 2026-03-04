/**
 * CodeNest Studio — Path Utilities
 *
 * Safe path handling for cross-platform file operations.
 * All file paths passed to spawn() MUST go through these utilities.
 *
 * Key problems solved:
 *   - Paths with spaces: C:\Program Files\Python\python.exe
 *   - Backslash normalization: C:\Users\John → C:/Users/John
 *   - File extension extraction
 */

const path = require('path');

/**
 * Quote a file path for safe use in command arguments.
 * Wraps in double quotes to handle spaces.
 *
 * @param {string} filePath
 * @returns {string} Quoted path
 */
function quotePath(filePath) {
    if (!filePath) return '""';
    // Already quoted
    if (filePath.startsWith('"') && filePath.endsWith('"')) return filePath;
    return `"${filePath}"`;
}

/**
 * Normalize path separators to forward slashes.
 * Useful for display, but spawn() on Windows needs native paths.
 *
 * @param {string} filePath
 * @returns {string}
 */
function normalizePath(filePath) {
    if (!filePath) return '';
    return filePath.replace(/\\/g, '/');
}

/**
 * Get file extension (without dot, lowercase).
 *
 * @param {string} filePath
 * @returns {string} Extension (e.g., 'py', 'cpp', 'java')
 */
function getExtension(filePath) {
    if (!filePath) return '';
    const ext = path.extname(filePath);
    return ext ? ext.slice(1).toLowerCase() : '';
}

/**
 * Get the output binary path for compiled languages.
 * e.g., main.c → main.exe (Windows) or main (Unix)
 *
 * @param {string} filePath — Source file path
 * @param {string} platform — 'win32', 'darwin', or 'linux'
 * @returns {string} Output binary path
 */
function getOutputBinaryPath(filePath, platform) {
    const parsed = path.parse(filePath);
    const ext = platform === 'win32' ? '.exe' : '';
    return path.join(parsed.dir, parsed.name + ext);
}

/**
 * Get class name from a Java file path.
 * e.g., /path/to/Main.java → Main
 *
 * @param {string} filePath
 * @returns {string}
 */
function getJavaClassName(filePath) {
    return path.basename(filePath, '.java');
}

/**
 * Get the directory portion of a file path.
 *
 * @param {string} filePath
 * @returns {string}
 */
function getDirectory(filePath) {
    return path.dirname(filePath);
}

/**
 * Validate that a path doesn't contain dangerous characters.
 *
 * @param {string} filePath
 * @returns {boolean}
 */
function isSafePath(filePath) {
    if (!filePath || typeof filePath !== 'string') return false;
    // Block command injection attempts
    const dangerous = /[;&|`$(){}[\]<>!]/;
    return !dangerous.test(filePath);
}

module.exports = {
    quotePath,
    normalizePath,
    getExtension,
    getOutputBinaryPath,
    getJavaClassName,
    getDirectory,
    isSafePath,
};
