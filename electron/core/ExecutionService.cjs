/**
 * CodeNest Studio — Execution Service
 *
 * The ONLY entry point for running user code.
 * Implements the deterministic 10-step execution flow:
 *
 *   1. Acquire lock
 *   2. Save file
 *   3. Validate file exists
 *   4. Detect language
 *   5. Resolve compiler/interpreter path
 *   6. Compile (if compiled language)
 *   7. Run
 *   8. Capture stdout & stderr
 *   9. Classify errors
 *   10. Cleanup + return structured result
 *
 * RULES:
 *   - UI calls ExecutionService.run() via IPC. Nothing else.
 *   - Every run returns an ExecutionResult. Always.
 *   - No string-based error guessing.
 *   - Single active process enforced by ProcessManager.
 */

const fs = require('fs');
const path = require('path');
const { ProcessManager } = require('./ProcessManager.cjs');
const ErrorClassifier = require('./ErrorClassifier.cjs');
const Logger = require('./Logger.cjs');
const { resolveRunConfig } = require('../system/RuntimeResolver.cjs');
const { getExtension } = require('../system/PathUtils.cjs');

// Language detection map
const EXTENSION_MAP = {
    'py': 'python',
    'js': 'javascript',
    'c': 'c',
    'cpp': 'cpp',
    'cc': 'cpp',
    'cxx': 'cpp',
    'java': 'java',
};

const COMPILED_LANGUAGES = new Set(['c', 'cpp', 'java']);

class ExecutionService {
    /**
     * @param {object} options
     * @param {function(string, object): void} options.sendToRenderer — Send IPC events to renderer
     * @param {function(): object} options.getSettings — Get current language settings
     * @param {string} options.platform — process.platform
     * @param {string} [options.bundledRuntimesPath] — Path to bundled runtimes
     */
    constructor(options) {
        this._processManager = new ProcessManager();
        this._sendToRenderer = options.sendToRenderer;
        this._getSettings = options.getSettings;
        this._platform = options.platform;
        this._bundledRuntimesPath = options.bundledRuntimesPath || null;
        this._debounceUntil = 0; // Timestamp-based debounce
    }

    /**
     * Execute a file through the deterministic 10-step pipeline.
     *
     * @param {object} request
     * @param {string} request.filePath — Absolute path to the file
     * @param {string} request.content — File content to save
     * @param {string} request.cwd — Working directory
     * @param {number} request.timeoutMs — Execution timeout in ms
     * @returns {Promise<object>} ExecutionResult
     */
    async run(request) {
        const startTime = Date.now();

        // ─── Debounce check (prevent rapid Run spam) ─────────────
        if (Date.now() < this._debounceUntil) {
            Logger.warn('ExecutionService: Run rejected (debounce)', {
                waitMs: this._debounceUntil - Date.now(),
            });
            return this._makeResult({
                success: false,
                stderr: 'Please wait before running again.',
                errorType: 'system',
                errorMessage: 'Please wait before running again.',
                language: 'unknown',
                startTime,
            });
        }

        Logger.execution('run:start', {
            filePath: request.filePath,
            cwd: request.cwd,
            timeoutMs: request.timeoutMs,
        });

        try {
            // ─── Step 1: Acquire Lock ────────────────────────────
            this._sendState('saving');
            await this._processManager.acquireLock();

            // ─── Step 2: Save File ───────────────────────────────
            try {
                const dir = path.dirname(request.filePath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                fs.writeFileSync(request.filePath, request.content, 'utf-8');
            } catch (err) {
                Logger.error('ExecutionService: Save failed', { error: err.message });
                return this._finishRun({
                    success: false,
                    stderr: `Failed to save file: ${err.message}`,
                    errorType: 'system',
                    errorMessage: `Failed to save file: ${err.message}`,
                    language: 'unknown',
                    startTime,
                });
            }

            // ─── Step 3: Validate File Exists ────────────────────
            this._sendState('validating');
            if (!fs.existsSync(request.filePath)) {
                return this._finishRun({
                    success: false,
                    stderr: `File not found: ${request.filePath}`,
                    errorType: 'system',
                    errorMessage: 'File could not be found after saving.',
                    language: 'unknown',
                    startTime,
                });
            }

            // ─── Step 4: Detect Language ─────────────────────────
            const ext = getExtension(request.filePath);
            const language = EXTENSION_MAP[ext];
            if (!language) {
                return this._finishRun({
                    success: false,
                    stderr: `Unsupported file type: .${ext}`,
                    errorType: 'system',
                    errorMessage: `No runner configured for .${ext} files.`,
                    language: ext || 'unknown',
                    startTime,
                });
            }

            // ─── Step 4.5: Sandbox/Security Validations ──────────
            // Filesystem Isolation Guard: Prevent running code from system dirs
            const blockedDirs = ['/system', '/usr', '/etc', '/bin', 'c:\\windows', 'c:\\system32'];
            const fileLower = request.filePath.toLowerCase();
            const isBlocked = blockedDirs.some(blocked => fileLower.startsWith(blocked));
            
            if (isBlocked) {
                Logger.error('ExecutionService: Sandbox violation', { filePath: request.filePath });
                return this._finishRun({
                    success: false,
                    stderr: `[Security Error] Execution blocked.\nPath: ${request.filePath}\nCannot execute code inside operating system directories.`,
                    errorType: 'system',
                    errorMessage: `Sandbox violation: You cannot execute programs or access code located in system directories. Please move your project to a normal folder.`,
                    language: language,
                    startTime,
                });
            }

            // ─── Step 5: Resolve Compiler/Interpreter Path ───────
            const settings = this._getSettings();
            const langSettings = settings?.languages || {};
            const runConfig = resolveRunConfig(
                request.filePath,
                language,
                langSettings,
                this._platform,
                this._bundledRuntimesPath
            );

            if (!runConfig) {
                return this._finishRun({
                    success: false,
                    stderr: `No compiler/interpreter found for ${language}.`,
                    errorType: 'system',
                    errorMessage: `Could not find a ${language} compiler or interpreter. Please install it or set the path in Settings.`,
                    language,
                    startTime,
                });
            }

            // ─── Step 6: Compile (if compiled language) ──────────
            if (COMPILED_LANGUAGES.has(language) && runConfig.compileCmd) {
                this._sendState('compiling');
                this._sendToRenderer('execution:stdout', {
                    data: `Compiling ${path.basename(request.filePath)}...\n`,
                });

                Logger.execution('compile:start', {
                    cmd: runConfig.compileCmd,
                    args: runConfig.compileArgs,
                });

                const compileResult = await this._processManager.spawn(
                    runConfig.compileCmd,
                    runConfig.compileArgs || [],
                    {
                        cwd: request.cwd || path.dirname(request.filePath),
                        timeoutMs: 30000, // 30s compile timeout
                        onStdout: (data) => this._sendToRenderer('execution:stdout', { data }),
                        onStderr: (data) => this._sendToRenderer('execution:stderr', { data }),
                    }
                );

                if (compileResult.exitCode !== 0) {
                    // Compile failed
                    const classification = ErrorClassifier.classify(
                        compileResult.stderr,
                        compileResult.exitCode,
                        language,
                        compileResult.killed
                    );

                    Logger.execution('compile:failed', {
                        exitCode: compileResult.exitCode,
                        errorType: classification.errorType,
                    });

                    return this._finishRun({
                        success: false,
                        stdout: compileResult.stdout,
                        stderr: compileResult.stderr,
                        exitCode: compileResult.exitCode,
                        errorType: classification.errorType || 'compile',
                        errorMessage: classification.friendlyMessage,
                        errorLine: classification.lineNumber,
                        errorColumn: classification.columnNumber,
                        language,
                        killed: compileResult.killed,
                        startTime,
                    });
                }

                Logger.execution('compile:success');
            }

            // ─── Step 7 + 8: Run + Capture ───────────────────────
            this._sendState('running');
            this._sendToRenderer('execution:stdout', {
                data: `Running ${path.basename(request.filePath)}...\n`,
            });

            const runResult = await this._processManager.spawn(
                runConfig.cmd,
                runConfig.args || [],
                {
                    cwd: request.cwd || path.dirname(request.filePath),
                    timeoutMs: Math.min(request.timeoutMs || 5000, 5000), // STRICT 5s limitation (Sandbox Guard)
                    onStdout: (data) => this._sendToRenderer('execution:stdout', { data }),
                    onStderr: (data) => this._sendToRenderer('execution:stderr', { data }),
                }
            );

            // ─── Step 9: Classify ────────────────────────────────
            const classification = ErrorClassifier.classify(
                runResult.stderr,
                runResult.exitCode,
                language,
                runResult.killed
            );

            // ─── Step 10: Cleanup + Return ───────────────────────
            // Delete compiled binary (cleanup temp artifacts)
            if (runConfig.outputPath) {
                try {
                    if (fs.existsSync(runConfig.outputPath)) {
                        fs.unlinkSync(runConfig.outputPath);
                    }
                } catch {
                    // Cleanup is best-effort
                }
            }

            const success = runResult.exitCode === 0 && !classification.errorType;

            return this._finishRun({
                success,
                stdout: runResult.stdout,
                stderr: runResult.stderr,
                exitCode: runResult.exitCode,
                errorType: classification.errorType,
                errorMessage: classification.friendlyMessage,
                errorLine: classification.lineNumber,
                errorColumn: classification.columnNumber,
                language,
                killed: runResult.killed,
                startTime,
            });

        } catch (err) {
            Logger.error('ExecutionService: Unexpected error', { error: err.message, stack: err.stack });
            return this._finishRun({
                success: false,
                stderr: err.message,
                errorType: 'system',
                errorMessage: `Unexpected error: ${err.message}`,
                language: 'unknown',
                startTime,
            });
        }
    }

    /**
     * Stop the currently running execution.
     * @returns {Promise<{success: boolean}>}
     */
    async stop() {
        Logger.execution('run:stop');
        await this._processManager.killActive();
        this._processManager.releaseLock();
        this._sendState('done');
        return { success: true };
    }

    /**
     * Get current execution state.
     * @returns {{ locked: boolean, runId: number }}
     */
    getState() {
        return {
            locked: this._processManager.isLocked(),
            runId: this._processManager.getRunId(),
        };
    }

    /**
     * Get the ProcessManager instance (for cleanup on app quit).
     * @returns {ProcessManager}
     */
    getProcessManager() {
        return this._processManager;
    }

    // ─── Private Helpers ─────────────────────────────────────────────────

    /**
     * Finish a run: release lock, set debounce, return result.
     */
    _finishRun(params) {
        this._processManager.releaseLock();
        this._debounceUntil = Date.now() + 300; // 300ms debounce
        this._sendState('done');

        const result = this._makeResult(params);

        Logger.execution('run:complete', {
            success: result.success,
            language: result.language,
            durationMs: result.durationMs,
            errorType: result.errorType,
            exitCode: result.exitCode,
        });

        return result;
    }

    /**
     * Create a standardized ExecutionResult.
     */
    _makeResult(params) {
        return {
            success: params.success ?? false,
            stdout: params.stdout || '',
            stderr: params.stderr || '',
            exitCode: params.exitCode ?? (params.success ? 0 : 1),
            errorType: params.errorType || null,
            errorMessage: params.errorMessage || '',
            language: params.language || 'unknown',
            durationMs: Date.now() - (params.startTime || Date.now()),
            killed: params.killed || false,
            errorLine: params.errorLine || null,
            errorColumn: params.errorColumn || null,
        };
    }

    /**
     * Send execution state change to renderer.
     * @param {string} state
     */
    _sendState(state) {
        this._sendToRenderer('execution:state-change', { state });
    }
}

module.exports = { ExecutionService };
