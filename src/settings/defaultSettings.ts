/**
 * CodeNest Studio — Default Settings
 * Every default is carefully chosen for a beginner-friendly experience.
 */

import type { CodeNestSettings, KeyboardShortcut } from './settingsTypes';

const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent);
const mod = isMac ? '⌘' : 'Ctrl';

export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
    { id: 'run', label: 'Run Code', keys: `${mod}+Enter`, category: 'Execution' },
    { id: 'stop', label: 'Stop Execution', keys: `${mod}+Shift+C`, category: 'Execution' },
    { id: 'save', label: 'Save File', keys: `${mod}+S`, category: 'File' },
    { id: 'newFile', label: 'New File', keys: `${mod}+N`, category: 'File' },
    { id: 'closeTab', label: 'Close Tab', keys: `${mod}+W`, category: 'File' },
    { id: 'commandPalette', label: 'Command Palette', keys: `${mod}+Shift+P`, category: 'Navigation' },
    { id: 'toggleSidebar', label: 'Toggle Sidebar', keys: `${mod}+B`, category: 'View' },
    { id: 'toggleTerminal', label: 'Toggle Terminal', keys: `${mod}+\``, category: 'View' },
    { id: 'settings', label: 'Open Settings', keys: `${mod}+,`, category: 'Navigation' },
    { id: 'zoomIn', label: 'Zoom In', keys: `${mod}+=`, category: 'View' },
    { id: 'zoomOut', label: 'Zoom Out', keys: `${mod}+-`, category: 'View' },
    { id: 'find', label: 'Find in File', keys: `${mod}+F`, category: 'Edit' },
    { id: 'replace', label: 'Find and Replace', keys: `${mod}+H`, category: 'Edit' },
    { id: 'debug', label: 'Start Debug', keys: `F5`, category: 'Execution' },
];

export const DEFAULT_SETTINGS: CodeNestSettings = {
    general: {
        startupBehavior: 'last-session',
        autoSave: 'on-delay',
        autoSaveDelayMs: 5000,
        confirmBeforeExit: true,
    },

    editor: {
        fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas", monospace',
        fontSize: 14,
        lineHeight: 1.5,
        tabSize: 4,
        insertSpaces: true,
        wordWrap: 'off',
        highlightActiveLine: true,
        showLineNumbers: true,
        minimap: false,
    },

    terminal: {
        defaultShell: isMac ? '/bin/zsh' : (typeof navigator !== 'undefined' && /Win/.test(navigator.userAgent) ? 'powershell.exe' : '/bin/bash'),
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        fontSize: 13,
        cursorStyle: 'block',
        cursorBlink: true,
        scrollbackLines: 1000,
        clearOnRun: true,
    },

    languages: {
        python: {
            interpreterPath: 'auto',
            unbuffered: true,
            defaultEncoding: 'utf-8',
        },
        c: {
            compilerPath: 'gcc',
            standard: 'c17',
            wallEnabled: true,
            wextraEnabled: false,
        },
        cpp: {
            compilerPath: 'g++',
            standard: 'c++17',
            wallEnabled: true,
            wextraEnabled: false,
        },
        java: {
            jdkPath: 'auto',
            enablePreviewFeatures: false,
        },
        javascript: {
            nodePath: 'node',
        },
    },

    runDebug: {
        defaultRunMode: 'normal',
        stopOnFirstError: false,
        showVariableInspector: true,
        clearOutputBeforeRun: true,
        maxExecutionTimeMs: 30000,
    },

    project: {
        defaultProjectLocation: '',
        autoCreateReadme: true,
        autoCreateGitignore: false,
        confirmBeforeDelete: true,
        sortOrder: 'type',
    },

    appearance: {
        theme: 'dark',
        editorThemeId: 'midnight-slate',
        accentColor: '#38BDF8',
        uiDensity: 'comfortable',
        panelAnimations: true,
        iconStyle: 'minimal',
        themeEditorMode: 'beginner',
    },

    keyboardShortcuts: {
        shortcuts: [...DEFAULT_SHORTCUTS],
    },

    beginnerMode: {
        beginnerMode: true,
        simplifiedUI: true,
        enforcesSaveBeforeRun: true,
        friendlyErrors: true,
        practiceMode: false,
        lockSettings: false,
    },

    advanced: {
        experimentalFeatures: false,
        verboseLogs: false,
        multiTerminal: false,
        customEnvVars: {},
    },
};
