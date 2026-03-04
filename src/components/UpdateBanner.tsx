/**
 * UpdateBanner — Non-intrusive auto-update notification banner.
 *
 * Listens to electron-updater state via IPC and shows:
 * 1. "Update available v{x.x.x}" → Download button
 * 2. Download progress bar
 * 3. "Ready to install" → Restart button
 *
 * Dismissible. Only renders inside Electron.
 */

import { useState, useEffect, useCallback } from "react";
import { Download, RefreshCw, X, Loader2, CheckCircle2 } from "lucide-react";

interface UpdaterState {
    checking: boolean;
    available: boolean;
    downloaded: boolean;
    downloading: boolean;
    progress: number;
    version: string | null;
    releaseNotes: string | null;
    error: string | null;
}

const initialState: UpdaterState = {
    checking: false,
    available: false,
    downloaded: false,
    downloading: false,
    progress: 0,
    version: null,
    releaseNotes: null,
    error: null,
};

export function UpdateBanner() {
    const [state, setState] = useState<UpdaterState>(initialState);
    const [dismissed, setDismissed] = useState(false);

    const api = (window as any).electronAPI;
    const isElectron = !!api?.updater;

    useEffect(() => {
        if (!isElectron) return;

        // Get initial state
        api.updater.getState().then((s: UpdaterState) => {
            if (s) setState(s);
        });

        // Listen for state changes
        const unsub = api.updater.onStateChange((s: UpdaterState) => {
            setState(s);
            // Un-dismiss when new update info arrives
            if (s.available || s.downloaded) setDismissed(false);
        });

        return unsub;
    }, [isElectron]);

    const handleDownload = useCallback(() => {
        api?.updater?.downloadUpdate();
    }, [api]);

    const handleInstall = useCallback(() => {
        api?.updater?.installUpdate();
    }, [api]);

    const handleCheckManually = useCallback(() => {
        api?.updater?.checkForUpdates();
    }, [api]);

    // Don't render if: not in Electron, dismissed, or nothing to show
    if (!isElectron || dismissed) return null;
    if (!state.available && !state.downloaded && !state.downloading && !state.error) return null;

    return (
        <div className="relative flex items-center gap-3 px-4 py-2 text-sm shrink-0 animate-in slide-in-from-top-2 duration-300"
            style={{
                background: state.downloaded
                    ? 'linear-gradient(90deg, #065f46, #064e3b)'
                    : state.error
                        ? 'linear-gradient(90deg, #7f1d1d, #6b1c1c)'
                        : 'linear-gradient(90deg, #1e3a5f, #1a2e4a)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}
        >
            {/* Icon */}
            {state.downloading ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-300" />
            ) : state.downloaded ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            ) : state.error ? (
                <RefreshCw className="w-4 h-4 text-red-300" />
            ) : (
                <Download className="w-4 h-4 text-blue-300" />
            )}

            {/* Message */}
            <span className="text-white/90 flex-1">
                {state.downloading
                    ? `Downloading update... ${state.progress}%`
                    : state.downloaded
                        ? `Update v${state.version} ready — restart to apply`
                        : state.error
                            ? `Update error: ${state.error}`
                            : `Update v${state.version || '?'} available`
                }
            </span>

            {/* Progress bar (downloading) */}
            {state.downloading && (
                <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-400 rounded-full transition-all duration-300"
                        style={{ width: `${state.progress}%` }}
                    />
                </div>
            )}

            {/* Action button */}
            {state.available && !state.downloading && !state.downloaded && (
                <button
                    onClick={handleDownload}
                    className="px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors"
                >
                    Download
                </button>
            )}

            {state.downloaded && (
                <button
                    onClick={handleInstall}
                    className="px-3 py-1 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-md transition-colors"
                >
                    Restart & Update
                </button>
            )}

            {state.error && (
                <button
                    onClick={handleCheckManually}
                    className="px-3 py-1 text-xs font-medium text-white bg-red-700 hover:bg-red-600 rounded-md transition-colors"
                >
                    Retry
                </button>
            )}

            {/* Dismiss */}
            <button
                onClick={() => setDismissed(true)}
                className="p-1 rounded hover:bg-white/10 transition-colors"
                title="Dismiss"
            >
                <X className="w-3.5 h-3.5 text-white/60" />
            </button>
        </div>
    );
}
