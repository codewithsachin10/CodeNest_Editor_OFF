/**
 * CodeNest Studio — Error Classifier
 *
 * Classifies stderr output into structured error types.
 * Returns a deterministic classification — UI never guesses.
 *
 * Classification hierarchy:
 *   1. Timeout (killed by timer)
 *   2. Compile error (syntax errors, linker errors)
 *   3. Runtime error (exceptions, segfaults)
 *   4. Clean exit (no error)
 *
 * Each classification extracts:
 *   - errorType: 'compile' | 'runtime' | 'timeout' | null
 *   - friendlyMessage: human-readable message
 *   - lineNumber: source line (if extractable)
 *   - columnNumber: source column (if extractable)
 */

const Logger = require('./Logger.cjs');

/**
 * Classify execution output into a structured result.
 *
 * @param {string} stderr
 * @param {number} exitCode
 * @param {string} language — 'python', 'c', 'cpp', 'java', 'javascript'
 * @param {boolean} killed — was the process killed (timeout or user stop)
 * @returns {{ errorType: string|null, friendlyMessage: string, lineNumber: number|null, columnNumber: number|null }}
 */
function classify(stderr, exitCode, language, killed) {
    // 1. Timeout — always takes priority
    if (killed) {
        return {
            errorType: 'timeout',
            friendlyMessage: 'Program took too long and was stopped automatically.',
            lineNumber: null,
            columnNumber: null,
        };
    }

    // 2. Clean exit with no errors
    if (exitCode === 0 && (!stderr || !stderr.trim())) {
        return {
            errorType: null,
            friendlyMessage: '',
            lineNumber: null,
            columnNumber: null,
        };
    }

    // 3. Language-specific classification
    let result;
    switch (language) {
        case 'python':
            result = classifyPython(stderr);
            break;
        case 'c':
        case 'cpp':
            result = classifyGcc(stderr);
            break;
        case 'java':
            result = classifyJava(stderr);
            break;
        case 'javascript':
            result = classifyNode(stderr);
            break;
        default:
            result = classifyGeneric(stderr, exitCode);
            break;
    }

    Logger.execution('error:classified', {
        language,
        exitCode,
        errorType: result.errorType,
        lineNumber: result.lineNumber,
    });

    return result;
}

// ─── Python ──────────────────────────────────────────────────────────────────

function classifyPython(stderr) {
    if (!stderr) return noError();

    // Syntax errors (compile-time)
    if (/SyntaxError|IndentationError|TabError/.test(stderr)) {
        const lineMatch = stderr.match(/File\s+".*?",\s+line\s+(\d+)/);
        const colMatch = stderr.match(/\n\s*\^+\s*\n/);
        return {
            errorType: 'compile',
            friendlyMessage: extractPythonMessage(stderr) || 'Syntax error in your code.',
            lineNumber: lineMatch ? parseInt(lineMatch[1]) : null,
            columnNumber: null,
        };
    }

    // Runtime errors
    const runtimeErrors = [
        'NameError', 'TypeError', 'ValueError', 'IndexError', 'KeyError',
        'ZeroDivisionError', 'AttributeError', 'FileNotFoundError',
        'ImportError', 'ModuleNotFoundError', 'RuntimeError', 'OSError',
        'PermissionError', 'RecursionError', 'StopIteration',
        'UnicodeDecodeError', 'UnicodeEncodeError', 'OverflowError',
        'MemoryError',
    ];

    for (const errType of runtimeErrors) {
        if (stderr.includes(errType)) {
            const lineMatch = stderr.match(/File\s+".*?",\s+line\s+(\d+)/);
            return {
                errorType: 'runtime',
                friendlyMessage: extractPythonMessage(stderr) || `Runtime error: ${errType}`,
                lineNumber: lineMatch ? parseInt(lineMatch[1]) : null,
                columnNumber: null,
            };
        }
    }

    // Fallback: unknown Python error
    return {
        errorType: 'runtime',
        friendlyMessage: lastLine(stderr) || 'Unknown Python error.',
        lineNumber: null,
        columnNumber: null,
    };
}

function extractPythonMessage(stderr) {
    // Get the last meaningful line (usually the actual error message)
    const lines = stderr.trim().split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (line && !line.startsWith('File ') && !line.startsWith('^') && line !== '~') {
            return line;
        }
    }
    return null;
}

// ─── GCC / G++ ───────────────────────────────────────────────────────────────

function classifyGcc(stderr) {
    if (!stderr) return noError();

    // GCC error format: filename.c:LINE:COL: error: message
    const errorMatch = stderr.match(/:(\d+):(\d+):\s*error:\s*(.+)/);
    if (errorMatch) {
        return {
            errorType: 'compile',
            friendlyMessage: errorMatch[3].trim(),
            lineNumber: parseInt(errorMatch[1]),
            columnNumber: parseInt(errorMatch[2]),
        };
    }

    // GCC fatal error (e.g., file not found)
    const fatalMatch = stderr.match(/:(\d+):(\d+):\s*fatal error:\s*(.+)/);
    if (fatalMatch) {
        return {
            errorType: 'compile',
            friendlyMessage: fatalMatch[3].trim(),
            lineNumber: parseInt(fatalMatch[1]),
            columnNumber: parseInt(fatalMatch[2]),
        };
    }

    // Linker errors
    if (/undefined reference|multiple definition|ld returned/.test(stderr)) {
        return {
            errorType: 'compile',
            friendlyMessage: 'Linker error — a function or variable could not be found.',
            lineNumber: null,
            columnNumber: null,
        };
    }

    // Runtime errors (segfault, etc.)
    if (/Segmentation fault|segfault|SIGSEGV/.test(stderr)) {
        return {
            errorType: 'runtime',
            friendlyMessage: 'Segmentation fault — your program accessed invalid memory.',
            lineNumber: null,
            columnNumber: null,
        };
    }

    // GCC warnings only (exit code 0 but stderr has warnings)
    if (/:\d+:\d+:\s*warning:/.test(stderr)) {
        return {
            errorType: null, // Warnings are not errors
            friendlyMessage: '',
            lineNumber: null,
            columnNumber: null,
        };
    }

    return {
        errorType: 'runtime',
        friendlyMessage: lastLine(stderr) || 'Unknown C/C++ error.',
        lineNumber: null,
        columnNumber: null,
    };
}

// ─── Java ────────────────────────────────────────────────────────────────────

function classifyJava(stderr) {
    if (!stderr) return noError();

    // javac compile error: Filename.java:LINE: error: message
    const compileMatch = stderr.match(/\.java:(\d+):\s*error:\s*(.+)/);
    if (compileMatch) {
        return {
            errorType: 'compile',
            friendlyMessage: compileMatch[2].trim(),
            lineNumber: parseInt(compileMatch[1]),
            columnNumber: null,
        };
    }

    // Java runtime exceptions
    const runtimeMatch = stderr.match(/Exception in thread\s+".*?"\s+(.+?)(?:\n|$)/);
    if (runtimeMatch) {
        // Try to find line number from stack trace
        const lineMatch = stderr.match(/at\s+.+\(.*?:(\d+)\)/);
        return {
            errorType: 'runtime',
            friendlyMessage: runtimeMatch[1].trim(),
            lineNumber: lineMatch ? parseInt(lineMatch[1]) : null,
            columnNumber: null,
        };
    }

    // Java Error (OutOfMemoryError, StackOverflowError, etc.)
    const errorMatch = stderr.match(/java\.lang\.(\w+Error):\s*(.*)/);
    if (errorMatch) {
        return {
            errorType: 'runtime',
            friendlyMessage: `${errorMatch[1]}: ${errorMatch[2] || ''}`.trim(),
            lineNumber: null,
            columnNumber: null,
        };
    }

    return {
        errorType: 'runtime',
        friendlyMessage: lastLine(stderr) || 'Unknown Java error.',
        lineNumber: null,
        columnNumber: null,
    };
}

// ─── Node.js / JavaScript ────────────────────────────────────────────────────

function classifyNode(stderr) {
    if (!stderr) return noError();

    // SyntaxError
    if (/SyntaxError/.test(stderr)) {
        const lineMatch = stderr.match(/:(\d+)/);
        return {
            errorType: 'compile',
            friendlyMessage: extractNodeMessage(stderr) || 'Syntax error in your code.',
            lineNumber: lineMatch ? parseInt(lineMatch[1]) : null,
            columnNumber: null,
        };
    }

    // Runtime errors
    const nodeErrors = [
        'ReferenceError', 'TypeError', 'RangeError', 'URIError',
        'EvalError', 'Error',
    ];

    for (const errType of nodeErrors) {
        if (stderr.includes(errType)) {
            const lineMatch = stderr.match(/:(\d+):\d+/);
            return {
                errorType: 'runtime',
                friendlyMessage: extractNodeMessage(stderr) || `Runtime error: ${errType}`,
                lineNumber: lineMatch ? parseInt(lineMatch[1]) : null,
                columnNumber: null,
            };
        }
    }

    return {
        errorType: 'runtime',
        friendlyMessage: lastLine(stderr) || 'Unknown JavaScript error.',
        lineNumber: null,
        columnNumber: null,
    };
}

function extractNodeMessage(stderr) {
    const lines = stderr.trim().split('\n');
    for (const line of lines) {
        if (/Error:/.test(line)) {
            return line.trim();
        }
    }
    return lastLine(stderr);
}

// ─── Generic ─────────────────────────────────────────────────────────────────

function classifyGeneric(stderr, exitCode) {
    return {
        errorType: exitCode !== 0 ? 'runtime' : null,
        friendlyMessage: exitCode !== 0
            ? (lastLine(stderr) || 'Process exited with an error.')
            : '',
        lineNumber: null,
        columnNumber: null,
    };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function noError() {
    return { errorType: null, friendlyMessage: '', lineNumber: null, columnNumber: null };
}

function lastLine(text) {
    if (!text) return '';
    const lines = text.trim().split('\n');
    return lines[lines.length - 1]?.trim() || '';
}

module.exports = { classify };
