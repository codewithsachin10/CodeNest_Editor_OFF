/**
 * CodeNest Studio — Core Type Definitions
 *
 * Shared types for the execution pipeline.
 * Used by both the main process (via JSDoc) and the renderer (via TypeScript).
 *
 * RULE: This file contains ZERO logic. Types and constants only.
 */

// ─── Execution Result ────────────────────────────────────────────────────────

/**
 * The ONLY structure returned from every code execution.
 * UI renders based exclusively on this — no string parsing, no guesswork.
 */
export interface ExecutionResult {
    /** Whether the program ran to completion without errors */
    success: boolean;

    /** Captured standard output (UTF-8) */
    stdout: string;

    /** Captured standard error (UTF-8) */
    stderr: string;

    /** Process exit code (0 = success, non-zero = error) */
    exitCode: number;

    /** Classified error type — null if no error */
    errorType: 'compile' | 'runtime' | 'timeout' | 'system' | null;

    /** Human-readable error message (already friendly) */
    errorMessage: string;

    /** Source language that was executed */
    language: string;

    /** Total execution time in milliseconds */
    durationMs: number;

    /** Whether the process was killed (timeout or user stop) */
    killed: boolean;

    /** Error line number (if applicable) */
    errorLine: number | null;

    /** Error column number (if applicable) */
    errorColumn: number | null;
}

// ─── Execution Request ───────────────────────────────────────────────────────

/**
 * Input to ExecutionService.run().
 * Everything needed to execute a file deterministically.
 */
export interface ExecutionRequest {
    /** Absolute path to the file on disk */
    filePath: string;

    /** File content to save before execution */
    content: string;

    /** Detected language (from file extension) */
    language: string;

    /** Working directory for the process */
    cwd: string;

    /** Maximum execution time in milliseconds (0 = no limit) */
    timeoutMs: number;
}

// ─── Execution State ─────────────────────────────────────────────────────────

/**
 * Granular state of the execution pipeline.
 * Used by the UI to show appropriate feedback.
 */
export type ExecutionState =
    | 'idle'
    | 'saving'
    | 'validating'
    | 'compiling'
    | 'running'
    | 'done';

// ─── Language Detection ──────────────────────────────────────────────────────

/** Maps file extensions to language identifiers. */
export const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
    'py': 'python',
    'js': 'javascript',
    'c': 'c',
    'cpp': 'cpp',
    'cc': 'cpp',
    'cxx': 'cpp',
    'java': 'java',
};

/** Languages that require a compile step before execution. */
export const COMPILED_LANGUAGES = new Set(['c', 'cpp', 'java']);

/** Languages that are directly interpreted. */
export const INTERPRETED_LANGUAGES = new Set(['python', 'javascript']);

// ─── Run Configuration ──────────────────────────────────────────────────────

/**
 * Resolved command + arguments for spawning a process.
 * Produced by RuntimeResolver, consumed by ProcessManager.
 */
export interface RunConfig {
    /** The executable to spawn (e.g., 'python3', 'gcc') */
    cmd: string;

    /** Arguments for the executable */
    args: string[];

    /** Compile command (for compiled languages only) */
    compileCmd?: string;

    /** Compile arguments */
    compileArgs?: string[];

    /** Path to the compiled output binary (for compiled languages) */
    outputPath?: string;
}

// ─── Error Classification ────────────────────────────────────────────────────

export interface ClassificationResult {
    errorType: 'compile' | 'runtime' | 'timeout' | null;
    friendlyMessage: string;
    lineNumber: number | null;
    columnNumber: number | null;
}

// ─── Runtime Info ────────────────────────────────────────────────────────────

export interface RuntimeInfo {
    /** Path to the compiler/interpreter */
    path: string;

    /** Source: 'settings', 'bundled', or 'system' */
    source: 'settings' | 'bundled' | 'system';

    /** Version string (if detected) */
    version?: string;
}
