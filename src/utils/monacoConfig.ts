
import { loader } from "@monaco-editor/react";
import * as monaco from 'monaco-editor';

// ─── Monaco Worker setup for Vite (offline-first, LAZY) ─────────────────────
// Workers are created on-demand via dynamic import when a language is used.
// This avoids spawning all 5 workers at startup.

import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

// Cache workers — never create more than one of each type
const workerCache = new Map<string, Worker>();

(self as any).MonacoEnvironment = {
    getWorker(_: unknown, label: string) {
        const key = label === 'css' || label === 'scss' || label === 'less' ? 'css'
            : label === 'html' || label === 'handlebars' || label === 'razor' ? 'html'
            : label === 'typescript' || label === 'javascript' ? 'ts'
            : label === 'json' ? 'json'
            : 'editor';

        if (workerCache.has(key)) return workerCache.get(key)!;

        let worker: Worker;
        switch (key) {
            case 'json': worker = new jsonWorker(); break;
            case 'css': worker = new cssWorker(); break;
            case 'html': worker = new htmlWorker(); break;
            case 'ts': worker = new tsWorker(); break;
            default: worker = new editorWorker(); break;
        }
        workerCache.set(key, worker);
        return worker;
    },
};

// ─── OFFLINE-FIRST: Load Monaco from local node_modules, NOT CDN ─────────────
// This is CRITICAL for offline use. Without this, @monaco-editor/react fetches
// workers from https://cdn.jsdelivr.net at runtime, which fails without internet.

loader.config({ monaco });

// However, to get BETTER IntelliSense (like 'print' showing up in Python),
// we can configure the language defaults.

export const configureMonaco = (monaco: any) => {
    // Python Configuration
    monaco.languages.registerCompletionItemProvider('python', {
        provideCompletionItems: (model: any, position: any) => {
            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn,
            };

            const suggestions = [
                {
                    label: 'print',
                    kind: monaco.languages.CompletionItemKind.Function,
                    insertText: 'print(${1:object})',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Prints the values to a stream, or to sys.stdout by default.',
                    range: range,
                },
                {
                    label: 'def',
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: 'def ${1:name}(${2:params}):\n\t${3:pass}',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Define a new function',
                    range: range,
                },
                {
                    label: 'if',
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: 'if ${1:condition}:\n\t${2:pass}',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'If statement',
                    range: range,
                },
                {
                    label: 'for',
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: 'for ${1:item} in ${2:iterable}:\n\t${3:pass}',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'For loop',
                    range: range,
                },
                {
                    label: 'import',
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: 'import ',
                    documentation: 'Import module',
                    range: range,
                },
            ];

            return { suggestions: suggestions };
        }
    });

    // C Configuration
    monaco.languages.registerCompletionItemProvider('c', {
        provideCompletionItems: (model: any, position: any) => {
            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn,
            };

            const suggestions = [
                {
                    label: 'printf',
                    kind: monaco.languages.CompletionItemKind.Function,
                    insertText: 'printf("${1:%s}\\n", ${2:args});',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Write formatted output to stdout',
                    range: range,
                },
                {
                    label: 'main',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: 'int main() {\n\t${1}\n\treturn 0;\n}',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Main function template',
                    range: range,
                },
                {
                    label: '#include',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: '#include <${1:stdio.h}>',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Include header file',
                    range: range,
                }
            ];
            return { suggestions: suggestions };
        }
    });

    // Java Configuration
    monaco.languages.registerCompletionItemProvider('java', {
        provideCompletionItems: (model: any, position: any) => {
            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn,
            };

            const suggestions = [
                {
                    label: 'sout',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: 'System.out.println(${1});',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Print to standard output',
                    range: range,
                },
                {
                    label: 'main',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: 'public static void main(String[] args) {\n\t${1}\n}',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Main method',
                    range: range,
                },
                {
                    label: 'class',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: 'public class ${1:Name} {\n\t${2}\n}',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Class definition',
                    range: range,
                }
            ];
            return { suggestions: suggestions };
        }
    });

    // Compiler Options (for JS/TS error checking)
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
    });

    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2015,
        allowNonTsExtensions: true,
    });
};
