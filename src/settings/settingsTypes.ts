/**
 * CodeNest Studio — Professional Settings Type System
 * Every type here maps to a real, functional setting that affects IDE behavior.
 */

// ─── General ─────────────────────────────────────────────────────────────────

export type StartupBehavior = 'last-session' | 'empty-workspace';
export type AutoSaveMode = 'off' | 'on-focus-change' | 'on-delay';

export interface GeneralSettings {
    startupBehavior: StartupBehavior;
    autoSave: AutoSaveMode;
    autoSaveDelayMs: number;
    confirmBeforeExit: boolean;
}

// ─── Editor ──────────────────────────────────────────────────────────────────

export interface EditorSettings {
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    tabSize: number;
    insertSpaces: boolean;
    wordWrap: 'on' | 'off';
    highlightActiveLine: boolean;
    showLineNumbers: boolean;
    minimap: boolean;
}

// ─── Terminal ────────────────────────────────────────────────────────────────

export type CursorStyle = 'block' | 'line' | 'underline';

export interface TerminalSettings {
    defaultShell: string;
    fontFamily: string;
    fontSize: number;
    cursorStyle: CursorStyle;
    cursorBlink: boolean;
    scrollbackLines: number;
    clearOnRun: boolean;
}

// ─── Languages & Compilers ──────────────────────────────────────────────────

export type CStandard = 'c11' | 'c17';
export type CppStandard = 'c++14' | 'c++17' | 'c++20';

export interface PythonSettings {
    interpreterPath: string;
    unbuffered: boolean;
    defaultEncoding: string;
}

export interface CSettings {
    compilerPath: string;
    standard: CStandard;
    wallEnabled: boolean;
    wextraEnabled: boolean;
}

export interface CppSettings {
    compilerPath: string;
    standard: CppStandard;
    wallEnabled: boolean;
    wextraEnabled: boolean;
}

export interface JavaSettings {
    jdkPath: string;
    enablePreviewFeatures: boolean;
}

export interface JavaScriptSettings {
    nodePath: string;
}

export interface LanguageSettings {
    python: PythonSettings;
    c: CSettings;
    cpp: CppSettings;
    java: JavaSettings;
    javascript: JavaScriptSettings;
}

// ─── Run & Debug ────────────────────────────────────────────────────────────

export type RunMode = 'normal' | 'step-by-step';

export interface RunDebugSettings {
    defaultRunMode: RunMode;
    stopOnFirstError: boolean;
    showVariableInspector: boolean;
    clearOutputBeforeRun: boolean;
    maxExecutionTimeMs: number;
}

// ─── Project System ─────────────────────────────────────────────────────────

export type ProjectSortOrder = 'name' | 'type';

export interface ProjectSettings {
    defaultProjectLocation: string;
    autoCreateReadme: boolean;
    autoCreateGitignore: boolean;
    confirmBeforeDelete: boolean;
    sortOrder: ProjectSortOrder;
}

// ─── Appearance ─────────────────────────────────────────────────────────────

export type UIDensity = 'compact' | 'comfortable' | 'spacious';
export type IconStyle = 'minimal' | 'detailed';
export type ThemeEditorMode = 'beginner' | 'pro';

export interface AppearanceSettings {
    theme: 'dark' | 'light';
    editorThemeId: string;          // active theme preset or custom ID
    accentColor: string;
    uiDensity: UIDensity;
    panelAnimations: boolean;
    iconStyle: IconStyle;
    themeEditorMode: ThemeEditorMode; // beginner hides advanced, pro shows all
}

// ─── Keyboard Shortcuts ─────────────────────────────────────────────────────

export interface KeyboardShortcut {
    id: string;
    label: string;
    keys: string;
    category: string;
}

export interface KeyboardShortcutSettings {
    shortcuts: KeyboardShortcut[];
}

// ─── Beginner / Practice Mode ───────────────────────────────────────────────

export interface BeginnerModeSettings {
    beginnerMode: boolean;
    simplifiedUI: boolean;
    enforcesSaveBeforeRun: boolean;
    friendlyErrors: boolean;
    practiceMode: boolean;
    lockSettings: boolean;
}

// ─── Advanced ───────────────────────────────────────────────────────────────

export interface AdvancedSettings {
    experimentalFeatures: boolean;
    verboseLogs: boolean;
    multiTerminal: boolean;
    customEnvVars: Record<string, string>;
}

// ─── About & Diagnostics (read-only, not persisted) ─────────────────────────

export interface DiagnosticsInfo {
    appVersion: string;
    os: string;
    platform: string;
    pythonDetected: boolean;
    pythonVersion: string | null;
    gccDetected: boolean;
    gccVersion: string | null;
    javaDetected: boolean;
    javaVersion: string | null;
    nodeDetected: boolean;
    nodeVersion: string | null;
}

// ─── Master Settings Object ─────────────────────────────────────────────────

export interface CodeNestSettings {
    general: GeneralSettings;
    editor: EditorSettings;
    terminal: TerminalSettings;
    languages: LanguageSettings;
    runDebug: RunDebugSettings;
    project: ProjectSettings;
    appearance: AppearanceSettings;
    keyboardShortcuts: KeyboardShortcutSettings;
    beginnerMode: BeginnerModeSettings;
    advanced: AdvancedSettings;
}

// ─── Settings Category ID ───────────────────────────────────────────────────

export type SettingsCategoryId =
    | 'general'
    | 'editor'
    | 'terminal'
    | 'languages'
    | 'runDebug'
    | 'project'
    | 'appearance'
    | 'keyboardShortcuts'
    | 'beginnerMode'
    | 'advanced'
    | 'about';
