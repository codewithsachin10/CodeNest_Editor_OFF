/**
 * CodeNest Studio — Built-in Theme Presets
 * 4 professionally designed themes: Midnight Slate, Clean Light, Soft Contrast, Focus Dark
 * Each has full shell/UI colors, syntax tokens, and font settings.
 */

import type { EditorThemePreset } from './themeTypes';
import { DEFAULT_FONT_SETTINGS } from './themeTypes';

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Midnight Slate — The flagship dark theme (default)
// ═══════════════════════════════════════════════════════════════════════════════

export const MIDNIGHT_SLATE: EditorThemePreset = {
    id: 'midnight-slate',
    name: 'Midnight Slate',
    type: 'dark',
    builtIn: true,
    description: 'Deep slate tones with sky-blue accents. Easy on the eyes for long sessions.',
    shellColors: {
        background: '#020617',
        foreground: '#E5E7EB',
        titlebar: '#0F172A',
        activityBar: '#0F172A',
        sidebar: '#111827',
        editor: '#0F172A',
        terminal: '#0F172A',
        border: '#1E293B',
        accent: '#38BDF8',
        activeLine: '#1E293B',
        selection: 'rgba(30, 58, 138, 0.4)',
        cursor: '#38BDF8',
        lineNumbers: '#475569',
        lineNumbersActive: '#94A3B8',
        textMuted: '#9CA3AF',
        success: '#22C55E',
        error: '#EF4444',
        warning: '#F59E0B',
    },
    syntaxColors: {
        comment: '#64748B',
        keyword: '#60A5FA',
        string: '#34D399',
        number: '#FBBF24',
        function: '#A78BFA',
        type: '#67E8F9',
        variable: '#E5E7EB',
        constant: '#F87171',
        operator: '#94A3B8',
        error: '#EF4444',
    },
    fontSettings: { ...DEFAULT_FONT_SETTINGS },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Clean Light — Minimal, bright, distraction-free
// ═══════════════════════════════════════════════════════════════════════════════

export const CLEAN_LIGHT: EditorThemePreset = {
    id: 'clean-light',
    name: 'Clean Light',
    type: 'light',
    builtIn: true,
    description: 'Crisp white background with vibrant syntax. Great for daytime use.',
    shellColors: {
        background: '#F8FAFC',
        foreground: '#1E293B',
        titlebar: '#F1F5F9',
        activityBar: '#E2E8F0',
        sidebar: '#F1F5F9',
        editor: '#FFFFFF',
        terminal: '#F1F5F9',
        border: '#E2E8F0',
        accent: '#0284C7',
        activeLine: '#F1F5F9',
        selection: 'rgba(2, 132, 199, 0.12)',
        cursor: '#0284C7',
        lineNumbers: '#94A3B8',
        lineNumbersActive: '#475569',
        textMuted: '#64748B',
        success: '#16A34A',
        error: '#DC2626',
        warning: '#D97706',
    },
    syntaxColors: {
        comment: '#94A3B8',
        keyword: '#2563EB',
        string: '#059669',
        number: '#D97706',
        function: '#7C3AED',
        type: '#0891B2',
        variable: '#1E293B',
        constant: '#DC2626',
        operator: '#475569',
        error: '#DC2626',
    },
    fontSettings: { ...DEFAULT_FONT_SETTINGS },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Soft Contrast — Warm, medium-contrast dark with amber accents
// ═══════════════════════════════════════════════════════════════════════════════

export const SOFT_CONTRAST: EditorThemePreset = {
    id: 'soft-contrast',
    name: 'Soft Contrast',
    type: 'dark',
    builtIn: true,
    description: 'Warm grays with amber accents. Balanced contrast for extended coding.',
    shellColors: {
        background: '#1A1A2E',
        foreground: '#E0E0E0',
        titlebar: '#16213E',
        activityBar: '#16213E',
        sidebar: '#1A1A2E',
        editor: '#16213E',
        terminal: '#16213E',
        border: '#2A2A4A',
        accent: '#F59E0B',
        activeLine: '#2A2A4A',
        selection: 'rgba(245, 158, 11, 0.2)',
        cursor: '#F59E0B',
        lineNumbers: '#6B7280',
        lineNumbersActive: '#D1D5DB',
        textMuted: '#9CA3AF',
        success: '#34D399',
        error: '#F87171',
        warning: '#FBBF24',
    },
    syntaxColors: {
        comment: '#7C8399',
        keyword: '#C084FC',
        string: '#6EE7B7',
        number: '#FCD34D',
        function: '#93C5FD',
        type: '#5EEAD4',
        variable: '#E0E0E0',
        constant: '#FCA5A5',
        operator: '#A1A1AA',
        error: '#F87171',
    },
    fontSettings: { ...DEFAULT_FONT_SETTINGS },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Focus Dark — High-contrast, no distractions, green terminal vibes
// ═══════════════════════════════════════════════════════════════════════════════

export const FOCUS_DARK: EditorThemePreset = {
    id: 'focus-dark',
    name: 'Focus Dark',
    type: 'dark',
    builtIn: true,
    description: 'Pure dark with green accents. Maximum focus, hacker-inspired.',
    shellColors: {
        background: '#0A0A0A',
        foreground: '#D4D4D4',
        titlebar: '#141414',
        activityBar: '#141414',
        sidebar: '#121212',
        editor: '#0E0E0E',
        terminal: '#0A0A0A',
        border: '#262626',
        accent: '#22C55E',
        activeLine: '#1C1C1C',
        selection: 'rgba(34, 197, 94, 0.2)',
        cursor: '#22C55E',
        lineNumbers: '#525252',
        lineNumbersActive: '#A3A3A3',
        textMuted: '#737373',
        success: '#22C55E',
        error: '#EF4444',
        warning: '#EAB308',
    },
    syntaxColors: {
        comment: '#6B7280',
        keyword: '#22D3EE',
        string: '#4ADE80',
        number: '#FB923C',
        function: '#818CF8',
        type: '#2DD4BF',
        variable: '#D4D4D4',
        constant: '#FB7185',
        operator: '#9CA3AF',
        error: '#EF4444',
    },
    fontSettings: {
        ...DEFAULT_FONT_SETTINGS,
        family: '"Fira Code", "JetBrains Mono", monospace',
    },
};

// ═══════════════════════════════════════════════════════════════════════════════
// Exports
// ═══════════════════════════════════════════════════════════════════════════════

/** All built-in theme presets */
export const BUILT_IN_THEMES: EditorThemePreset[] = [
    MIDNIGHT_SLATE,
    CLEAN_LIGHT,
    SOFT_CONTRAST,
    FOCUS_DARK,
];

/** Get a built-in preset by ID */
export function getPresetById(id: string): EditorThemePreset | undefined {
    return BUILT_IN_THEMES.find(t => t.id === id);
}
