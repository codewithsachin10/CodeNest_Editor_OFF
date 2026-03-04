/**
 * CodeNest Studio — Process Manager
 *
 * Manages the lifecycle of spawned processes with:
 *   - Single active process lock (only ONE execution at a time)
 *   - spawn() using child_process.spawn (NOT exec)
 *   - NO shell: true (prevents shell injection + enables reliable kill)
 *   - Windows-safe process tree kill via taskkill
 *   - Main-process timeout enforcement (reliable, not renderer-side)
 *   - Proper listener cleanup
 *   - UTF-8 output handling
 *
 * RULES:
 *   1. Only ONE process may be active at any time
 *   2. Starting a new run KILLS the previous process first
 *   3. All processes have an enforced timeout
 *   4. Every spawn/kill/exit is logged
 */

const { spawn } = require('child_process');
const { killProcessTree, isProcessAlive } = require('../system/WindowsKillTree.cjs');
const Logger = require('./Logger.cjs');

class ProcessManager {
    constructor() {
        /** @type {import('child_process').ChildProcess | null} */
        this._activeProcess = null;

        /** @type {boolean} */
        this._locked = false;

        /** @type {NodeJS.Timeout | null} */
        this._timeoutTimer = null;

        /** @type {number} */
        this._runCounter = 0;
    }

    /**
     * Acquire the execution lock.
     * If a process is already running, kill it first.
     *
     * @returns {Promise<boolean>} true if lock acquired
     */
    async acquireLock() {
        if (this._locked && this._activeProcess) {
            Logger.warn('ProcessManager: Lock held — killing existing process', {
                pid: this._activeProcess.pid,
            });
            await this.killActive();
        }
        this._locked = true;
        this._runCounter++;
        Logger.execution('lock:acquired', { runId: this._runCounter });
        return true;
    }

    /**
     * Release the execution lock.
     */
    releaseLock() {
        this._locked = false;
        this._activeProcess = null;
        if (this._timeoutTimer) {
            clearTimeout(this._timeoutTimer);
            this._timeoutTimer = null;
        }
        Logger.execution('lock:released', { runId: this._runCounter });
    }

    /**
     * Check if the lock is currently held.
     * @returns {boolean}
     */
    isLocked() {
        return this._locked;
    }

    /**
     * Get the current run counter (for debugging).
     * @returns {number}
     */
    getRunId() {
        return this._runCounter;
    }

    /**
     * Spawn a process and capture stdout/stderr separately.
     *
     * @param {string} cmd — Executable path (e.g., 'python3', 'gcc')
     * @param {string[]} args — Arguments array
     * @param {object} options
     * @param {string} options.cwd — Working directory
     * @param {number} options.timeoutMs — Timeout in ms (0 = no timeout)
     * @param {function(string): void} options.onStdout — Stdout data callback
     * @param {function(string): void} options.onStderr — Stderr data callback
     * @param {object} [options.env] — Extra environment variables
     * @returns {Promise<{exitCode: number, killed: boolean, stdout: string, stderr: string}>}
     */
    spawn(cmd, args, options) {
        return new Promise((resolve) => {
            const runId = this._runCounter;

            Logger.execution('process:spawn', {
                runId,
                cmd,
                args,
                cwd: options.cwd,
                timeoutMs: options.timeoutMs,
            });

            // CRITICAL: shell: false — prevents injection + enables reliable kill
            const proc = spawn(cmd, args, {
                cwd: options.cwd,
                env: {
                    ...process.env,
                    PYTHONUNBUFFERED: '1',
                    PYTHONIOENCODING: 'utf-8',
                    ...(options.env || {}),
                },
                stdio: ['pipe', 'pipe', 'pipe'],
                windowsHide: true,
                // IMPORTANT: NO shell: true
            });

            this._activeProcess = proc;
            let killed = false;
            let stdoutBuf = '';
            let stderrBuf = '';
            let resolved = false;

            // Guard against double-resolve
            const safeResolve = (result) => {
                if (resolved) return;
                resolved = true;
                this._activeProcess = null;
                if (this._timeoutTimer) {
                    clearTimeout(this._timeoutTimer);
                    this._timeoutTimer = null;
                }
                resolve(result);
            };

            // Output buffer cap — prevents OOM from infinite output loops
            // (e.g., while True: print('x'))
            const MAX_OUTPUT_SIZE = 10 * 1024 * 1024; // 10MB
            let totalOutputSize = 0;

            // UTF-8 decoding for output streams
            if (proc.stdout) {
                proc.stdout.setEncoding('utf-8');
                proc.stdout.on('data', (chunk) => {
                    totalOutputSize += chunk.length;
                    if (totalOutputSize < MAX_OUTPUT_SIZE) {
                        stdoutBuf += chunk;
                    }
                    if (options.onStdout) options.onStdout(chunk);

                    // Kill process if output exceeds limit
                    if (totalOutputSize >= MAX_OUTPUT_SIZE && !killed) {
                        killed = true;
                        Logger.warn('ProcessManager: Output limit exceeded', {
                            runId, totalOutputSize, MAX_OUTPUT_SIZE,
                        });
                        killProcessTree(proc.pid).catch(() => {});
                    }
                });
            }

            if (proc.stderr) {
                proc.stderr.setEncoding('utf-8');
                proc.stderr.on('data', (chunk) => {
                    totalOutputSize += chunk.length;
                    if (totalOutputSize < MAX_OUTPUT_SIZE) {
                        stderrBuf += chunk;
                    }
                    if (options.onStderr) options.onStderr(chunk);
                });
            }

            // Timeout enforcement (main process — reliable)
            if (options.timeoutMs > 0) {
                this._timeoutTimer = setTimeout(async () => {
                    if (!resolved && proc.pid) {
                        killed = true;
                        Logger.execution('process:timeout', {
                            runId,
                            pid: proc.pid,
                            timeoutMs: options.timeoutMs,
                        });
                        await killProcessTree(proc.pid);
                    }
                }, options.timeoutMs);
            }

            // Handle process exit
            proc.on('close', (code) => {
                Logger.execution('process:exit', {
                    runId,
                    exitCode: code,
                    killed,
                    stdoutLength: stdoutBuf.length,
                    stderrLength: stderrBuf.length,
                });
                safeResolve({
                    exitCode: code ?? 1,
                    killed,
                    stdout: stdoutBuf,
                    stderr: stderrBuf,
                });
            });

            // Handle spawn errors (e.g., ENOENT — command not found)
            proc.on('error', (err) => {
                Logger.error('ProcessManager: Spawn error', {
                    runId,
                    cmd,
                    error: err.message,
                    code: err.code,
                });
                safeResolve({
                    exitCode: 1,
                    killed: false,
                    stdout: stdoutBuf,
                    stderr: err.code === 'ENOENT'
                        ? `Command not found: ${cmd}. Please check that it is installed and in your PATH.`
                        : err.message,
                });
            });
        });
    }

    /**
     * Kill the currently active process and all its children.
     *
     * @returns {Promise<void>}
     */
    async killActive() {
        if (!this._activeProcess) return;

        const pid = this._activeProcess.pid;
        if (!pid) return;

        Logger.execution('process:kill', { pid, runId: this._runCounter });

        await killProcessTree(pid);
        this._activeProcess = null;

        if (this._timeoutTimer) {
            clearTimeout(this._timeoutTimer);
            this._timeoutTimer = null;
        }
    }

    /**
     * Kill ALL tracked processes. Called on app quit.
     *
     * @param {Map} runningProcesses — The legacy running processes map
     * @param {Map} ptyProcesses — The PTY processes map
     */
    async killAll(runningProcesses, ptyProcesses) {
        // Kill active execution
        await this.killActive();

        // Kill legacy running processes
        if (runningProcesses) {
            for (const [id, proc] of runningProcesses) {
                try {
                    if (proc.pid) await killProcessTree(proc.pid);
                    else proc.kill();
                } catch { /* already dead */ }
            }
            runningProcesses.clear();
        }

        // Kill PTY processes
        if (ptyProcesses) {
            for (const [id, proc] of ptyProcesses) {
                try { proc.kill(); } catch { /* already dead */ }
            }
            ptyProcesses.clear();
        }

        Logger.execution('killAll:complete');
    }
}

module.exports = { ProcessManager };
