/**
 * CodeNest Studio — Theme Context
 * Provides the active resolved theme throughout the app.
 * Manages custom theme persistence (localStorage), preset selection,
 * and live Monaco theme generation.
 */

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type {
    EditorThemePreset,
    SavedCustomTheme,
    CustomThemeOverrides,
    ResolvedTheme,
    ShellColors,
    SyntaxColors,
    ThemeFontSettings,
} from './themeTypes';
import { DEFAULT_FONT_SETTINGS } from './themeTypes';
import { BUILT_IN_THEMES, getPresetById, MIDNIGHT_SLATE } from './themePresets';
import type { editor } from 'monaco-editor';

// ─── Storage ─────────────────────────────────────────────────────────────────

const CUSTOM_THEMES_KEY = 'codenest-custom-themes';
const ACTIVE_THEME_KEY = 'codenest-active-theme-id';

function loadCustomThemes(): SavedCustomTheme[] {
    try {
        const raw = localStorage.getItem(CUSTOM_THEMES_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function persistCustomThemes(themes: SavedCustomTheme[]): void {
    try {
        localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(themes));
    } catch (e) {
        console.warn('Failed to persist custom themes:', e);
    }
}

function loadActiveThemeId(): string {
    try {
        return localStorage.getItem(ACTIVE_THEME_KEY) || 'midnight-slate';
    } catch {
        return 'midnight-slate';
    }
}

function persistActiveThemeId(id: string): void {
    try {
        localStorage.setItem(ACTIVE_THEME_KEY, id);
    } catch (e) {
        console.warn('Failed to persist active theme ID:', e);
    }
}

// ─── Resolve a Custom Theme into a full EditorThemePreset ────────────────────

function resolveCustomTheme(saved: SavedCustomTheme): EditorThemePreset {
    const base = getPresetById(saved.basePresetId) || MIDNIGHT_SLATE;
    return {
        id: saved.id,
        name: saved.name,
        type: base.type,
        builtIn: false,
        description: `Custom theme based on ${base.name}`,
        shellColors: { ...base.shellColors, ...saved.overrides.shellColors } as ShellColors,
        syntaxColors: { ...base.syntaxColors, ...saved.overrides.syntaxColors } as SyntaxColors,
        fontSettings: { ...base.fontSettings, ...saved.overrides.fontSettings } as ThemeFontSettings,
    };
}

// ─── Generate Monaco IStandaloneThemeData from a resolved theme ──────────────

export function themeToMonacoData(theme: ResolvedTheme): editor.IStandaloneThemeData {
    const { syntaxColors, shellColors } = theme;
    const base: editor.BuiltinTheme = theme.type === 'dark' ? 'vs-dark' : 'vs';

    return {
        base,
        inherit: true,
        rules: [
            { token: 'comment', foreground: stripHash(syntaxColors.comment), fontStyle: 'italic' },
            { token: 'keyword', foreground: stripHash(syntaxColors.keyword) },
            { token: 'string', foreground: stripHash(syntaxColors.string) },
            { token: 'number', foreground: stripHash(syntaxColors.number) },
            { token: 'type', foreground: stripHash(syntaxColors.type), fontStyle: 'italic' },
            { token: 'function', foreground: stripHash(syntaxColors.function) },
            { token: 'variable', foreground: stripHash(syntaxColors.variable) },
            { token: 'constant', foreground: stripHash(syntaxColors.constant) },
            { token: 'operator', foreground: stripHash(syntaxColors.operator) },
        ],
        colors: {
            'editor.background': shellColors.editor,
            'editor.foreground': shellColors.foreground,
            'editor.lineHighlightBackground': shellColors.activeLine,
            'editor.selectionBackground': shellColors.selection,
            'editorCursor.foreground': shellColors.cursor,
            'editorLineNumber.foreground': shellColors.lineNumbers,
            'editorLineNumber.activeForeground': shellColors.lineNumbersActive,
            'editor.selectionHighlightBackground': shellColors.selection,
            'editorIndentGuide.background': shellColors.border,
            'editorIndentGuide.activeBackground': shellColors.activeLine,
        },
    };
}

function stripHash(color: string): string {
    return color.startsWith('#') ? color.slice(1) : color;
}

// ─── Context Interface ──────────────────────────────────────────────────────

interface ThemeContextValue {
    /** Currently active, fully resolved theme */
    activeTheme: ResolvedTheme;

    /** ID of the currently active theme */
    activeThemeId: string;

    /** All available themes (built-in + custom) */
    allThemes: EditorThemePreset[];

    /** All built-in presets */
    builtInThemes: EditorThemePreset[];

    /** All user-created custom themes */
    customThemes: SavedCustomTheme[];

    /** Switch the active theme by ID */
    setActiveTheme: (id: string) => void;

    /** Save a new custom theme (or update existing) */
    saveCustomTheme: (theme: SavedCustomTheme) => void;

    /** Delete a custom theme by ID */
    deleteCustomTheme: (id: string) => void;

    /** Export a theme as JSON string */
    exportTheme: (id: string) => string;

    /** Import a theme from JSON string, returns the parsed SavedCustomTheme */
    importTheme: (json: string) => SavedCustomTheme | null;

    /** Generate Monaco theme data for the current active theme */
    getMonacoThemeData: () => editor.IStandaloneThemeData;

    /** A unique name for the active theme to register in Monaco */
    monacoThemeName: string;

    /** Is the current theme dark? */
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [activeThemeId, setActiveThemeIdState] = useState<string>(loadActiveThemeId);
    const [customThemes, setCustomThemes] = useState<SavedCustomTheme[]>(loadCustomThemes);

    // Persist custom themes whenever they change
    useEffect(() => {
        persistCustomThemes(customThemes);
    }, [customThemes]);

    // All available themes (built-in + resolved custom)
    const allThemes = useMemo<EditorThemePreset[]>(() => {
        const resolved = customThemes.map(resolveCustomTheme);
        return [...BUILT_IN_THEMES, ...resolved];
    }, [customThemes]);

    // Active resolved theme
    const activeTheme = useMemo<ResolvedTheme>(() => {
        return allThemes.find(t => t.id === activeThemeId) || MIDNIGHT_SLATE;
    }, [activeThemeId, allThemes]);

    const monacoThemeName = useMemo(() => {
        return `codenest-${activeTheme.id}`;
    }, [activeTheme.id]);

    // Set active theme
    const setActiveTheme = useCallback((id: string) => {
        setActiveThemeIdState(id);
        persistActiveThemeId(id);
    }, []);

    // Save custom theme
    const saveCustomTheme = useCallback((theme: SavedCustomTheme) => {
        setCustomThemes(prev => {
            const idx = prev.findIndex(t => t.id === theme.id);
            if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = { ...theme, updatedAt: Date.now() };
                return updated;
            }
            return [...prev, { ...theme, createdAt: Date.now(), updatedAt: Date.now() }];
        });
    }, []);

    // Delete custom theme
    const deleteCustomTheme = useCallback((id: string) => {
        setCustomThemes(prev => prev.filter(t => t.id !== id));
        // If the deleted theme was active, fall back to Midnight Slate
        if (activeThemeId === id) {
            setActiveTheme('midnight-slate');
        }
    }, [activeThemeId, setActiveTheme]);

    // Export
    const exportTheme = useCallback((id: string): string => {
        const custom = customThemes.find(t => t.id === id);
        if (custom) return JSON.stringify(custom, null, 2);
        const preset = getPresetById(id);
        if (preset) {
            // Export built-in as a custom theme template
            const asCustom: SavedCustomTheme = {
                id: `${preset.id}-export`,
                name: `${preset.name} (Copy)`,
                basePresetId: preset.id,
                overrides: {},
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };
            return JSON.stringify(asCustom, null, 2);
        }
        return '{}';
    }, [customThemes]);

    // Import
    const importTheme = useCallback((json: string): SavedCustomTheme | null => {
        try {
            const parsed = JSON.parse(json) as SavedCustomTheme;
            if (!parsed.id || !parsed.name || !parsed.basePresetId) return null;
            // Ensure unique ID
            const uniqueId = `imported-${Date.now()}`;
            const theme: SavedCustomTheme = {
                ...parsed,
                id: uniqueId,
                name: `${parsed.name} (Imported)`,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };
            saveCustomTheme(theme);
            return theme;
        } catch {
            return null;
        }
    }, [saveCustomTheme]);

    // Monaco theme data
    const getMonacoThemeData = useCallback((): editor.IStandaloneThemeData => {
        return themeToMonacoData(activeTheme);
    }, [activeTheme]);

    return (
        <ThemeContext.Provider
            value={{
                activeTheme,
                activeThemeId,
                allThemes,
                builtInThemes: BUILT_IN_THEMES,
                customThemes,
                setActiveTheme,
                saveCustomTheme,
                deleteCustomTheme,
                exportTheme,
                importTheme,
                getMonacoThemeData,
                monacoThemeName,
                isDark: activeTheme.type === 'dark',
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>');
    return ctx;
}
