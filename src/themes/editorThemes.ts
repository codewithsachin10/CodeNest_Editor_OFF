import type { editor } from 'monaco-editor';

export interface Theme {
    id: string;
    name: string;
    type: 'dark' | 'light';
    monacoTheme: string;
    colors: {
        background: string;
        foreground: string;
        titlebar: string;
        sidebar: string;
        editor: string;
        terminal: string;
        border: string;
        accent: string;
        activeLine: string;
        selection: string;
    };
}

export const themes: Theme[] = [
    {
        id: 'dark-plus',
        name: 'Midnight Slate',
        type: 'dark',
        monacoTheme: 'midnight-slate',
        colors: {
            background: '#020617',
            foreground: '#E5E7EB',
            titlebar: '#0F172A',
            sidebar: '#111827',
            editor: '#0F172A',
            terminal: '#0F172A',
            border: '#1E293B',
            accent: '#38BDF8',
            activeLine: '#1E293B',
            selection: 'rgba(30, 58, 138, 0.4)',
        },
    },
    {
        id: 'light-plus',
        name: 'Clean Daylight',
        type: 'light',
        monacoTheme: 'vs',
        colors: {
            background: '#F8FAFC',
            foreground: '#1E293B',
            titlebar: '#F1F5F9',
            sidebar: '#F1F5F9',
            editor: '#FFFFFF',
            terminal: '#F1F5F9',
            border: '#E2E8F0',
            accent: '#0284C7',
            activeLine: '#F1F5F9',
            selection: 'rgba(2, 132, 199, 0.12)',
        },
    },
    {
        id: 'dracula',
        name: 'Dracula',
        type: 'dark',
        monacoTheme: 'dracula',
        colors: {
            background: '#282a36',
            foreground: '#f8f8f2',
            titlebar: '#21222c',
            sidebar: '#21222c',
            editor: '#282a36',
            terminal: '#1d1e26',
            border: '#44475a',
            accent: '#bd93f9',
            activeLine: '#44475a',
            selection: 'rgba(189, 147, 249, 0.3)',
        },
    },
    {
        id: 'nord',
        name: 'Nord',
        type: 'dark',
        monacoTheme: 'nord',
        colors: {
            background: '#2e3440',
            foreground: '#d8dee9',
            titlebar: '#242933',
            sidebar: '#2e3440',
            editor: '#2e3440',
            terminal: '#242933',
            border: '#3b4252',
            accent: '#88c0d0',
            activeLine: '#3b4252',
            selection: 'rgba(136, 192, 208, 0.3)',
        },
    },
];

export const getThemeById = (id: string): Theme => {
    return themes.find(t => t.id === id) || themes[0];
};

// Custom Monaco themes
export const customMonacoThemes: Record<string, editor.IStandaloneThemeData> = {
    'midnight-slate': {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '64748B', fontStyle: 'italic' },
            { token: 'keyword', foreground: '60A5FA' },
            { token: 'string', foreground: '34D399' },
            { token: 'number', foreground: 'FBBF24' },
            { token: 'type', foreground: '67E8F9', fontStyle: 'italic' },
            { token: 'function', foreground: 'A78BFA' },
            { token: 'variable', foreground: 'E5E7EB' },
            { token: 'constant', foreground: 'F87171' },
            { token: 'operator', foreground: '94A3B8' },
        ],
        colors: {
            'editor.background': '#0F172A',
            'editor.foreground': '#E5E7EB',
            'editor.lineHighlightBackground': '#1E293B',
            'editor.selectionBackground': '#1E3A8A66',
            'editorCursor.foreground': '#38BDF8',
            'editorLineNumber.foreground': '#475569',
            'editorLineNumber.activeForeground': '#94A3B8',
            'editor.selectionHighlightBackground': '#1E3A8A33',
            'editorIndentGuide.background': '#1E293B',
            'editorIndentGuide.activeBackground': '#334155',
        },
    },
    dracula: {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
            { token: 'keyword', foreground: 'ff79c6' },
            { token: 'string', foreground: 'f1fa8c' },
            { token: 'number', foreground: 'bd93f9' },
            { token: 'type', foreground: '8be9fd', fontStyle: 'italic' },
            { token: 'function', foreground: '50fa7b' },
            { token: 'variable', foreground: 'f8f8f2' },
            { token: 'constant', foreground: 'bd93f9' },
        ],
        colors: {
            'editor.background': '#282a36',
            'editor.foreground': '#f8f8f2',
            'editor.lineHighlightBackground': '#44475a',
            'editor.selectionBackground': '#44475a',
            'editorCursor.foreground': '#f8f8f0',
            'editorLineNumber.foreground': '#6272a4',
            'editorLineNumber.activeForeground': '#f8f8f2',
        },
    },
    nord: {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '616e88', fontStyle: 'italic' },
            { token: 'keyword', foreground: '81a1c1' },
            { token: 'string', foreground: 'a3be8c' },
            { token: 'number', foreground: 'b48ead' },
            { token: 'type', foreground: '8fbcbb' },
            { token: 'function', foreground: '88c0d0' },
            { token: 'variable', foreground: 'd8dee9' },
        ],
        colors: {
            'editor.background': '#2e3440',
            'editor.foreground': '#d8dee9',
            'editor.lineHighlightBackground': '#3b4252',
            'editor.selectionBackground': '#434c5e',
            'editorCursor.foreground': '#d8dee9',
            'editorLineNumber.foreground': '#4c566a',
            'editorLineNumber.activeForeground': '#d8dee9',
        },
    },
};
