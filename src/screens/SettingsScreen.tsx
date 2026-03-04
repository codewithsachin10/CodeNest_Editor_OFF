/**
 * CodeNest Studio — Professional Settings Screen
 * VS Code / IntelliJ-grade settings control center.
 *
 * Layout: Left sidebar (categories) + Right panel (settings content)
 * Search bar at top. Reset per section. Every toggle is functional.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSettings } from '@/settings/SettingsContext';
import { DEFAULT_SETTINGS, DEFAULT_SHORTCUTS } from '@/settings/defaultSettings';
import { getLangIconUrl } from '@/utils/languageIcons';
import type {
    SettingsCategoryId,
    CodeNestSettings,
    AutoSaveMode,
    CursorStyle,
    CStandard,
    CppStandard,
    UIDensity,
    IconStyle,
    ProjectSortOrder,
    RunMode,
    StartupBehavior,
    KeyboardShortcut,
} from '@/settings/settingsTypes';
import {
    ArrowLeft,
    Settings,
    Code2,
    Terminal,
    Languages,
    Play,
    FolderOpen,
    Palette,
    Keyboard,
    GraduationCap,
    Wrench,
    Info,
    Search,
    RotateCcw,
    ChevronRight,
    AlertTriangle,
    Check,
    X,
    Download,
    Shield,
    Eye,
    EyeOff,
    Monitor,
    Cpu,
    HardDrive,
    Copy,
    User,
    LogIn,
    LogOut,
    Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeEditor } from '@/components/ThemeEditor';

// ═══════════════════════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════════════════════

interface SettingsScreenProps {
    onBack: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Category Definitions
// ═══════════════════════════════════════════════════════════════════════════════

interface CategoryDef {
    id: SettingsCategoryId;
    label: string;
    icon: React.ReactNode;
    description: string;
    beginner: boolean; // visible in beginner mode?
}

const CATEGORIES: CategoryDef[] = [
    { id: 'general', label: 'General', icon: <Settings className="w-4 h-4" />, description: 'Startup, auto-save, and core preferences', beginner: true },
    { id: 'editor', label: 'Editor', icon: <Code2 className="w-4 h-4" />, description: 'Font, tabs, word wrap, and editing behavior', beginner: true },
    { id: 'terminal', label: 'Terminal', icon: <Terminal className="w-4 h-4" />, description: 'Shell, font, cursor, and scrollback', beginner: true },
    { id: 'languages', label: 'Languages & Compilers', icon: <Languages className="w-4 h-4" />, description: 'Python, C/C++, Java, and JavaScript configuration', beginner: true },
    { id: 'runDebug', label: 'Run & Debug', icon: <Play className="w-4 h-4" />, description: 'Execution mode, error handling, and timeouts', beginner: true },
    { id: 'project', label: 'Project System', icon: <FolderOpen className="w-4 h-4" />, description: 'Default locations, templates, and file management', beginner: false },
    { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" />, description: 'Theme, colors, density, and animations', beginner: true },
    { id: 'keyboardShortcuts', label: 'Keyboard Shortcuts', icon: <Keyboard className="w-4 h-4" />, description: 'View and customize keyboard shortcuts', beginner: false },
    { id: 'beginnerMode', label: 'Beginner / Practice', icon: <GraduationCap className="w-4 h-4" />, description: 'Simplified UI, friendly errors, exam mode', beginner: true },
    { id: 'advanced', label: 'Advanced', icon: <Wrench className="w-4 h-4" />, description: 'Experimental features, logging, and environment', beginner: false },
    { id: 'about', label: 'About & Diagnostics', icon: <Info className="w-4 h-4" />, description: 'App info, compiler status, and export report', beginner: true },
];

// ═══════════════════════════════════════════════════════════════════════════════
// Main Settings Screen
// ═══════════════════════════════════════════════════════════════════════════════

export function SettingsScreen({ onBack }: SettingsScreenProps) {
    const { settings, updateSettings, resetCategory, resetAll, diagnostics, refreshDiagnostics, exportDiagnostics } = useSettings();
    const [activeCategory, setActiveCategory] = useState<SettingsCategoryId>('general');
    const [searchQuery, setSearchQuery] = useState('');
    const [showResetConfirm, setShowResetConfirm] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const isBeginnerMode = settings.beginnerMode.beginnerMode;

    // Search filtering — match search query against category labels, descriptions, and setting names
    const searchMatches = useMemo(() => {
        if (!searchQuery.trim()) return null;
        const q = searchQuery.toLowerCase();
        const matches: SettingsCategoryId[] = [];
        const searchableMap: Record<SettingsCategoryId, string[]> = {
            general: ['startup', 'auto save', 'delay', 'confirm', 'exit', 'telemetry'],
            editor: ['font', 'tab', 'minimap', 'wrap', 'line', 'bracket', 'indent', 'highlight', 'cursor'],
            terminal: ['shell', 'font', 'cursor', 'scrollback', 'clear', 'bell'],
            languages: ['python', 'c++', 'java', 'javascript', 'compiler', 'interpreter', 'gcc', 'jdk', 'node'],
            runDebug: ['run', 'debug', 'timeout', 'execution', 'error', 'breakpoint'],
            project: ['location', 'template', 'recent', 'sort', 'default'],
            appearance: ['theme', 'dark', 'light', 'accent', 'color', 'density', 'animation', 'icon'],
            keyboardShortcuts: ['shortcut', 'keybinding', 'hotkey', 'key'],
            beginnerMode: ['beginner', 'practice', 'exam', 'simple', 'friendly', 'error'],
            advanced: ['experimental', 'log', 'environment', 'multi', 'gpu', 'hardware'],
            about: ['version', 'diagnostic', 'compiler', 'system', 'info'],
        };
        for (const cat of CATEGORIES) {
            const terms = searchableMap[cat.id] || [];
            if (
                cat.label.toLowerCase().includes(q) ||
                cat.description.toLowerCase().includes(q) ||
                terms.some(t => t.includes(q))
            ) {
                matches.push(cat.id);
            }
        }
        return matches;
    }, [searchQuery]);

    // Filter categories for beginner mode + search
    const visibleCategories = useMemo(() => {
        let cats = isBeginnerMode ? CATEGORIES.filter(c => c.beginner) : CATEGORIES;
        if (searchMatches) {
            cats = cats.filter(c => searchMatches.includes(c.id));
        }
        return cats;
    }, [isBeginnerMode, searchMatches]);

    // Ensure activeCategory is still valid after filter
    useEffect(() => {
        if (!visibleCategories.find(c => c.id === activeCategory)) {
            setActiveCategory(visibleCategories[0]?.id || 'general');
        }
    }, [visibleCategories, activeCategory]);

    const handleResetSection = (category: keyof CodeNestSettings) => {
        resetCategory(category);
        setShowResetConfirm(null);
    };

    const handleCopyDiagnostics = () => {
        const text = exportDiagnostics();
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    // Import/Export settings
    const handleExportSettings = () => {
        const json = JSON.stringify(settings, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'codenest-settings.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImportSettings = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const imported = JSON.parse(ev.target?.result as string);
                    // Apply each category from imported settings
                    for (const key of Object.keys(imported)) {
                        if (key in settings) {
                            updateSettings(key as keyof CodeNestSettings, imported[key]);
                        }
                    }
                } catch {
                    // Silently ignore invalid JSON
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    return (
        <div className="h-screen flex flex-col bg-[#020617] text-[#E5E7EB] overflow-hidden">
            {/* ─── Title Bar ──────────────────────────────────────────────── */}
            <div className="h-10 border-b border-[#1E293B] flex items-center px-4 shrink-0 select-none"
                style={{ WebkitAppRegion: 'drag', background: 'rgba(15, 23, 42, 0.95)' } as any}>
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-[#9CA3AF] hover:text-[#E5E7EB] transition-colors mr-4 z-10"
                    style={{ WebkitAppRegion: 'no-drag' } as any}
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">Back</span>
                </button>
                <span className="text-sm font-medium text-[#9CA3AF]">Settings</span>
            </div>

            {/* ─── Body ───────────────────────────────────────────────────── */}
            <div className="flex-1 flex overflow-hidden">

                {/* ─── Left Sidebar ───────────────────────────────────────── */}
                <div className="w-56 bg-[#111827] border-r border-[#1E293B] flex flex-col shrink-0">
                    {/* Search */}
                    <div className="p-3">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748B]" />
                            <input
                                type="text"
                                placeholder="Search settings..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full h-8 pl-8 pr-3 rounded-lg bg-[#0F172A] border border-[#1E293B] text-sm text-[#E5E7EB] placeholder-[#64748B] focus:outline-none focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8]/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* Category List */}
                    <nav className="flex-1 overflow-y-auto px-2 pb-3">
                        {visibleCategories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={cn(
                                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all mb-0.5',
                                    activeCategory === cat.id
                                        ? 'bg-[#38BDF8]/10 text-[#38BDF8] shadow-[0_0_8px_rgba(56,189,248,0.08)]'
                                        : 'text-[#9CA3AF] hover:bg-[#0F172A] hover:text-[#E5E7EB]',
                                )}
                            >
                                {cat.icon}
                                <span className="truncate">{cat.label}</span>
                            </button>
                        ))}
                    </nav>

                    {/* Reset All */}
                    <div className="p-3 border-t border-[#1E293B] space-y-2">
                        {/* Import / Export */}
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={handleExportSettings}
                                className="flex-1 flex items-center justify-center gap-1.5 h-7 rounded-lg text-xs text-[#9CA3AF] hover:text-[#38BDF8] hover:bg-[#0F172A] transition-colors"
                                title="Export settings as JSON"
                            >
                                <Download className="w-3 h-3" />
                                Export
                            </button>
                            <button
                                onClick={handleImportSettings}
                                className="flex-1 flex items-center justify-center gap-1.5 h-7 rounded-lg text-xs text-[#9CA3AF] hover:text-[#38BDF8] hover:bg-[#0F172A] transition-colors"
                                title="Import settings from JSON"
                            >
                                <Download className="w-3 h-3 rotate-180" />
                                Import
                            </button>
                        </div>

                        {showResetConfirm === 'ALL' ? (
                            <div className="flex items-center gap-1.5">
                                <button onClick={() => { resetAll(); setShowResetConfirm(null); }}
                                    className="flex-1 h-7 rounded-lg text-xs bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 transition-colors">
                                    Confirm
                                </button>
                                <button onClick={() => setShowResetConfirm(null)}
                                    className="flex-1 h-7 rounded-lg text-xs bg-[#0F172A] text-[#9CA3AF] hover:text-[#E5E7EB] transition-colors">
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowResetConfirm('ALL')}
                                className="w-full flex items-center justify-center gap-2 h-8 rounded-lg text-xs text-[#9CA3AF] hover:text-rose-400 hover:bg-[#0F172A] transition-colors"
                            >
                                <RotateCcw className="w-3 h-3" />
                                Reset All Settings
                            </button>
                        )}
                    </div>
                </div>

                {/* ─── Right Panel ────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-3xl mx-auto p-6">
                        {/* Category Header */}
                        {(() => {
                            const cat = CATEGORIES.find(c => c.id === activeCategory);
                            return cat ? (
                                <div className="mb-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-lg font-semibold text-[#E5E7EB] flex items-center gap-2">
                                                {cat.icon}
                                                {cat.label}
                                            </h2>
                                            <p className="text-sm text-[#9CA3AF] mt-1">{cat.description}</p>
                                        </div>
                                        {activeCategory !== 'about' && (
                                            <ResetButton
                                                category={activeCategory}
                                                showConfirm={showResetConfirm === activeCategory}
                                                onAsk={() => setShowResetConfirm(activeCategory)}
                                                onConfirm={() => handleResetSection(activeCategory as keyof CodeNestSettings)}
                                                onCancel={() => setShowResetConfirm(null)}
                                            />
                                        )}
                                    </div>
                                    <div className="h-px bg-[#1E293B] mt-4" />
                                </div>
                            ) : null;
                        })()}

                        {/* Section Content */}
                        {activeCategory === 'general' && <GeneralSection />}
                        {activeCategory === 'editor' && <EditorSection />}
                        {activeCategory === 'terminal' && <TerminalSection />}
                        {activeCategory === 'languages' && <LanguagesSection />}
                        {activeCategory === 'runDebug' && <RunDebugSection />}
                        {activeCategory === 'project' && <ProjectSection />}
                        {activeCategory === 'appearance' && <AppearanceSection />}
                        {activeCategory === 'keyboardShortcuts' && <KeyboardShortcutsSection />}
                        {activeCategory === 'beginnerMode' && <BeginnerModeSection />}
                        {activeCategory === 'advanced' && <AdvancedSection />}
                        {activeCategory === 'about' && (
                            <AboutSection
                                onRefresh={refreshDiagnostics}
                                onCopy={handleCopyDiagnostics}
                                copied={copied}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Shared UI Primitives
// ═══════════════════════════════════════════════════════════════════════════════

function SettingsGroup({ title, children }: { title?: string; children: React.ReactNode }) {
    return (
        <div className="mb-6">
            {title && <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-3">{title}</h3>}
            <div className="space-y-1">{children}</div>
        </div>
    );
}

function SettingRow({ label, description, children, indent }: {
    label: string;
    description?: string;
    children: React.ReactNode;
    indent?: boolean;
}) {
    return (
        <div className={cn(
            'flex items-center justify-between py-3 px-3 rounded-xl hover:bg-[#0F172A]/60 transition-colors group',
            indent && 'ml-6'
        )}>
            <div className="flex-1 min-w-0 pr-4">
                <div className="text-sm text-[#E5E7EB]">{label}</div>
                {description && <div className="text-xs text-[#64748B] mt-0.5 group-hover:text-[#9CA3AF] transition-colors">{description}</div>}
            </div>
            <div className="shrink-0">{children}</div>
        </div>
    );
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
    return (
        <button
            onClick={() => !disabled && onChange(!checked)}
            className={cn(
                'relative w-10 h-5 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#38BDF8]/30',
                checked ? 'bg-[#38BDF8] shadow-[0_0_8px_rgba(56,189,248,0.3)]' : 'bg-[#1E293B]',
                disabled && 'opacity-40 cursor-not-allowed'
            )}
        >
            <span className={cn(
                'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200',
                checked ? 'translate-x-5' : 'translate-x-0.5'
            )} />
        </button>
    );
}

function SelectBox<T extends string>({ value, options, onChange }: {
    value: T;
    options: { value: T; label: string }[];
    onChange: (v: T) => void;
}) {
    return (
        <select
            value={value}
            onChange={e => onChange(e.target.value as T)}
            className="h-8 px-2.5 rounded-lg bg-[#0F172A] border border-[#1E293B] text-sm text-[#E5E7EB] focus:outline-none focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8]/20 transition-all cursor-pointer"
        >
            {options.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
            ))}
        </select>
    );
}

function NumberInput({ value, onChange, min, max, step, suffix }: {
    value: number;
    onChange: (v: number) => void;
    min?: number;
    max?: number;
    step?: number;
    suffix?: string;
}) {
    return (
        <div className="flex items-center gap-2">
            <input
                type="number"
                value={value}
                onChange={e => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v)) onChange(Math.max(min ?? -Infinity, Math.min(max ?? Infinity, v)));
                }}
                min={min}
                max={max}
                step={step}
                className="w-20 h-8 px-2.5 rounded-lg bg-[#0F172A] border border-[#1E293B] text-sm text-[#E5E7EB] text-center focus:outline-none focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8]/20 transition-all"
            />
            {suffix && <span className="text-xs text-[#64748B]">{suffix}</span>}
        </div>
    );
}

function TextInput({ value, onChange, placeholder }: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) {
    return (
        <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="h-8 w-56 px-2.5 rounded-lg bg-[#0F172A] border border-[#1E293B] text-sm text-[#E5E7EB] placeholder-[#64748B] focus:outline-none focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8]/20 transition-all"
        />
    );
}

function SliderInput({ value, onChange, min, max, step }: {
    value: number;
    onChange: (v: number) => void;
    min: number;
    max: number;
    step?: number;
}) {
    return (
        <div className="flex items-center gap-3">
            <input
                type="range"
                value={value}
                onChange={e => onChange(parseFloat(e.target.value))}
                min={min}
                max={max}
                step={step}
                className="w-32 h-1.5 rounded-full appearance-none bg-[#1E293B] accent-[#38BDF8] cursor-pointer"
            />
            <span className="text-xs text-[#9CA3AF] w-8 text-right">{value}</span>
        </div>
    );
}

function ResetButton({ category, showConfirm, onAsk, onConfirm, onCancel }: {
    category: string;
    showConfirm: boolean;
    onAsk: () => void;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    if (showConfirm) {
        return (
            <div className="flex items-center gap-1.5">
                <button onClick={onConfirm} className="h-7 px-3 rounded-lg text-xs bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 transition-colors">
                    Reset
                </button>
                <button onClick={onCancel} className="h-7 px-3 rounded-lg text-xs bg-[#0F172A] text-[#9CA3AF] hover:text-[#E5E7EB] transition-colors">
                    Cancel
                </button>
            </div>
        );
    }
    return (
        <button
            onClick={onAsk}
            className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-[#0F172A] transition-colors"
        >
            <RotateCcw className="w-3 h-3" />
            Reset Section
        </button>
    );
}

function StatusBadge({ detected, version }: { detected: boolean; version: string | null }) {
    return (
        <div className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
            detected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
        )}>
            {detected ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
            {detected ? (version || 'Detected') : 'Not found'}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Section: General
// ═══════════════════════════════════════════════════════════════════════════════

function GeneralSection() {
    const { settings, updateSettings } = useSettings();
    const s = settings.general;

    return (
        <>
            <SettingsGroup title="Startup">
                <SettingRow label="Startup Behavior" description="What happens when you open CodeNest Studio">
                    <SelectBox<StartupBehavior>
                        value={s.startupBehavior}
                        options={[
                            { value: 'last-session', label: 'Open last session' },
                            { value: 'empty-workspace', label: 'Open empty workspace' },
                        ]}
                        onChange={v => updateSettings('general', { startupBehavior: v })}
                    />
                </SettingRow>
            </SettingsGroup>

            <SettingsGroup title="Auto Save">
                <SettingRow label="Auto Save" description="Automatically save files">
                    <SelectBox<AutoSaveMode>
                        value={s.autoSave}
                        options={[
                            { value: 'off', label: 'Off' },
                            { value: 'on-focus-change', label: 'On focus change' },
                            { value: 'on-delay', label: 'After delay' },
                        ]}
                        onChange={v => updateSettings('general', { autoSave: v })}
                    />
                </SettingRow>
                {s.autoSave === 'on-delay' && (
                    <SettingRow label="Auto Save Delay" description="Delay in milliseconds before auto-saving" indent>
                        <NumberInput
                            value={s.autoSaveDelayMs}
                            onChange={v => updateSettings('general', { autoSaveDelayMs: v })}
                            min={500}
                            max={30000}
                            step={500}
                            suffix="ms"
                        />
                    </SettingRow>
                )}
            </SettingsGroup>

            <SettingsGroup title="Safety">
                <SettingRow label="Confirm Before Exit" description="Show a confirmation dialog before closing the app">
                    <Toggle checked={s.confirmBeforeExit} onChange={v => updateSettings('general', { confirmBeforeExit: v })} />
                </SettingRow>
            </SettingsGroup>
        </>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Section: Editor
// ═══════════════════════════════════════════════════════════════════════════════

function EditorSection() {
    const { settings, updateSettings } = useSettings();
    const s = settings.editor;

    return (
        <>
            <SettingsGroup title="Font">
                <SettingRow label="Font Family" description="Font used in the code editor">
                    <TextInput
                        value={s.fontFamily}
                        onChange={v => updateSettings('editor', { fontFamily: v })}
                        placeholder="e.g. Fira Code, monospace"
                    />
                </SettingRow>
                <SettingRow label="Font Size" description="Editor font size in pixels">
                    <SliderInput value={s.fontSize} onChange={v => updateSettings('editor', { fontSize: v })} min={10} max={32} step={1} />
                </SettingRow>
                <SettingRow label="Line Height" description="Spacing between lines">
                    <SliderInput value={s.lineHeight} onChange={v => updateSettings('editor', { lineHeight: v })} min={1} max={3} step={0.1} />
                </SettingRow>
            </SettingsGroup>

            <SettingsGroup title="Indentation">
                <SettingRow label="Tab Size" description="Number of spaces per tab">
                    <SelectBox
                        value={String(s.tabSize)}
                        options={[
                            { value: '2', label: '2 spaces' },
                            { value: '4', label: '4 spaces' },
                            { value: '8', label: '8 spaces' },
                        ]}
                        onChange={v => updateSettings('editor', { tabSize: parseInt(v) })}
                    />
                </SettingRow>
                <SettingRow label="Insert Spaces" description="Use spaces instead of tab characters">
                    <Toggle checked={s.insertSpaces} onChange={v => updateSettings('editor', { insertSpaces: v })} />
                </SettingRow>
            </SettingsGroup>

            <SettingsGroup title="Display">
                <SettingRow label="Word Wrap" description="Wrap long lines to fit the editor width">
                    <Toggle checked={s.wordWrap === 'on'} onChange={v => updateSettings('editor', { wordWrap: v ? 'on' : 'off' })} />
                </SettingRow>
                <SettingRow label="Highlight Active Line" description="Highlight the line where the cursor is">
                    <Toggle checked={s.highlightActiveLine} onChange={v => updateSettings('editor', { highlightActiveLine: v })} />
                </SettingRow>
                <SettingRow label="Show Line Numbers" description="Display line numbers in the gutter">
                    <Toggle checked={s.showLineNumbers} onChange={v => updateSettings('editor', { showLineNumbers: v })} />
                </SettingRow>
                <SettingRow label="Minimap" description="Show a miniature preview of the code">
                    <Toggle checked={s.minimap} onChange={v => updateSettings('editor', { minimap: v })} />
                </SettingRow>
            </SettingsGroup>
        </>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Section: Terminal
// ═══════════════════════════════════════════════════════════════════════════════

function TerminalSection() {
    const { settings, updateSettings } = useSettings();
    const s = settings.terminal;

    const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent);
    const isWin = typeof navigator !== 'undefined' && /Win/.test(navigator.userAgent);

    const shellOptions = isMac
        ? [{ value: '/bin/zsh', label: 'zsh' }, { value: '/bin/bash', label: 'bash' }]
        : isWin
            ? [{ value: 'powershell.exe', label: 'PowerShell' }, { value: 'cmd.exe', label: 'CMD' }]
            : [{ value: '/bin/bash', label: 'bash' }, { value: '/bin/zsh', label: 'zsh' }, { value: '/bin/sh', label: 'sh' }];

    return (
        <>
            <SettingsGroup title="Shell">
                <SettingRow label="Default Shell" description="The shell used by the integrated terminal">
                    <SelectBox
                        value={s.defaultShell}
                        options={shellOptions}
                        onChange={v => updateSettings('terminal', { defaultShell: v })}
                    />
                </SettingRow>
            </SettingsGroup>

            <SettingsGroup title="Font">
                <SettingRow label="Font Family" description="Terminal font family">
                    <TextInput
                        value={s.fontFamily}
                        onChange={v => updateSettings('terminal', { fontFamily: v })}
                        placeholder="e.g. JetBrains Mono"
                    />
                </SettingRow>
                <SettingRow label="Font Size" description="Terminal font size in pixels">
                    <SliderInput value={s.fontSize} onChange={v => updateSettings('terminal', { fontSize: v })} min={9} max={24} step={1} />
                </SettingRow>
            </SettingsGroup>

            <SettingsGroup title="Cursor">
                <SettingRow label="Cursor Style" description="Shape of the terminal cursor">
                    <SelectBox<CursorStyle>
                        value={s.cursorStyle}
                        options={[
                            { value: 'block', label: 'Block' },
                            { value: 'line', label: 'Line' },
                            { value: 'underline', label: 'Underline' },
                        ]}
                        onChange={v => updateSettings('terminal', { cursorStyle: v })}
                    />
                </SettingRow>
                <SettingRow label="Cursor Blink" description="Whether the cursor blinks">
                    <Toggle checked={s.cursorBlink} onChange={v => updateSettings('terminal', { cursorBlink: v })} />
                </SettingRow>
            </SettingsGroup>

            <SettingsGroup title="Behavior">
                <SettingRow label="Scrollback Lines" description="Number of lines preserved in terminal history">
                    <NumberInput value={s.scrollbackLines} onChange={v => updateSettings('terminal', { scrollbackLines: v })} min={100} max={10000} step={100} />
                </SettingRow>
                <SettingRow label="Clear Terminal on Run" description="Clear the terminal output each time you run code">
                    <Toggle checked={s.clearOnRun} onChange={v => updateSettings('terminal', { clearOnRun: v })} />
                </SettingRow>
            </SettingsGroup>
        </>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Section: Languages & Compilers
// ═══════════════════════════════════════════════════════════════════════════════

function LanguagesSection() {
    const { settings, updateSettings, diagnostics } = useSettings();
    const [expanded, setExpanded] = useState<string>('python');

    const langs = [
        { id: 'python', label: 'Python', detected: diagnostics?.pythonDetected, version: diagnostics?.pythonVersion },
        { id: 'c', label: 'C', detected: diagnostics?.gccDetected, version: diagnostics?.gccVersion },
        { id: 'cpp', label: 'C++', detected: diagnostics?.gccDetected, version: diagnostics?.gccVersion },
        { id: 'java', label: 'Java', detected: diagnostics?.javaDetected, version: diagnostics?.javaVersion },
        { id: 'javascript', label: 'JavaScript', detected: diagnostics?.nodeDetected, version: diagnostics?.nodeVersion },
    ];

    return (
        <>
            <div className="mb-4 px-3 py-2.5 rounded-xl bg-[#0F172A] border border-[#1E293B] text-xs text-[#9CA3AF]">
                <span className="text-[#9CA3AF] font-medium">Auto-detect is enabled.</span> Compilers are discovered from your system PATH.
                Use the fields below to override paths manually.
            </div>

            {langs.map(lang => (
                <div key={lang.id} className="mb-2">
                    <button
                        onClick={() => setExpanded(expanded === lang.id ? '' : lang.id)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#0F172A] transition-colors"
                    >
                        <div className="flex items-center gap-2.5">
                            <img src={getLangIconUrl(lang.id)} alt="" width={18} height={18} className="shrink-0" draggable={false} />
                            <span className="text-sm font-medium text-[#E5E7EB]">{lang.label}</span>
                            {lang.detected !== undefined && (
                                <StatusBadge detected={!!lang.detected} version={lang.version || null} />
                            )}
                        </div>
                        <ChevronRight className={cn('w-4 h-4 text-[#64748B] transition-transform', expanded === lang.id && 'rotate-90')} />
                    </button>

                    {expanded === lang.id && (
                        <div className="ml-4 border-l-2 border-[#1E293B] pl-4 pb-2 mt-1">
                            {lang.id === 'python' && <PythonLangSettings />}
                            {lang.id === 'c' && <CLangSettings />}
                            {lang.id === 'cpp' && <CppLangSettings />}
                            {lang.id === 'java' && <JavaLangSettings />}
                            {lang.id === 'javascript' && <JsLangSettings />}
                        </div>
                    )}
                </div>
            ))}
        </>
    );
}

function PythonLangSettings() {
    const { settings, updateSettings } = useSettings();
    const s = settings.languages.python;
    const update = (patch: Partial<typeof s>) => updateSettings('languages', { python: { ...s, ...patch } } as any);

    return (
        <>
            <SettingRow label="Interpreter Path" description="Path to Python interpreter, or 'auto'">
                <TextInput value={s.interpreterPath} onChange={v => update({ interpreterPath: v })} placeholder="auto" />
            </SettingRow>
            <SettingRow label="Unbuffered Mode (-u)" description="Run Python with unbuffered stdout/stderr">
                <Toggle checked={s.unbuffered} onChange={v => update({ unbuffered: v })} />
            </SettingRow>
            <SettingRow label="Default Encoding" description="Default file encoding for Python files">
                <SelectBox
                    value={s.defaultEncoding}
                    options={[{ value: 'utf-8', label: 'UTF-8' }, { value: 'ascii', label: 'ASCII' }, { value: 'latin-1', label: 'Latin-1' }]}
                    onChange={v => update({ defaultEncoding: v })}
                />
            </SettingRow>
        </>
    );
}

function CLangSettings() {
    const { settings, updateSettings } = useSettings();
    const s = settings.languages.c;
    const update = (patch: Partial<typeof s>) => updateSettings('languages', { c: { ...s, ...patch } } as any);

    return (
        <>
            <SettingRow label="Compiler Path" description="Path to GCC compiler">
                <TextInput value={s.compilerPath} onChange={v => update({ compilerPath: v })} placeholder="gcc" />
            </SettingRow>
            <SettingRow label="C Standard" description="C language standard version">
                <SelectBox<CStandard>
                    value={s.standard}
                    options={[{ value: 'c11', label: 'C11' }, { value: 'c17', label: 'C17' }]}
                    onChange={v => update({ standard: v })}
                />
            </SettingRow>
            <SettingRow label="-Wall (All Warnings)" description="Enable all common warnings">
                <Toggle checked={s.wallEnabled} onChange={v => update({ wallEnabled: v })} />
            </SettingRow>
            <SettingRow label="-Wextra (Extra Warnings)" description="Enable extra compiler warnings">
                <Toggle checked={s.wextraEnabled} onChange={v => update({ wextraEnabled: v })} />
            </SettingRow>
        </>
    );
}

function CppLangSettings() {
    const { settings, updateSettings } = useSettings();
    const s = settings.languages.cpp;
    const update = (patch: Partial<typeof s>) => updateSettings('languages', { cpp: { ...s, ...patch } } as any);

    return (
        <>
            <SettingRow label="Compiler Path" description="Path to G++ compiler">
                <TextInput value={s.compilerPath} onChange={v => update({ compilerPath: v })} placeholder="g++" />
            </SettingRow>
            <SettingRow label="C++ Standard" description="C++ language standard version">
                <SelectBox<CppStandard>
                    value={s.standard}
                    options={[
                        { value: 'c++14', label: 'C++14' },
                        { value: 'c++17', label: 'C++17' },
                        { value: 'c++20', label: 'C++20' },
                    ]}
                    onChange={v => update({ standard: v })}
                />
            </SettingRow>
            <SettingRow label="-Wall (All Warnings)" description="Enable all common warnings">
                <Toggle checked={s.wallEnabled} onChange={v => update({ wallEnabled: v })} />
            </SettingRow>
            <SettingRow label="-Wextra (Extra Warnings)" description="Enable extra compiler warnings">
                <Toggle checked={s.wextraEnabled} onChange={v => update({ wextraEnabled: v })} />
            </SettingRow>
        </>
    );
}

function JavaLangSettings() {
    const { settings, updateSettings } = useSettings();
    const s = settings.languages.java;
    const update = (patch: Partial<typeof s>) => updateSettings('languages', { java: { ...s, ...patch } } as any);

    return (
        <>
            <SettingRow label="JDK Path" description="Path to JDK, or 'auto'">
                <TextInput value={s.jdkPath} onChange={v => update({ jdkPath: v })} placeholder="auto" />
            </SettingRow>
            <SettingRow label="Enable Preview Features" description="Use --enable-preview flag for latest Java features">
                <Toggle checked={s.enablePreviewFeatures} onChange={v => update({ enablePreviewFeatures: v })} />
            </SettingRow>
        </>
    );
}

function JsLangSettings() {
    const { settings, updateSettings } = useSettings();
    const s = settings.languages.javascript;
    const update = (patch: Partial<typeof s>) => updateSettings('languages', { javascript: { ...s, ...patch } } as any);

    return (
        <SettingRow label="Node.js Path" description="Path to Node.js executable">
            <TextInput value={s.nodePath} onChange={v => update({ nodePath: v })} placeholder="node" />
        </SettingRow>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Section: Run & Debug
// ═══════════════════════════════════════════════════════════════════════════════

function RunDebugSection() {
    const { settings, updateSettings } = useSettings();
    const s = settings.runDebug;

    return (
        <>
            <SettingsGroup title="Execution">
                <SettingRow label="Default Run Mode" description="How code runs when you press Run">
                    <SelectBox<RunMode>
                        value={s.defaultRunMode}
                        options={[
                            { value: 'normal', label: 'Normal' },
                            { value: 'step-by-step', label: 'Step-by-step (Debug)' },
                        ]}
                        onChange={v => updateSettings('runDebug', { defaultRunMode: v })}
                    />
                </SettingRow>
                <SettingRow label="Stop on First Error" description="Stop execution immediately when an error occurs">
                    <Toggle checked={s.stopOnFirstError} onChange={v => updateSettings('runDebug', { stopOnFirstError: v })} />
                </SettingRow>
                <SettingRow label="Clear Output Before Run" description="Clear the terminal before each run">
                    <Toggle checked={s.clearOutputBeforeRun} onChange={v => updateSettings('runDebug', { clearOutputBeforeRun: v })} />
                </SettingRow>
            </SettingsGroup>

            <SettingsGroup title="Debug">
                <SettingRow label="Show Variable Inspector" description="Display variable values during debug sessions">
                    <Toggle checked={s.showVariableInspector} onChange={v => updateSettings('runDebug', { showVariableInspector: v })} />
                </SettingRow>
            </SettingsGroup>

            <SettingsGroup title="Safety">
                <SettingRow label="Maximum Execution Time" description="Kill the process after this timeout (prevents infinite loops)">
                    <NumberInput value={s.maxExecutionTimeMs} onChange={v => updateSettings('runDebug', { maxExecutionTimeMs: v })} min={5000} max={300000} step={5000} suffix="ms" />
                </SettingRow>
            </SettingsGroup>
        </>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Section: Project System
// ═══════════════════════════════════════════════════════════════════════════════

function ProjectSection() {
    const { settings, updateSettings } = useSettings();
    const s = settings.project;

    return (
        <>
            <SettingsGroup title="Defaults">
                <SettingRow label="Default Project Location" description="Where new projects are created (leave empty for home directory)">
                    <TextInput value={s.defaultProjectLocation} onChange={v => updateSettings('project', { defaultProjectLocation: v })} placeholder="~/Projects" />
                </SettingRow>
                <SettingRow label="Auto-create README" description="Create a README.md file in new projects">
                    <Toggle checked={s.autoCreateReadme} onChange={v => updateSettings('project', { autoCreateReadme: v })} />
                </SettingRow>
                <SettingRow label="Auto-create .gitignore" description="Create a .gitignore file in new projects">
                    <Toggle checked={s.autoCreateGitignore} onChange={v => updateSettings('project', { autoCreateGitignore: v })} />
                </SettingRow>
            </SettingsGroup>

            <SettingsGroup title="File Management">
                <SettingRow label="Confirm Before Delete" description="Ask for confirmation before deleting files">
                    <Toggle checked={s.confirmBeforeDelete} onChange={v => updateSettings('project', { confirmBeforeDelete: v })} />
                </SettingRow>
                <SettingRow label="File Tree Sort Order" description="How files appear in the explorer sidebar">
                    <SelectBox<ProjectSortOrder>
                        value={s.sortOrder}
                        options={[
                            { value: 'name', label: 'By Name' },
                            { value: 'type', label: 'By Type' },
                        ]}
                        onChange={v => updateSettings('project', { sortOrder: v })}
                    />
                </SettingRow>
            </SettingsGroup>
        </>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Section: Appearance
// ═══════════════════════════════════════════════════════════════════════════════

function AppearanceSection() {
    const { settings, updateSettings } = useSettings();
    const s = settings.appearance;

    const accentPresets = [
        { color: '#38BDF8', label: 'Sky Blue' },
        { color: '#3b82f6', label: 'Blue' },
        { color: '#8b5cf6', label: 'Purple' },
        { color: '#06b6d4', label: 'Cyan' },
        { color: '#10b981', label: 'Green' },
        { color: '#f59e0b', label: 'Amber' },
        { color: '#ec4899', label: 'Pink' },
    ];

    return (
        <>
            {/* ── Full Theme Editor ─────────────────────────────────── */}
            <SettingsGroup title="">
                <ThemeEditor />
            </SettingsGroup>

            <SettingsGroup title="Accent & UI">
                <SettingRow label="Accent Color" description="Primary accent color used throughout the UI">
                    <div className="flex items-center gap-1.5">
                        {accentPresets.map(p => (
                            <button
                                key={p.color}
                                title={p.label}
                                onClick={() => updateSettings('appearance', { accentColor: p.color })}
                                className={cn(
                                    'w-6 h-6 rounded-full border-2 transition-transform hover:scale-110',
                                    s.accentColor === p.color ? 'border-white scale-110' : 'border-transparent'
                                )}
                                style={{ backgroundColor: p.color }}
                            />
                        ))}
                    </div>
                </SettingRow>
            </SettingsGroup>

            <SettingsGroup title="Layout">
                <SettingRow label="UI Density" description="Adjust spacing and padding">
                    <SelectBox<UIDensity>
                        value={s.uiDensity}
                        options={[
                            { value: 'compact', label: 'Compact' },
                            { value: 'comfortable', label: 'Comfortable' },
                            { value: 'spacious', label: 'Spacious' },
                        ]}
                        onChange={v => updateSettings('appearance', { uiDensity: v })}
                    />
                </SettingRow>
                <SettingRow label="Panel Animations" description="Enable smooth panel transitions">
                    <Toggle checked={s.panelAnimations} onChange={v => updateSettings('appearance', { panelAnimations: v })} />
                </SettingRow>
                <SettingRow label="Icon Style" description="Visual style for file and UI icons">
                    <SelectBox<IconStyle>
                        value={s.iconStyle}
                        options={[
                            { value: 'minimal', label: 'Minimal' },
                            { value: 'detailed', label: 'Detailed' },
                        ]}
                        onChange={v => updateSettings('appearance', { iconStyle: v })}
                    />
                </SettingRow>
            </SettingsGroup>
        </>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Section: Keyboard Shortcuts
// ═══════════════════════════════════════════════════════════════════════════════

function KeyboardShortcutsSection() {
    const { settings, updateSettings } = useSettings();
    const shortcuts = settings.keyboardShortcuts.shortcuts;
    const [filter, setFilter] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    const categories = useMemo(() => {
        const cats = new Set(shortcuts.map(s => s.category));
        return Array.from(cats);
    }, [shortcuts]);

    const filtered = useMemo(() => {
        if (!filter) return shortcuts;
        const q = filter.toLowerCase();
        return shortcuts.filter(s => s.label.toLowerCase().includes(q) || s.keys.toLowerCase().includes(q));
    }, [shortcuts, filter]);

    const handleSaveShortcut = (id: string) => {
        const updated = shortcuts.map(s => s.id === id ? { ...s, keys: editValue } : s);
        updateSettings('keyboardShortcuts', { shortcuts: updated });
        setEditingId(null);
    };

    const handleResetShortcut = (id: string) => {
        const defaultShortcut = DEFAULT_SHORTCUTS.find(s => s.id === id);
        if (defaultShortcut) {
            const updated = shortcuts.map(s => s.id === id ? { ...s, keys: defaultShortcut.keys } : s);
            updateSettings('keyboardShortcuts', { shortcuts: updated });
        }
    };

    // Capture real key combos
    const handleKeyCapture = (e: React.KeyboardEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const parts: string[] = [];
        if (e.metaKey || e.ctrlKey) parts.push('⌘');
        if (e.shiftKey) parts.push('⇧');
        if (e.altKey) parts.push('⌥');
        // Don't add modifier-only keys
        if (!['Meta', 'Control', 'Shift', 'Alt'].includes(e.key)) {
            parts.push(e.key.length === 1 ? e.key.toUpperCase() : e.key);
        }
        if (parts.length > 0 && !['Meta', 'Control', 'Shift', 'Alt'].includes(e.key)) {
            setEditValue(parts.join(''));
        }
    };

    return (
        <>
            <div className="mb-4">
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748B]" />
                    <input
                        type="text"
                        placeholder="Search shortcuts..."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="w-full h-8 pl-8 pr-3 rounded-lg bg-[#0F172A] border border-[#1E293B] text-sm text-[#E5E7EB] placeholder-[#64748B] focus:outline-none focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8]/20 transition-all"
                    />
                </div>
            </div>

            {categories.map(cat => {
                const catShortcuts = filtered.filter(s => s.category === cat);
                if (catShortcuts.length === 0) return null;
                return (
                    <SettingsGroup key={cat} title={cat}>
                        {catShortcuts.map(sc => (
                            <div key={sc.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-[#0F172A]/60 transition-colors">
                                <span className="text-sm text-[#E5E7EB]">{sc.label}</span>
                                <div className="flex items-center gap-2">
                                    {editingId === sc.id ? (
                                        <>
                                            <input
                                                type="text"
                                                value={editValue}
                                                readOnly
                                                placeholder="Press a key combo..."
                                                className="h-7 w-40 px-2 rounded-lg bg-[#0F172A] border border-[#38BDF8] text-xs text-[#E5E7EB] text-center focus:outline-none animate-pulse"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Escape') { setEditingId(null); return; }
                                                    handleKeyCapture(e);
                                                }}
                                            />
                                            <button onClick={() => handleSaveShortcut(sc.id)} className="text-xs text-emerald-400 hover:text-emerald-300">Save</button>
                                            <button onClick={() => setEditingId(null)} className="text-xs text-[#9CA3AF] hover:text-[#E5E7EB]">Cancel</button>
                                        </>
                                    ) : (
                                        <>
                                            <kbd className="px-2 py-1 rounded-lg bg-[#0F172A] border border-[#1E293B] text-xs text-[#9CA3AF] font-mono">
                                                {sc.keys}
                                            </kbd>
                                            <button
                                                onClick={() => { setEditingId(sc.id); setEditValue(sc.keys); }}
                                                className="text-xs text-[#64748B] hover:text-[#E5E7EB] transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleResetShortcut(sc.id)}
                                                className="text-xs text-[#64748B] hover:text-[#E5E7EB] transition-colors"
                                            >
                                                Reset
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </SettingsGroup>
                );
            })}
        </>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Section: Beginner / Practice Mode
// ═══════════════════════════════════════════════════════════════════════════════

function BeginnerModeSection() {
    const { settings, updateSettings } = useSettings();
    const s = settings.beginnerMode;

    return (
        <>
            <SettingsGroup title="Beginner Mode">
                <SettingRow label="Enable Beginner Mode" description="Simplify the UI and show only essential settings">
                    <Toggle checked={s.beginnerMode} onChange={v => updateSettings('beginnerMode', { beginnerMode: v })} />
                </SettingRow>
                {s.beginnerMode && (
                    <>
                        <SettingRow label="Simplified UI" description="Hide advanced panels and reduce visual complexity" indent>
                            <Toggle checked={s.simplifiedUI} onChange={v => updateSettings('beginnerMode', { simplifiedUI: v })} />
                        </SettingRow>
                        <SettingRow label="Enforce Save Before Run" description="Automatically save the file before running code" indent>
                            <Toggle checked={s.enforcesSaveBeforeRun} onChange={v => updateSettings('beginnerMode', { enforcesSaveBeforeRun: v })} />
                        </SettingRow>
                        <SettingRow label="Friendly Error Messages" description="Show simplified, beginner-friendly error explanations" indent>
                            <Toggle checked={s.friendlyErrors} onChange={v => updateSettings('beginnerMode', { friendlyErrors: v })} />
                        </SettingRow>
                    </>
                )}
            </SettingsGroup>

            <SettingsGroup title="Practice / Exam Mode">
                <div className="px-3 py-2.5 mb-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>Practice mode restricts features for exam-like conditions. The following settings cannot be changed while enabled.</span>
                </div>
                <SettingRow label="Enable Practice Mode" description="Lock down the IDE for exam / practice conditions">
                    <Toggle checked={s.practiceMode} onChange={v => updateSettings('beginnerMode', { practiceMode: v })} />
                </SettingRow>
                {s.practiceMode && (
                    <SettingRow label="Lock Settings" description="Prevent all settings changes while in practice mode" indent>
                        <Toggle checked={s.lockSettings} onChange={v => updateSettings('beginnerMode', { lockSettings: v })} />
                    </SettingRow>
                )}
            </SettingsGroup>
        </>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Section: Advanced
// ═══════════════════════════════════════════════════════════════════════════════

function AdvancedSection() {
    const { settings, updateSettings } = useSettings();
    const s = settings.advanced;
    const [newEnvKey, setNewEnvKey] = useState('');
    const [newEnvVal, setNewEnvVal] = useState('');

    const handleAddEnvVar = () => {
        if (newEnvKey.trim()) {
            updateSettings('advanced', {
                customEnvVars: { ...s.customEnvVars, [newEnvKey.trim()]: newEnvVal }
            });
            setNewEnvKey('');
            setNewEnvVal('');
        }
    };

    const handleRemoveEnvVar = (key: string) => {
        const next = { ...s.customEnvVars };
        delete next[key];
        updateSettings('advanced', { customEnvVars: next });
    };

    return (
        <>
            <div className="px-3 py-2.5 mb-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>These settings are for power users. Changing them may cause unexpected behavior. Use with caution.</span>
            </div>

            <SettingsGroup title="Features">
                <SettingRow label="Experimental Features" description="Enable features that are still in development">
                    <Toggle checked={s.experimentalFeatures} onChange={v => updateSettings('advanced', { experimentalFeatures: v })} />
                </SettingRow>
                <SettingRow label="Verbose Logs" description="Show detailed log output for debugging issues">
                    <Toggle checked={s.verboseLogs} onChange={v => updateSettings('advanced', { verboseLogs: v })} />
                </SettingRow>
                <SettingRow label="Multi-Terminal Support" description="Allow multiple terminal instances simultaneously">
                    <Toggle checked={s.multiTerminal} onChange={v => updateSettings('advanced', { multiTerminal: v })} />
                </SettingRow>
            </SettingsGroup>

            <SettingsGroup title="Environment Variables">
                <div className="text-xs text-[#64748B] px-3 mb-2">Custom environment variables passed to all terminal and execution processes.</div>

                {Object.entries(s.customEnvVars).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2 px-3 py-1.5">
                        <code className="text-xs text-[#9CA3AF] bg-[#0F172A] px-2 py-0.5 rounded-md">{key}</code>
                        <span className="text-xs text-[#64748B]">=</span>
                        <code className="text-xs text-[#E5E7EB] bg-[#0F172A] px-2 py-0.5 rounded-md flex-1 truncate">{val}</code>
                        <button onClick={() => handleRemoveEnvVar(key)} className="text-[#64748B] hover:text-rose-400 transition-colors">
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}

                <div className="flex items-center gap-2 px-3 pt-2">
                    <input
                        type="text"
                        value={newEnvKey}
                        onChange={e => setNewEnvKey(e.target.value)}
                        placeholder="KEY"
                        className="h-7 w-24 px-2 rounded-lg bg-[#0F172A] border border-[#1E293B] text-xs text-[#E5E7EB] placeholder-[#64748B] focus:outline-none focus:border-[#38BDF8]"
                    />
                    <span className="text-xs text-[#64748B]">=</span>
                    <input
                        type="text"
                        value={newEnvVal}
                        onChange={e => setNewEnvVal(e.target.value)}
                        placeholder="value"
                        className="h-7 flex-1 px-2 rounded-lg bg-[#0F172A] border border-[#1E293B] text-xs text-[#E5E7EB] placeholder-[#64748B] focus:outline-none focus:border-[#38BDF8]"
                        onKeyDown={e => { if (e.key === 'Enter') handleAddEnvVar(); }}
                    />
                    <button
                        onClick={handleAddEnvVar}
                        disabled={!newEnvKey.trim()}
                        className="h-7 px-3 rounded-lg bg-[#38BDF8]/10 text-xs text-[#38BDF8] hover:bg-[#38BDF8]/20 disabled:opacity-30 transition-colors"
                    >
                        Add
                    </button>
                </div>
            </SettingsGroup>
        </>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Section: About & Diagnostics
// ═══════════════════════════════════════════════════════════════════════════════

function AboutSection({ onRefresh, onCopy, copied }: { onRefresh: () => void; onCopy: () => void; copied: boolean }) {
    const { diagnostics } = useSettings();
    const d = diagnostics;

    return (
        <>
            <SettingsGroup title="Application">
                <div className="flex items-center gap-4 px-3 py-4">
                    <div className="w-14 h-14 rounded-xl bg-sky-500/10 flex items-center justify-center">
                        <Code2 className="w-7 h-7 text-[#38BDF8]" />
                    </div>
                    <div>
                        <div className="text-lg font-semibold text-[#E5E7EB]">CodeNest Studio</div>
                        <div className="text-sm text-[#9CA3AF]">Version {d?.appVersion || '1.0.0'}</div>
                        <div className="text-xs text-[#64748B] mt-0.5">Built with Electron + React + Monaco Editor</div>
                    </div>
                </div>
            </SettingsGroup>

            <SettingsGroup title="System Information">
                <SettingRow label="Operating System" description={d?.os || 'Unknown'}>
                    <Monitor className="w-4 h-4 text-[#64748B]" />
                </SettingRow>
                <SettingRow label="Platform" description={d?.platform || 'Unknown'}>
                    <Cpu className="w-4 h-4 text-[#64748B]" />
                </SettingRow>
            </SettingsGroup>

            <SettingsGroup title="Compiler & Runtime Status">
                <SettingRow label="Python" description={d?.pythonVersion || 'Not checked'}>
                    <StatusBadge detected={d?.pythonDetected || false} version={d?.pythonVersion || null} />
                </SettingRow>
                <SettingRow label="GCC / G++" description={d?.gccVersion || 'Not checked'}>
                    <StatusBadge detected={d?.gccDetected || false} version={d?.gccVersion || null} />
                </SettingRow>
                <SettingRow label="Java" description={d?.javaVersion || 'Not checked'}>
                    <StatusBadge detected={d?.javaDetected || false} version={d?.javaVersion || null} />
                </SettingRow>
                <SettingRow label="Node.js" description={d?.nodeVersion || 'Not checked'}>
                    <StatusBadge detected={d?.nodeDetected || false} version={d?.nodeVersion || null} />
                </SettingRow>
            </SettingsGroup>

            <SettingsGroup title="Actions">
                <div className="flex items-center gap-2 px-3">
                    <button
                        onClick={onRefresh}
                        className="flex items-center gap-2 h-8 px-4 rounded-lg bg-[#0F172A] border border-[#1E293B] text-xs text-[#9CA3AF] hover:text-[#E5E7EB] hover:border-[#38BDF8] transition-all"
                    >
                        <RotateCcw className="w-3 h-3" />
                        Re-scan Compilers
                    </button>
                    <button
                        onClick={onCopy}
                        className="flex items-center gap-2 h-8 px-4 rounded-lg bg-[#0F172A] border border-[#1E293B] text-xs text-[#9CA3AF] hover:text-[#E5E7EB] hover:border-[#38BDF8] transition-all"
                    >
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copied ? 'Copied!' : 'Copy Diagnostics Report'}
                    </button>
                </div>
            </SettingsGroup>
        </>
    );
}

// ─── Export for Index.tsx compatibility ──────────────────────────────────────

export type { SettingsScreenProps };
