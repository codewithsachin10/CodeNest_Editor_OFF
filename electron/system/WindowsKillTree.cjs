/**
 * CodeNest Studio — Windows-Safe Process Tree Kill
 *
 * On Windows, ChildProcess.kill() only kills the parent process.
 * Child processes (gcc, python, java) become orphaned zombies.
 *
 * This module uses `taskkill /PID <pid> /T /F` to kill the entire tree.
 *   /T = terminate all child processes
 *   /F = force termination (no graceful shutdown)
 *
 * On Unix, we kill the process group with SIGKILL.
 *
 * CRITICAL: This is the ONLY way to reliably stop execution on Windows.
 */

const { exec } = require('child_process');

/**
 * Kill a process and ALL its children.
 *
 * @param {number} pid — Process ID to kill
 * @returns {Promise<void>}
 */
function killProcessTree(pid) {
    return new Promise((resolve) => {
        if (!pid || pid <= 0) {
            resolve();
            return;
        }

        if (process.platform === 'win32') {
            // Windows: taskkill with /T (tree) and /F (force)
            exec(`taskkill /PID ${pid} /T /F`, (err) => {
                if (err) {
                    // Fallback: try WMIC-based kill for stubborn processes
                    exec(
                        `wmic process where (ParentProcessId=${pid}) delete`,
                        () => {
                            // Final attempt: direct kill
                            try { process.kill(pid, 'SIGKILL'); } catch { /* already dead */ }
                            resolve();
                        }
                    );
                } else {
                    resolve();
                }
            });
        } else {
            // Unix (macOS, Linux): kill the entire process group
            try {
                // Negative PID kills the process group
                process.kill(-pid, 'SIGKILL');
            } catch {
                try {
                    // Fallback: kill single process
                    process.kill(pid, 'SIGKILL');
                } catch {
                    // Process already dead — fine
                }
            }
            resolve();
        }
    });
}

/**
 * Check if a process is still running.
 *
 * @param {number} pid
 * @returns {boolean}
 */
function isProcessAlive(pid) {
    if (!pid || pid <= 0) return false;
    try {
        // Sending signal 0 checks if process exists without killing it
        process.kill(pid, 0);
        return true;
    } catch {
        return false;
    }
}

module.exports = { killProcessTree, isProcessAlive };
