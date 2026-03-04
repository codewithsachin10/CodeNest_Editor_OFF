/**
 * CodeNest Studio — Professional Theme Type System
 * VS Code–level customizable editor theme with syntax color tokens,
 * shell/UI colors, font settings, and density options.
 */

// ─── Syntax Token Colors ────────────────────────────────────────────────────

export interface SyntaxColors {
    comment: string;
    keyword: string;
    string: string;
    number: string;
    function: string;
    type: string;
    variable: string;
    constant: string;
    operator: string;
    error: string;
}

// ─── Shell / UI Colors ─────────────────────────────────────────────────────

export interface ShellColors {
    background: string;       // App base background
    foreground: string;       // Primary text
    titlebar: string;         // Title bar / top bar
    activityBar: string;      // Activity bar strip (left icon column)
    sidebar: string;          // Sidebar background
    editor: string;           // Editor area background
    terminal: string;         // Terminal pane background
    border: string;           // Panel borders
    accent: string;           // Primary accent (buttons, highlights)
    activeLine: string;       // Active line highlight
    selection: string;        // Text selection background
    cursor: string;           // Cursor / caret color
    lineNumbers: string;      // Line number foreground
    lineNumbersActive: string;// Active line number foreground
    textMuted: string;        // Secondary / muted text
    success: string;
    error: string;
    warning: string;
}

// ─── Font Settings ──────────────────────────────────────────────────────────

export interface ThemeFontSettings {
    family: string;
    size: number;
    lineHeight: number;
    weight: 300 | 400 | 500 | 600 | 700;
    ligatures: boolean;
}

// ─── Complete Editor Theme ──────────────────────────────────────────────────

export interface EditorThemePreset {
    id: string;
    name: string;
    type: 'dark' | 'light';
    builtIn: boolean;           // true = ships with app, false = user-created
    description: string;
    shellColors: ShellColors;
    syntaxColors: SyntaxColors;
    fontSettings: ThemeFontSettings;
}

// ─── Custom Theme Overrides (partial, merge on top of a base preset) ────────

export type CustomThemeOverrides = {
    shellColors?: Partial<ShellColors>;
    syntaxColors?: Partial<SyntaxColors>;
    fontSettings?: Partial<ThemeFontSettings>;
};

// ─── Saved Custom Theme (stored in localStorage) ────────────────────────────

export interface SavedCustomTheme {
    id: string;
    name: string;
    basePresetId: string;       // which built-in it was forked from
    overrides: CustomThemeOverrides;
    createdAt: number;
    updatedAt: number;
}

// ─── Resolved Theme (what you actually render with) ─────────────────────────

export type ResolvedTheme = EditorThemePreset;

// ─── Theme Mode (beginner sees presets only, pro sees full editor) ──────────

export type ThemeMode = 'beginner' | 'pro';

// ─── Default Font Families ──────────────────────────────────────────────────

export const MONO_FONT_FAMILIES = [
    '"JetBrains Mono", monospace',
    '"Fira Code", monospace',
    '"Cascadia Code", monospace',
    '"Source Code Pro", monospace',
    '"SF Mono", monospace',
    '"Consolas", monospace',
    '"IBM Plex Mono", monospace',
    '"Menlo", monospace',
    'monospace',
] as const;

// ─── Default Font Settings ──────────────────────────────────────────────────

export const DEFAULT_FONT_SETTINGS: ThemeFontSettings = {
    family: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
    size: 14,
    lineHeight: 1.5,
    weight: 400,
    ligatures: true,
};
