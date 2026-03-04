import { describe, it, expect } from 'vitest';
import { parsePythonError } from '../../utils/errorFormatter';

describe('errorFormatter', () => {
    describe('parsePythonError', () => {
        it('should extract line and column number from SyntaxError', () => {
            const stderr = `
  File "/workspace/main.py", line 4
    if True
           ^
SyntaxError: expected ':'
            `.trim();

            const result = parsePythonError(stderr);
            expect(result.lineNumber).toBe(4);
            expect(result.columnNumber).toBe(12);
            expect(result.friendlyMessage).toContain('missing brackets or colons');
        });

        it('should correctly parse NameError', () => {
            const stderr = `
Traceback (most recent call last):
  File "/workspace/main.py", line 2, in <module>
    print(unknown_var)
NameError: name 'unknown_var' is not defined
            `.trim();

            const result = parsePythonError(stderr);
            expect(result.lineNumber).toBe(2);
            expect(result.errorType).toBe('NameError');
            expect(result.friendlyMessage).toContain('unknown_var');
        });

        it('should correctly parse TypeError', () => {
            const stderr = `
Traceback (most recent call last):
  File "/workspace/main.py", line 3, in <module>
    result = "hello" + 5
TypeError: can only concatenate str (not "int") to str
            `.trim();

            const result = parsePythonError(stderr);
            expect(result.lineNumber).toBe(3);
            expect(result.friendlyMessage).toContain('wrong type of data');
        });

        it('should correctly parse ValueError', () => {
            const stderr = `
Traceback (most recent call last):
  File "/workspace/main.py", line 1, in <module>
    int("hello")
ValueError: invalid literal for int() with base 10: 'hello'
            `.trim();

            const result = parsePythonError(stderr);
            expect(result.lineNumber).toBe(1);
            expect(result.errorType).toBe('ValueError');
        });
    });
});
