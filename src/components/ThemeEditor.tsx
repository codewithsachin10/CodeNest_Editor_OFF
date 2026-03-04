/**
 * CodeNest Studio — Theme Editor Component
 * Professional theme customisation panel with:
 *  - Theme preset selector with live preview cards
 *  - Color editors for shell/UI and syntax tokens
 *  - Font controls (family, size, weight, ligatures)
 *  - Save as Custom Theme
 *  - Import / Export JSON
 *  - Beginner mode hides advanced, Pro mode shows all
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useTheme } from '@/themes/ThemeContext';
import { useSettings } from '@/settings/SettingsContext';
import { cn } from '@/lib/utils';
import type {
    EditorThemePreset,
    SavedCustomTheme,
    CustomThemeOverrides,
    ShellColors,
    SyntaxColors,
    ThemeFontSettings,
} from '@/themes/themeTypes';
import { MONO_FONT_FAMILIES, DEFAULT_FONT_SETTINGS } from '@/themes/themeTypes';
import {
    Palette,
    Check,
    Sun,
    Moon,
    Download,
    Upload,
    Trash2,
    Plus,
    Type,
    Sparkles,
    Eye,
    ChevronDown,
    ChevronRight,
    Copy,
    Save,
} from 'lucide-react';

// ─── Color Swatch Picker ────────────────────────────────────────────────────

function ColorPicker({ label, value, onChange }: {
    label: string;
    value: string;
    onChange: (color: string) => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    // Normalize rgba/hex for the color input (only accepts #rrggbb)
    const hexValue = value.startsWith('rgba') ? '#999999' : value;

    return (
        <div className="flex items-center justify-between py-1.5 group">
            <span className="text-xs text-[#CBD5E1] capitalize">{label.replace(/([A-Z])/g, ' $1').trim()}</span>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => inputRef.current?.click()}
                    className="w-7 h-7 rounded-md border border-[#334155] cursor-pointer hover:ring-2 hover:ring-[#38BDF8]/30 transition-all shadow-sm"
                    style={{ backgroundColor: value }}
                    title={value}
                />
                <input
                    ref={inputRef}
                    type="color"
                    value={hexValue}
                    onChange={e => onChange(e.target.value)}
                    className="sr-only"
                />
                <span className="text-[10px] text-[#475569] font-mono w-16 text-right">{value.length > 9 ? 'rgba(…)' : value}</span>
            </div>
        </div>
    );
}

// ─── Collapsible Section ────────────────────────────────────────────────────

function CollapsibleSection({ title, icon: Icon, defaultOpen = false, children }: {
    title: string;
    icon?: React.ComponentType<{ size?: number; className?: string }>;
    defaultOpen?: boolean;
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="mb-3">
            <button
                onClick={() => setOpen(v => !v)}
                className="flex items-center gap-2 w-full text-left py-2 px-2 rounded-lg hover:bg-[#0F172A]/60 transition-colors"
            >
                {open ? <ChevronDown size={14} className="text-[#64748B]" /> : <ChevronRight size={14} className="text-[#64748B]" />}
                {Icon && <Icon size={14} className="text-[#38BDF8]" />}
                <span className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">{title}</span>
            </button>
            {open && <div className="pl-6 pr-1 pt-1">{children}</div>}
        </div>
    );
}

// ─── Live Code Preview ──────────────────────────────────────────────────────

function LiveCodePreview({ theme }: { theme: EditorThemePreset }) {
    const { shellColors, syntaxColors, fontSettings } = theme;
    const lines = [
        { tokens: [{ text: '// Welcome to CodeNest Studio', color: syntaxColors.comment, italic: true }] },
        { tokens: [
            { text: 'function', color: syntaxColors.keyword },
            { text: ' greet', color: syntaxColors.function },
            { text: '(', color: syntaxColors.operator },
            { text: 'name', color: syntaxColors.variable },
            { text: ': ', color: syntaxColors.operator },
            { text: 'string', color: syntaxColors.type },
            { text: ') {', color: syntaxColors.operator },
        ]},
        { tokens: [
            { text: '  ', color: '' },
            { text: 'const', color: syntaxColors.keyword },
            { text: ' msg', color: syntaxColors.variable },
            { text: ' = ', color: syntaxColors.operator },
            { text: '"Hello, "', color: syntaxColors.string },
            { text: ' + name;', color: syntaxColors.operator },
        ]},
        { tokens: [
            { text: '  ', color: '' },
            { text: 'const', color: syntaxColors.keyword },
            { text: ' count', color: syntaxColors.variable },
            { text: ' = ', color: syntaxColors.operator },
            { text: '42', color: syntaxColors.number },
            { text: ';', color: syntaxColors.operator },
        ]},
        { tokens: [
            { text: '  ', color: '' },
            { text: 'return', color: syntaxColors.keyword },
            { text: ' msg;', color: syntaxColors.variable },
        ]},
        { tokens: [{ text: '}', color: syntaxColors.operator }] },
    ];

    return (
        <div
            className="rounded-lg border overflow-hidden shadow-lg"
            style={{ borderColor: shellColors.border }}
        >
            {/* Title bar preview */}
            <div
                className="flex items-center gap-1.5 px-3 py-1.5"
                style={{ backgroundColor: shellColors.titlebar }}
            >
                <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
                <span className="ml-2 text-[10px]" style={{ color: shellColors.textMuted }}>preview.ts — CodeNest</span>
            </div>
            {/* Editor body */}
            <div
                className="p-3 overflow-x-auto"
                style={{
                    backgroundColor: shellColors.editor,
                    fontFamily: fontSettings.family,
                    fontSize: `${Math.min(fontSettings.size, 13)}px`,
                    lineHeight: fontSettings.lineHeight,
                    fontWeight: fontSettings.weight,
                }}
            >
                {lines.map((line, i) => (
                    <div key={i} className="flex items-center" style={{ minHeight: '1.4em' }}>
                        <span
                            className="w-6 text-right mr-3 select-none"
                            style={{
                                color: i === 1 ? shellColors.lineNumbersActive : shellColors.lineNumbers,
                                fontSize: '0.85em',
                            }}
                        >
                            {i + 1}
                        </span>
                        <div
                            className="flex-1"
                            style={{
                                backgroundColor: i === 1 ? shellColors.activeLine : 'transparent',
                                borderRadius: '2px',
                                padding: '0 2px',
                            }}
                        >
                            {line.tokens.map((tok, j) => (
                                <span
                                    key={j}
                                    style={{
                                        color: tok.color || shellColors.foreground,
                                        fontStyle: (tok as any).italic ? 'italic' : 'normal',
                                    }}
                                >
                                    {tok.text}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            {/* Status bar preview */}
            <div
                className="flex items-center justify-between px-3 py-1 text-[9px]"
                style={{
                    backgroundColor: shellColors.activityBar,
                    borderTop: `1px solid ${shellColors.border}`,
                    color: shellColors.textMuted,
                }}
            >
                <span style={{ color: shellColors.accent }}>● CodeNest</span>
                <span>TypeScript · UTF-8 · Ln 2, Col 1</span>
            </div>
        </div>
    );
}

// ─── Theme Card ─────────────────────────────────────────────────────────────

function ThemeCard({ theme, isActive, onSelect, onCustomize }: {
    theme: EditorThemePreset;
    isActive: boolean;
    onSelect: () => void;
    onCustomize?: () => void;
}) {
    return (
        <button
            onClick={onSelect}
            className={cn(
                'relative rounded-xl border p-3 text-left transition-all duration-200 w-full group',
                isActive
                    ? 'border-[#38BDF8] bg-[#38BDF8]/5 shadow-[0_0_20px_rgba(56,189,248,0.1)]'
                    : 'border-[#1E293B] hover:border-[#334155] hover:bg-[#0F172A]/40'
            )}
        >
            {isActive && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#38BDF8] flex items-center justify-center">
                    <Check size={12} className="text-white" />
                </div>
            )}
            {/* Mini color preview */}
            <div className="flex gap-1 mb-2">
                <div className="w-6 h-6 rounded" style={{ backgroundColor: theme.shellColors.editor }} title="Editor" />
                <div className="w-6 h-6 rounded" style={{ backgroundColor: theme.shellColors.sidebar }} title="Sidebar" />
                <div className="w-6 h-6 rounded" style={{ backgroundColor: theme.shellColors.accent }} title="Accent" />
                <div className="w-6 h-6 rounded border border-[#334155]" style={{ backgroundColor: theme.shellColors.background }} title="Background" />
            </div>
            <div className="flex items-center gap-1.5 mb-0.5">
                {theme.type === 'dark' ? <Moon size={11} className="text-[#64748B]" /> : <Sun size={11} className="text-[#F59E0B]" />}
                <span className="text-sm font-medium text-[#E5E7EB]">{theme.name}</span>
                {!theme.builtIn && (
                    <span className="text-[9px] bg-[#38BDF8]/10 text-[#38BDF8] px-1.5 py-0.5 rounded-full">Custom</span>
                )}
            </div>
            <p className="text-[10px] text-[#64748B] leading-relaxed">{theme.description}</p>
        </button>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main ThemeEditor Component
// ═══════════════════════════════════════════════════════════════════════════════

export function ThemeEditor() {
    const {
        activeTheme,
        activeThemeId,
        allThemes,
        builtInThemes,
        customThemes,
        setActiveTheme,
        saveCustomTheme,
        deleteCustomTheme,
        exportTheme,
        importTheme,
    } = useTheme();

    const { settings, updateSettings } = useSettings();
    const mode = settings.appearance.themeEditorMode;
    const isPro = mode === 'pro';

    // Working overrides for the customize panel
    const [isCustomizing, setIsCustomizing] = useState(false);
    const [workingOverrides, setWorkingOverrides] = useState<CustomThemeOverrides>({});
    const [customName, setCustomName] = useState('');
    const [importText, setImportText] = useState('');
    const [showImport, setShowImport] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Preview theme = active theme + working overrides
    const previewTheme = useMemo<EditorThemePreset>(() => {
        if (!isCustomizing) return activeTheme;
        return {
            ...activeTheme,
            shellColors: { ...activeTheme.shellColors, ...workingOverrides.shellColors },
            syntaxColors: { ...activeTheme.syntaxColors, ...workingOverrides.syntaxColors },
            fontSettings: { ...activeTheme.fontSettings, ...workingOverrides.fontSettings },
        } as EditorThemePreset;
    }, [activeTheme, workingOverrides, isCustomizing]);

    // Start customizing current theme
    const startCustomize = useCallback(() => {
        setIsCustomizing(true);
        setWorkingOverrides({});
        setCustomName(`${activeTheme.name} Custom`);
    }, [activeTheme]);

    const cancelCustomize = useCallback(() => {
        setIsCustomizing(false);
        setWorkingOverrides({});
    }, []);

    // Update a shell color override
    const updateShellColor = useCallback((key: keyof ShellColors, value: string) => {
        setWorkingOverrides(prev => ({
            ...prev,
            shellColors: { ...prev.shellColors, [key]: value },
        }));
    }, []);

    // Update a syntax color override
    const updateSyntaxColor = useCallback((key: keyof SyntaxColors, value: string) => {
        setWorkingOverrides(prev => ({
            ...prev,
            syntaxColors: { ...prev.syntaxColors, [key]: value },
        }));
    }, []);

    // Update a font setting override
    const updateFont = useCallback(<K extends keyof ThemeFontSettings>(key: K, value: ThemeFontSettings[K]) => {
        setWorkingOverrides(prev => ({
            ...prev,
            fontSettings: { ...prev.fontSettings, [key]: value },
        }));
    }, []);

    // Save as custom theme
    const handleSaveCustom = useCallback(() => {
        if (!customName.trim()) return;
        const id = `custom-${Date.now()}`;
        const saved: SavedCustomTheme = {
            id,
            name: customName.trim(),
            basePresetId: activeTheme.builtIn ? activeTheme.id : (activeTheme as any).basePresetId || activeTheme.id,
            overrides: workingOverrides,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        saveCustomTheme(saved);
        setActiveTheme(id);
        updateSettings('appearance', { editorThemeId: id, theme: activeTheme.type });
        setIsCustomizing(false);
        setWorkingOverrides({});
    }, [customName, activeTheme, workingOverrides, saveCustomTheme, setActiveTheme, updateSettings]);

    // Select a preset
    const handleSelectTheme = useCallback((id: string) => {
        const theme = allThemes.find(t => t.id === id);
        if (!theme) return;
        setActiveTheme(id);
        updateSettings('appearance', {
            editorThemeId: id,
            theme: theme.type,
        });
        if (isCustomizing) cancelCustomize();
    }, [allThemes, setActiveTheme, updateSettings, isCustomizing, cancelCustomize]);

    // Export
    const handleExport = useCallback(() => {
        const json = exportTheme(activeThemeId);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeTheme.name.replace(/\s+/g, '-').toLowerCase()}-theme.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [activeThemeId, activeTheme.name, exportTheme]);

    // Import
    const handleImport = useCallback(() => {
        if (!importText.trim()) return;
        const result = importTheme(importText.trim());
        if (result) {
            setShowImport(false);
            setImportText('');
            setActiveTheme(result.id);
            updateSettings('appearance', { editorThemeId: result.id });
        }
    }, [importText, importTheme, setActiveTheme, updateSettings]);

    // Import from file
    const handleFileImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const text = reader.result as string;
            const result = importTheme(text);
            if (result) {
                setActiveTheme(result.id);
                updateSettings('appearance', { editorThemeId: result.id });
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }, [importTheme, setActiveTheme, updateSettings]);

    // Resolved current colors for pickers
    const shellColors = previewTheme.shellColors;
    const syntaxColors = previewTheme.syntaxColors;
    const fontSettings = previewTheme.fontSettings;

    // Important shell color keys for beginners
    const beginnerShellKeys: (keyof ShellColors)[] = ['background', 'editor', 'sidebar', 'accent', 'foreground', 'border'];
    const allShellKeys = Object.keys(shellColors) as (keyof ShellColors)[];
    const beginnerSyntaxKeys: (keyof SyntaxColors)[] = ['keyword', 'string', 'comment', 'function', 'number', 'error'];
    const allSyntaxKeys = Object.keys(syntaxColors) as (keyof SyntaxColors)[];

    const displayShellKeys = isPro ? allShellKeys : beginnerShellKeys;
    const displaySyntaxKeys = isPro ? allSyntaxKeys : beginnerSyntaxKeys;

    return (
        <div className="space-y-6">
            {/* ── Mode Toggle ─────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Palette size={16} className="text-[#38BDF8]" />
                    <h3 className="text-sm font-semibold text-[#E5E7EB]">Theme Editor</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => updateSettings('appearance', { themeEditorMode: isPro ? 'beginner' : 'pro' })}
                        className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                            isPro
                                ? 'bg-[#38BDF8]/10 text-[#38BDF8] hover:bg-[#38BDF8]/20'
                                : 'bg-[#1E293B] text-[#9CA3AF] hover:bg-[#334155]'
                        )}
                    >
                        <Sparkles size={12} />
                        {isPro ? 'Pro Mode' : 'Beginner'}
                    </button>
                </div>
            </div>

            {/* ── Live Preview ─────────────────────────────────────────── */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Eye size={13} className="text-[#64748B]" />
                    <span className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">Live Preview</span>
                </div>
                <LiveCodePreview theme={previewTheme} />
            </div>

            {/* ── Theme Presets Grid ──────────────────────────────────── */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">Theme Presets</span>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-[#64748B] hover:text-[#E5E7EB] hover:bg-[#1E293B] transition-colors"
                            title="Export current theme"
                        >
                            <Download size={11} />
                            Export
                        </button>
                        <button
                            onClick={() => setShowImport(v => !v)}
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-[#64748B] hover:text-[#E5E7EB] hover:bg-[#1E293B] transition-colors"
                            title="Import theme"
                        >
                            <Upload size={11} />
                            Import
                        </button>
                    </div>
                </div>

                {/* Import panel */}
                {showImport && (
                    <div className="mb-3 p-3 rounded-lg bg-[#0F172A] border border-[#1E293B]">
                        <div className="flex items-center gap-2 mb-2">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-3 py-1.5 rounded-lg bg-[#1E293B] text-xs text-[#E5E7EB] hover:bg-[#334155] transition-colors"
                            >
                                Choose File
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json"
                                onChange={handleFileImport}
                                className="hidden"
                            />
                            <span className="text-[10px] text-[#64748B]">or paste JSON below</span>
                        </div>
                        <textarea
                            value={importText}
                            onChange={e => setImportText(e.target.value)}
                            placeholder='Paste theme JSON here...'
                            rows={4}
                            className="w-full rounded-lg bg-[#020617] border border-[#1E293B] text-xs text-[#E5E7EB] p-2 font-mono resize-none focus:outline-none focus:border-[#38BDF8]"
                        />
                        <button
                            onClick={handleImport}
                            disabled={!importText.trim()}
                            className="mt-2 px-4 py-1.5 rounded-lg bg-[#38BDF8] text-xs text-white font-medium hover:bg-[#38BDF8]/90 disabled:opacity-40 transition-colors"
                        >
                            Import Theme
                        </button>
                    </div>
                )}

                {/* Preset grid */}
                <div className="grid grid-cols-2 gap-2">
                    {builtInThemes.map(t => (
                        <ThemeCard
                            key={t.id}
                            theme={t}
                            isActive={activeThemeId === t.id}
                            onSelect={() => handleSelectTheme(t.id)}
                        />
                    ))}
                </div>

                {/* Custom themes */}
                {customThemes.length > 0 && (
                    <div className="mt-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-2 block">Custom Themes</span>
                        <div className="grid grid-cols-2 gap-2">
                            {customThemes.map(ct => {
                                const resolved = allThemes.find(t => t.id === ct.id);
                                if (!resolved) return null;
                                return (
                                    <div key={ct.id} className="relative">
                                        <ThemeCard
                                            theme={resolved}
                                            isActive={activeThemeId === ct.id}
                                            onSelect={() => handleSelectTheme(ct.id)}
                                        />
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteCustomTheme(ct.id);
                                            }}
                                            className="absolute top-2 left-2 w-5 h-5 rounded-full bg-[#EF4444]/20 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:!opacity-100 hover:bg-[#EF4444]/40 transition-all"
                                            title="Delete custom theme"
                                        >
                                            <Trash2 size={10} className="text-[#EF4444]" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Customize Button ────────────────────────────────────── */}
            {!isCustomizing ? (
                <button
                    onClick={startCustomize}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-[#334155] text-sm text-[#9CA3AF] hover:border-[#38BDF8] hover:text-[#38BDF8] hover:bg-[#38BDF8]/5 transition-all"
                >
                    <Plus size={14} />
                    Customize Current Theme
                </button>
            ) : (
                <div className="space-y-4 p-4 rounded-xl border border-[#38BDF8]/30 bg-[#38BDF8]/5">
                    {/* Custom name */}
                    <div className="flex items-center gap-2">
                        <input
                            value={customName}
                            onChange={e => setCustomName(e.target.value)}
                            placeholder="Custom theme name…"
                            className="flex-1 h-8 px-3 rounded-lg bg-[#0F172A] border border-[#1E293B] text-sm text-[#E5E7EB] focus:outline-none focus:border-[#38BDF8]"
                        />
                        <button
                            onClick={handleSaveCustom}
                            disabled={!customName.trim()}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#38BDF8] text-xs text-white font-medium hover:bg-[#38BDF8]/90 disabled:opacity-40 transition-colors"
                        >
                            <Save size={12} />
                            Save
                        </button>
                        <button
                            onClick={cancelCustomize}
                            className="px-3 py-1.5 rounded-lg bg-[#1E293B] text-xs text-[#9CA3AF] hover:bg-[#334155] transition-colors"
                        >
                            Cancel
                        </button>
                    </div>

                    {/* ── Shell / UI Colors ───────────────────────────── */}
                    <CollapsibleSection title="UI Colors" icon={Palette} defaultOpen>
                        {displayShellKeys.map(key => (
                            <ColorPicker
                                key={key}
                                label={key}
                                value={(shellColors as any)[key]}
                                onChange={v => updateShellColor(key, v)}
                            />
                        ))}
                    </CollapsibleSection>

                    {/* ── Syntax Token Colors ────────────────────────── */}
                    <CollapsibleSection title="Syntax Colors" icon={Eye} defaultOpen>
                        {displaySyntaxKeys.map(key => (
                            <ColorPicker
                                key={key}
                                label={key}
                                value={(syntaxColors as any)[key]}
                                onChange={v => updateSyntaxColor(key, v)}
                            />
                        ))}
                    </CollapsibleSection>

                    {/* ── Font Settings ───────────────────────────────── */}
                    {isPro && (
                        <CollapsibleSection title="Font Settings" icon={Type}>
                            <div className="space-y-3">
                                {/* Font Family */}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-[#CBD5E1]">Font Family</span>
                                    <select
                                        value={fontSettings.family}
                                        onChange={e => updateFont('family', e.target.value)}
                                        className="h-7 px-2 rounded-lg bg-[#0F172A] border border-[#1E293B] text-xs text-[#E5E7EB] focus:outline-none focus:border-[#38BDF8]"
                                    >
                                        {MONO_FONT_FAMILIES.map(f => (
                                            <option key={f} value={f}>{f.split(',')[0].replace(/"/g, '')}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Font Size */}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-[#CBD5E1]">Font Size</span>
                                    <div className="flex items-center gap-1.5">
                                        <input
                                            type="range"
                                            min={10}
                                            max={24}
                                            value={fontSettings.size}
                                            onChange={e => updateFont('size', parseInt(e.target.value))}
                                            className="w-20 accent-[#38BDF8]"
                                        />
                                        <span className="text-[10px] text-[#64748B] w-8 text-right">{fontSettings.size}px</span>
                                    </div>
                                </div>

                                {/* Line Height */}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-[#CBD5E1]">Line Height</span>
                                    <div className="flex items-center gap-1.5">
                                        <input
                                            type="range"
                                            min={1.0}
                                            max={2.5}
                                            step={0.1}
                                            value={fontSettings.lineHeight}
                                            onChange={e => updateFont('lineHeight', parseFloat(e.target.value))}
                                            className="w-20 accent-[#38BDF8]"
                                        />
                                        <span className="text-[10px] text-[#64748B] w-8 text-right">{fontSettings.lineHeight}</span>
                                    </div>
                                </div>

                                {/* Font Weight */}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-[#CBD5E1]">Font Weight</span>
                                    <select
                                        value={fontSettings.weight}
                                        onChange={e => updateFont('weight', parseInt(e.target.value) as ThemeFontSettings['weight'])}
                                        className="h-7 px-2 rounded-lg bg-[#0F172A] border border-[#1E293B] text-xs text-[#E5E7EB] focus:outline-none focus:border-[#38BDF8]"
                                    >
                                        <option value={300}>Light (300)</option>
                                        <option value={400}>Regular (400)</option>
                                        <option value={500}>Medium (500)</option>
                                        <option value={600}>Semi-Bold (600)</option>
                                        <option value={700}>Bold (700)</option>
                                    </select>
                                </div>

                                {/* Ligatures */}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-[#CBD5E1]">Font Ligatures</span>
                                    <button
                                        onClick={() => updateFont('ligatures', !fontSettings.ligatures)}
                                        className={cn(
                                            'relative w-9 h-5 rounded-full transition-all',
                                            fontSettings.ligatures ? 'bg-[#38BDF8]' : 'bg-[#1E293B]'
                                        )}
                                    >
                                        <span className={cn(
                                            'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                                            fontSettings.ligatures ? 'translate-x-4' : 'translate-x-0.5'
                                        )} />
                                    </button>
                                </div>
                            </div>
                        </CollapsibleSection>
                    )}
                </div>
            )}
        </div>
    );
}
