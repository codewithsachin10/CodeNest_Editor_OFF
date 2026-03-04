/**
 * CodeNest Studio — Settings Context
 * Provides reactive, persistent settings throughout the app.
 * Stores to Electron userData JSON when available, falls back to localStorage.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { CodeNestSettings, DiagnosticsInfo } from './settingsTypes';
import { DEFAULT_SETTINGS } from './defaultSettings';

// ─── Storage Keys ────────────────────────────────────────────────────────────

const STORAGE_KEY = 'codenest-settings';

// ─── Deep merge utility ─────────────────────────────────────────────────────

function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    const result = { ...target };
    for (const key in source) {
        if (
            source[key] !== null &&
            typeof source[key] === 'object' &&
            !Array.isArray(source[key]) &&
            typeof target[key] === 'object' &&
            !Array.isArray(target[key])
        ) {
            (result as any)[key] = deepMerge(target[key] as any, source[key] as any);
        } else if (source[key] !== undefined) {
            (result as any)[key] = source[key];
        }
    }
    return result;
}

// ─── Context Interface ──────────────────────────────────────────────────────

interface SettingsContextValue {
    settings: CodeNestSettings;
    updateSettings: <K extends keyof CodeNestSettings>(
        category: K,
        patch: Partial<CodeNestSettings[K]>
    ) => void;
    resetCategory: (category: keyof CodeNestSettings) => void;
    resetAll: () => void;
    diagnostics: DiagnosticsInfo | null;
    refreshDiagnostics: () => Promise<void>;
    exportDiagnostics: () => string;
    isDirty: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────────────────────

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<CodeNestSettings>(() => loadSettings());
    const [diagnostics, setDiagnostics] = useState<DiagnosticsInfo | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isFirstRender = useRef(true);

    // Persist whenever settings change (debounced) — skip first render to avoid overwriting on init
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            persistSettings(settings);
            setIsDirty(false);
        }, 300);
        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, [settings]);

    // Run diagnostics on mount
    useEffect(() => {
        refreshDiagnostics();
    }, []);

    const updateSettings = useCallback(<K extends keyof CodeNestSettings>(
        category: K,
        patch: Partial<CodeNestSettings[K]>
    ) => {
        setSettings(prev => ({
            ...prev,
            [category]: { ...prev[category], ...patch },
        }));
        setIsDirty(true);
    }, []);

    const resetCategory = useCallback((category: keyof CodeNestSettings) => {
        setSettings(prev => ({
            ...prev,
            [category]: { ...(DEFAULT_SETTINGS as any)[category] },
        }));
        setIsDirty(true);
    }, []);

    const resetAll = useCallback(() => {
        setSettings({ ...DEFAULT_SETTINGS });
        setIsDirty(true);
    }, []);

    const refreshDiagnostics = useCallback(async () => {
        const info: DiagnosticsInfo = {
            appVersion: '1.0.0',
            os: getOSName(),
            platform: getPlatform(),
            pythonDetected: false,
            pythonVersion: null,
            gccDetected: false,
            gccVersion: null,
            javaDetected: false,
            javaVersion: null,
            nodeDetected: false,
            nodeVersion: null,
        };

        const api = (window as any).electronAPI;

        if (api) {
            try {
                // App info
                const appInfo = await api.app.getInfo();
                info.appVersion = appInfo.version || '1.0.0';
                info.platform = appInfo.platform || getPlatform();

                // Detect compilers
                const detected = await api.system.detectLanguages();
                if (detected) {
                    if (detected.python) {
                        info.pythonDetected = true;
                        info.pythonVersion = detected.python;
                    }
                    if (detected.gcc) {
                        info.gccDetected = true;
                        info.gccVersion = detected.gcc;
                    }
                    if (detected.java) {
                        info.javaDetected = true;
                        info.javaVersion = detected.java;
                    }
                    if (detected.node) {
                        info.nodeDetected = true;
                        info.nodeVersion = detected.node;
                    }
                }
            } catch (e) {
                console.warn('Diagnostics: Electron API not available', e);
            }
        }

        setDiagnostics(info);
    }, []);

    const exportDiagnostics = useCallback(() => {
        const d = diagnostics;
        if (!d) return 'No diagnostics available.';

        return [
            '=== CodeNest Studio Diagnostics ===',
            `Date: ${new Date().toISOString()}`,
            `App Version: ${d.appVersion}`,
            `OS: ${d.os}`,
            `Platform: ${d.platform}`,
            '',
            '--- Compilers & Runtimes ---',
            `Python: ${d.pythonDetected ? `✔ ${d.pythonVersion}` : '✘ Not found'}`,
            `GCC/G++: ${d.gccDetected ? `✔ ${d.gccVersion}` : '✘ Not found'}`,
            `Java: ${d.javaDetected ? `✔ ${d.javaVersion}` : '✘ Not found'}`,
            `Node.js: ${d.nodeDetected ? `✔ ${d.nodeVersion}` : '✘ Not found'}`,
            '',
            '--- Current Settings (JSON) ---',
            JSON.stringify(settings, null, 2),
        ].join('\n');
    }, [diagnostics, settings]);

    return (
        <SettingsContext.Provider
            value={{
                settings,
                updateSettings,
                resetCategory,
                resetAll,
                diagnostics,
                refreshDiagnostics,
                exportDiagnostics,
                isDirty,
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useSettings(): SettingsContextValue {
    const ctx = useContext(SettingsContext);
    if (!ctx) throw new Error('useSettings must be used within <SettingsProvider>');
    return ctx;
}

// ─── Persistence helpers ────────────────────────────────────────────────────

function loadSettings(): CodeNestSettings {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            // Deep merge with defaults to handle new settings added in updates
            return deepMerge(DEFAULT_SETTINGS, parsed);
        }
    } catch (e) {
        console.warn('Failed to load settings:', e);
    }
    return { ...DEFAULT_SETTINGS };
}

function persistSettings(settings: CodeNestSettings): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
        console.warn('Failed to persist settings:', e);
    }

    // Also persist to Electron settings file if available
    const api = (window as any).electronAPI;
    if (api?.settings) {
        api.settings.set({ ...settings }).catch(() => {});
    }
}

// ─── OS detection helpers ───────────────────────────────────────────────────

function getOSName(): string {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    if (/Mac/.test(ua)) return 'macOS';
    if (/Win/.test(ua)) return 'Windows';
    if (/Linux/.test(ua)) return 'Linux';
    return 'Unknown';
}

function getPlatform(): string {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    if (/Mac/.test(ua)) return 'darwin';
    if (/Win/.test(ua)) return 'win32';
    if (/Linux/.test(ua)) return 'linux';
    return 'unknown';
}
