/**
 * Python Error Formatter - Beginner-Friendly Error Messages
 * Parses Python tracebacks and returns friendly, actionable error messages.
 */

export interface ParsedError {
    lineNumber: number | null;
    columnNumber: number | null;
    errorType: string;
    friendlyMessage: string;
    rawMessage: string;
    fullTraceback: string;
    suggestion?: string;
}

/**
 * Parse Python stderr output and extract error information
 */
export function parsePythonError(stderr: string): ParsedError {
    const lines = stderr.trim().split('\n');
    const lastLine = lines[lines.length - 1] || '';

    // Default parsed error
    let result: ParsedError = {
        lineNumber: null,
        columnNumber: null,
        errorType: 'Error',
        friendlyMessage: 'Something went wrong',
        rawMessage: stderr,
        fullTraceback: stderr,
    };

    // Try to extract line number from traceback
    // Format: File "xxx.py", line 5, in <module>
    const lineMatch = stderr.match(/File ".*?", line (\d+)/);
    if (lineMatch) {
        result.lineNumber = parseInt(lineMatch[1], 10);
    }

    // Try to extract column number (from caret position in syntax errors)
    // Python shows: "    ^" to indicate error position
    const caretMatch = stderr.match(/\n(\s*)\^+\s*\n/);
    if (caretMatch) {
        // Count spaces before caret
        result.columnNumber = caretMatch[1].length + 1;
    }

    // Try to get column from SyntaxError messages like "col 5"
    const colMatch = stderr.match(/column (\d+)|col (\d+)/i);
    if (colMatch) {
        result.columnNumber = parseInt(colMatch[1] || colMatch[2], 10);
    }

    // Parse error type and message
    const errorMatch = lastLine.match(/^(\w+Error|Exception): (.+)$/);
    if (errorMatch) {
        result.errorType = errorMatch[1];
        result.rawMessage = errorMatch[2];
        result.friendlyMessage = getFriendlyMessage(errorMatch[1], errorMatch[2], result.lineNumber);
    } else if (lastLine.includes('SyntaxError')) {
        result.errorType = 'SyntaxError';
        // Try to get the actual message
        const syntaxMatch = lastLine.match(/SyntaxError:\s*(.+)/);
        result.rawMessage = syntaxMatch ? syntaxMatch[1] : lastLine;
        result.friendlyMessage = getFriendlyMessage('SyntaxError', result.rawMessage, result.lineNumber);
    } else if (lastLine.includes('IndentationError')) {
        result.errorType = 'IndentationError';
        const indentMatch = lastLine.match(/IndentationError:\s*(.+)/);
        result.rawMessage = indentMatch ? indentMatch[1] : lastLine;
        result.friendlyMessage = getFriendlyMessage('IndentationError', result.rawMessage, result.lineNumber);
    }

    return result;
}

/**
 * Convert technical error types to beginner-friendly messages
 */
function getFriendlyMessage(errorType: string, rawMessage: string, lineNumber: number | null): string {
    const linePrefix = lineNumber ? `Line ${lineNumber}: ` : '';

    switch (errorType) {
        case 'SyntaxError':
            if (rawMessage.includes('EOL while scanning string')) {
                return `${linePrefix}Oops! You forgot to close a quote (") or (')`;
            }
            if (rawMessage.includes('unexpected EOF')) {
                return `${linePrefix}Something is missing at the end — maybe a closing bracket ) or ]?`;
            }
            if (rawMessage.includes('unterminated string')) {
                return `${linePrefix}You started a string but didn't close it. Add a matching quote!`;
            }
            if (rawMessage.includes("'(' was never closed")) {
                return `${linePrefix}You opened a parenthesis ( but never closed it with )`;
            }
            if (rawMessage.includes("'[' was never closed")) {
                return `${linePrefix}You opened a bracket [ but never closed it with ]`;
            }
            if (rawMessage.includes("'{' was never closed")) {
                return `${linePrefix}You opened a brace { but never closed it with }`;
            }
            if (rawMessage.includes('invalid syntax')) {
                return `${linePrefix}Python doesn't understand this line. Check for typos or missing colons (:)`;
            }
            if (rawMessage.includes('expected')) {
                return `${linePrefix}Python expected something different here. Check for missing brackets or colons.`;
            }
            if (rawMessage.includes('unmatched')) {
                return `${linePrefix}There's an extra closing bracket that doesn't match any opening one`;
            }
            return `${linePrefix}There's a typo or formatting issue. Double-check your code!`;

        case 'IndentationError':
            if (rawMessage.includes('expected an indented block')) {
                return `${linePrefix}This line needs to be indented (add spaces at the start)`;
            }
            if (rawMessage.includes('unexpected indent')) {
                return `${linePrefix}This line has too many spaces at the start. Remove some spaces.`;
            }
            if (rawMessage.includes('unindent does not match')) {
                return `${linePrefix}The spacing doesn't match the lines above. Make sure your indentation is consistent!`;
            }
            return `${linePrefix}The spacing is off. Make sure your code lines up correctly using spaces!`;

        case 'NameError':
            const varMatch = rawMessage.match(/name '(\w+)' is not defined/);
            if (varMatch) {
                const varName = varMatch[1];
                // Check for common typos
                if (varName === 'pritn' || varName === 'prnit' || varName === 'prnt') {
                    return `${linePrefix}Did you mean "print" instead of "${varName}"?`;
                }
                if (varName === 'ture' || varName === 'treu') {
                    return `${linePrefix}Did you mean "True" (capital T) instead of "${varName}"?`;
                }
                if (varName === 'flase' || varName === 'fasle') {
                    return `${linePrefix}Did you mean "False" (capital F) instead of "${varName}"?`;
                }
                return `${linePrefix}The variable "${varName}" doesn't exist yet. Did you forget to create it?`;
            }
            return `${linePrefix}You're using a variable that hasn't been created yet.`;

        case 'TypeError':
            if (rawMessage.includes('unsupported operand')) {
                return `${linePrefix}You're trying to mix things that don't work together (like adding text and numbers)`;
            }
            if (rawMessage.includes('not callable')) {
                return `${linePrefix}You're using parentheses () on something that isn't a function`;
            }
            if (rawMessage.includes('missing') && rawMessage.includes('argument')) {
                const argMatch = rawMessage.match(/missing (\d+) required/);
                if (argMatch) {
                    return `${linePrefix}This function is missing ${argMatch[1]} required value(s)`;
                }
                return `${linePrefix}A function is missing some required information`;
            }
            if (rawMessage.includes('object is not subscriptable')) {
                return `${linePrefix}You can't use [index] on this type of value`;
            }
            if (rawMessage.includes('object is not iterable')) {
                return `${linePrefix}You can't loop over this — it's not a list or collection`;
            }
            return `${linePrefix}You're using the wrong type of data here`;

        case 'ValueError':
            if (rawMessage.includes('invalid literal')) {
                return `${linePrefix}You're trying to convert text to a number, but the text isn't a valid number`;
            }
            if (rawMessage.includes('too many values to unpack')) {
                return `${linePrefix}You're trying to unpack more values than exist`;
            }
            if (rawMessage.includes('not enough values to unpack')) {
                return `${linePrefix}There aren't enough values to fill all your variables`;
            }
            return `${linePrefix}The value you're using doesn't work here`;

        case 'IndexError':
            if (rawMessage.includes('list index out of range')) {
                return `${linePrefix}You're trying to access an item that doesn't exist in the list. Remember: lists start at index 0!`;
            }
            if (rawMessage.includes('string index out of range')) {
                return `${linePrefix}You're trying to access a character position that doesn't exist in the string`;
            }
            return `${linePrefix}You're trying to access an item that doesn't exist`;

        case 'KeyError':
            const keyMatch = rawMessage.match(/'(.+)'/);
            if (keyMatch) {
                return `${linePrefix}The key "${keyMatch[1]}" doesn't exist in the dictionary`;
            }
            return `${linePrefix}You're looking for something in a dictionary that isn't there`;

        case 'ZeroDivisionError':
            return `${linePrefix}Oops! You can't divide by zero — it's mathematically impossible!`;

        case 'FileNotFoundError':
            const fileMatch = rawMessage.match(/\[Errno 2\] No such file or directory: '(.+)'/);
            if (fileMatch) {
                return `${linePrefix}The file "${fileMatch[1]}" doesn't exist. Check the filename and path.`;
            }
            return `${linePrefix}The file you're trying to open doesn't exist`;

        case 'ModuleNotFoundError':
            const modMatch = rawMessage.match(/No module named '(\w+)'/);
            if (modMatch) {
                return `${linePrefix}The module "${modMatch[1]}" isn't installed. You may need to install it with pip.`;
            }
            return `${linePrefix}A required module is missing`;

        case 'AttributeError':
            const attrMatch = rawMessage.match(/'(\w+)' object has no attribute '(\w+)'/);
            if (attrMatch) {
                return `${linePrefix}A ${attrMatch[1]} doesn't have something called "${attrMatch[2]}"`;
            }
            return `${linePrefix}You're trying to use something that doesn't exist on this object`;

        case 'RecursionError':
            return `${linePrefix}Your code is calling itself too many times! Check for an infinite loop in your functions.`;

        default:
            return `${linePrefix}${rawMessage}`;
    }
}

// ═══════════════════════════════════════════════════════════════
//  GCC / G++ Error Parser — Beginner-friendly C/C++ error messages
// ═══════════════════════════════════════════════════════════════

export function parseGccError(stderr: string): ParsedError {
    const lines = stderr.trim().split('\n');

    let result: ParsedError = {
        lineNumber: null,
        columnNumber: null,
        errorType: 'CompileError',
        friendlyMessage: 'Something went wrong during compilation',
        rawMessage: stderr,
        fullTraceback: stderr,
    };

    // GCC format: file.c:5:10: error: expected ';' before '}' token
    const gccMatch = stderr.match(/(\S+\.(?:c|cpp|cc|h|hpp)):(\d+):(\d+):\s*(error|warning|note):\s*(.+)/);
    if (gccMatch) {
        result.lineNumber = parseInt(gccMatch[2], 10);
        result.columnNumber = parseInt(gccMatch[3], 10);
        result.errorType = gccMatch[4] === 'warning' ? 'Warning' : 'CompileError';
        result.rawMessage = gccMatch[5];
        result.friendlyMessage = getGccFriendlyMessage(gccMatch[5], result.lineNumber);
    }

    // Linker error: undefined reference to 'xxx'
    const linkerMatch = stderr.match(/undefined reference to [`'](.+?)'/);
    if (linkerMatch) {
        result.errorType = 'LinkerError';
        result.friendlyMessage = `The function or variable "${linkerMatch[1]}" was used but never defined. Check spelling or add its implementation.`;
    }

    return result;
}

function getGccFriendlyMessage(rawMessage: string, lineNumber: number | null): string {
    const prefix = lineNumber ? `Line ${lineNumber}: ` : '';

    if (rawMessage.includes("expected ';'") || rawMessage.includes("expected ';' before")) {
        return `${prefix}You forgot a semicolon (;) at the end of the line`;
    }
    if (rawMessage.includes("undeclared") || rawMessage.includes("was not declared in this scope")) {
        const varMatch = rawMessage.match(/'(\w+)'/);
        const name = varMatch ? varMatch[1] : 'a variable';
        return `${prefix}"${name}" hasn't been declared yet. Did you forget to define it?`;
    }
    if (rawMessage.includes("implicit declaration of function")) {
        const fnMatch = rawMessage.match(/'(\w+)'/);
        const name = fnMatch ? fnMatch[1] : 'a function';
        return `${prefix}The function "${name}" is used before it's declared. Add a prototype or #include the right header.`;
    }
    if (rawMessage.includes("expected ')' before")) {
        return `${prefix}Missing closing parenthesis ). Check your brackets!`;
    }
    if (rawMessage.includes("expected '}' ")) {
        return `${prefix}Missing closing brace }. Make sure every { has a matching }.`;
    }
    if (rawMessage.includes("incompatible types") || rawMessage.includes("cannot convert")) {
        return `${prefix}You're mixing types that don't work together (like assigning text to an int)`;
    }
    if (rawMessage.includes("too few arguments") || rawMessage.includes("too many arguments")) {
        return `${prefix}The function was called with the wrong number of arguments`;
    }
    if (rawMessage.includes("return type") || rawMessage.includes("non-void function")) {
        return `${prefix}This function should return a value, but it doesn't. Add a return statement.`;
    }
    if (rawMessage.includes("redefinition of") || rawMessage.includes("redeclared")) {
        const nameMatch = rawMessage.match(/'(\w+)'/);
        return `${prefix}"${nameMatch?.[1] || 'Something'}" is defined more than once. Each name must be unique.`;
    }
    if (rawMessage.includes("array subscript") || rawMessage.includes("out of bounds")) {
        return `${prefix}You're trying to access an array element that doesn't exist. Check your index!`;
    }
    if (rawMessage.includes("dereferencing pointer to incomplete type")) {
        return `${prefix}You're using a pointer to a type that hasn't been fully defined yet`;
    }
    if (rawMessage.includes("format '%") || rawMessage.includes("format string")) {
        return `${prefix}The printf/scanf format doesn't match the variable type. Use %d for int, %f for float, %s for string.`;
    }

    return `${prefix}${rawMessage}`;
}

// ═══════════════════════════════════════════════════════════════
//  Java (javac) Error Parser — Beginner-friendly Java error messages
// ═══════════════════════════════════════════════════════════════

export function parseJavacError(stderr: string): ParsedError {
    let result: ParsedError = {
        lineNumber: null,
        columnNumber: null,
        errorType: 'CompileError',
        friendlyMessage: 'Something went wrong during compilation',
        rawMessage: stderr,
        fullTraceback: stderr,
    };

    // javac format: Main.java:5: error: ';' expected
    const javacMatch = stderr.match(/(\S+\.java):(\d+):\s*error:\s*(.+)/);
    if (javacMatch) {
        result.lineNumber = parseInt(javacMatch[2], 10);
        result.rawMessage = javacMatch[3];
        result.friendlyMessage = getJavacFriendlyMessage(javacMatch[3], result.lineNumber);
    }

    // Runtime exceptions: Exception in thread "main" java.lang.ArrayIndexOutOfBoundsException
    const runtimeMatch = stderr.match(/Exception in thread ".*?"\s+([\w.]+)(?::\s*(.+))?/);
    if (runtimeMatch) {
        result.errorType = runtimeMatch[1].split('.').pop() || 'RuntimeError';
        const message = runtimeMatch[2] || '';
        result.friendlyMessage = getJavaRuntimeFriendlyMessage(result.errorType, message, result.lineNumber);

        // Try to get line number from stack trace
        const stackMatch = stderr.match(/at\s+\w+\.main\([\w.]+:(\d+)\)/);
        if (stackMatch) {
            result.lineNumber = parseInt(stackMatch[1], 10);
        }
    }

    return result;
}

function getJavacFriendlyMessage(rawMessage: string, lineNumber: number | null): string {
    const prefix = lineNumber ? `Line ${lineNumber}: ` : '';

    if (rawMessage.includes("';' expected")) {
        return `${prefix}You forgot a semicolon (;) at the end of the statement`;
    }
    if (rawMessage.includes("cannot find symbol")) {
        const symbolMatch = rawMessage.match(/symbol:\s*(?:variable|method|class)\s+(\w+)/);
        if (symbolMatch) {
            return `${prefix}"${symbolMatch[1]}" doesn't exist. Check the spelling or make sure it's declared.`;
        }
        return `${prefix}Something you used hasn't been declared. Check variable and method names.`;
    }
    if (rawMessage.includes("class, interface, or enum expected")) {
        return `${prefix}There's code outside of a class. In Java, all code must be inside a class.`;
    }
    if (rawMessage.includes("reached end of file while parsing")) {
        return `${prefix}Missing closing brace }. Make sure every { has a matching }.`;
    }
    if (rawMessage.includes("incompatible types")) {
        return `${prefix}You're trying to assign a wrong type of value. Check your variable types.`;
    }
    if (rawMessage.includes("missing return statement")) {
        return `${prefix}This method should return a value but doesn't. Add a return statement.`;
    }
    if (rawMessage.includes("non-static method") || rawMessage.includes("non-static variable")) {
        return `${prefix}You're trying to use an instance method/variable from a static context. Create an object first or make it static.`;
    }
    if (rawMessage.includes("package") && rawMessage.includes("does not exist")) {
        const pkgMatch = rawMessage.match(/package\s+(\S+)/);
        return `${prefix}The package "${pkgMatch?.[1] || '...'}" doesn't exist. Check your import statement.`;
    }
    if (rawMessage.includes("unreported exception")) {
        return `${prefix}This code might throw an error. Surround it with try-catch or add "throws" to the method.`;
    }
    if (rawMessage.includes("already defined")) {
        return `${prefix}A variable with this name already exists in this scope. Use a different name.`;
    }

    return `${prefix}${rawMessage}`;
}

function getJavaRuntimeFriendlyMessage(errorType: string, message: string, lineNumber: number | null): string {
    const prefix = lineNumber ? `Line ${lineNumber}: ` : '';

    switch (errorType) {
        case 'ArrayIndexOutOfBoundsException':
            return `${prefix}You're trying to access an array element that doesn't exist. Remember: arrays start at index 0!`;
        case 'NullPointerException':
            return `${prefix}You're trying to use an object that is null (hasn't been created yet)`;
        case 'StringIndexOutOfBoundsException':
            return `${prefix}You're trying to access a character position that doesn't exist in the string`;
        case 'NumberFormatException':
            return `${prefix}You're trying to convert text to a number, but the text isn't a valid number`;
        case 'ArithmeticException':
            if (message.includes('/ by zero')) return `${prefix}You can't divide by zero!`;
            return `${prefix}A math error occurred: ${message}`;
        case 'StackOverflowError':
            return `${prefix}Your code is calling itself too many times! Check for infinite recursion.`;
        case 'ClassCastException':
            return `${prefix}You're trying to treat an object as the wrong type`;
        case 'InputMismatchException':
            return `${prefix}The input doesn't match what Scanner expected. If you used nextInt(), make sure to type a number.`;
        default:
            return `${prefix}${errorType}: ${message}`;
    }
}

// ═══════════════════════════════════════════════════════════════
//  Universal Error Dispatcher — picks the right parser by language
// ═══════════════════════════════════════════════════════════════

/**
 * Parse error output based on the language of the file that was run.
 * Falls back to Python parser for unknown languages.
 */
export function parseError(stderr: string, language: string): ParsedError {
    switch (language) {
        case 'python':
            return parsePythonError(stderr);
        case 'c':
        case 'cpp':
        case 'cc':
            return parseGccError(stderr);
        case 'java':
            return parseJavacError(stderr);
        default:
            // Generic fallback: try to extract a line number at minimum
            return parsePythonError(stderr);
    }
}

/**
 * Format execution result for display.
 * @param language — the source file's language (python, c, cpp, java, javascript, etc.)
 */
export function formatExecutionResult(
    stdout: string,
    stderr: string,
    exitCode: number,
    executionTime: number,
    language: string = 'python'
): {
    output: string;
    error: ParsedError | null;
    success: boolean;
    timeFormatted: string;
} {
    const timeFormatted = executionTime < 1000
        ? `${executionTime}ms`
        : `${(executionTime / 1000).toFixed(2)}s`;

    if (exitCode === 0 && !stderr) {
        return {
            output: stdout || '(No output)',
            error: null,
            success: true,
            timeFormatted,
        };
    }

    const error = stderr ? parseError(stderr, language) : null;

    return {
        output: stdout,
        error,
        success: exitCode === 0,
        timeFormatted,
    };
}
