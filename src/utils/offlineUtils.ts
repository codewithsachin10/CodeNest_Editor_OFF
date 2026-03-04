/**
 * CodeNest Studio — Offline Utilities
 *
 * Centralised helpers for offline detection, network-safe fetch wrappers,
 * and connection status events. Used throughout the app to ensure every
 * feature degrades gracefully without internet.
 */

// ─── Online / Offline detection ──────────────────────────────────────────────

/** Returns true if the browser/Electron reports an active connection */
export function isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/** Subscribe to connectivity changes. Returns an unsubscribe function. */
export function onConnectivityChange(callback: (online: boolean) => void): () => void {
    const goOnline = () => callback(true);
    const goOffline = () => callback(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
        window.removeEventListener('online', goOnline);
        window.removeEventListener('offline', goOffline);
    };
}

// ─── Safe Fetch ──────────────────────────────────────────────────────────────

interface SafeFetchOptions extends RequestInit {
    /** Timeout in ms (default: 10 000) */
    timeout?: number;
}

interface SafeFetchResult<T = any> {
    ok: boolean;
    data?: T;
    error?: string;
    offline?: boolean;
}

/**
 * A fetch() wrapper that never throws and gracefully handles offline state.
 * Returns `{ ok: false, offline: true }` when there is no connection.
 */
export async function safeFetch<T = any>(
    url: string,
    options: SafeFetchOptions = {},
): Promise<SafeFetchResult<T>> {
    if (!isOnline()) {
        return { ok: false, offline: true, error: 'No internet connection' };
    }

    const { timeout = 10_000, ...fetchOpts } = options;

    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);

        const res = await fetch(url, { ...fetchOpts, signal: controller.signal });
        clearTimeout(timer);

        if (!res.ok) {
            return { ok: false, error: `HTTP ${res.status}: ${res.statusText}` };
        }

        const data = (await res.json()) as T;
        return { ok: true, data };
    } catch (e: any) {
        if (e.name === 'AbortError') {
            return { ok: false, error: 'Request timed out' };
        }
        return { ok: false, error: e.message || 'Network request failed', offline: !isOnline() };
    }
}

// ─── Retry with back-off ────────────────────────────────────────────────────

/**
 * Retries an async operation with exponential back-off.
 * Immediately returns `{ ok: false, offline: true }` when offline.
 */
export async function retryAsync<T>(
    fn: () => Promise<T>,
    { retries = 3, baseDelay = 1000 }: { retries?: number; baseDelay?: number } = {},
): Promise<{ ok: boolean; data?: T; error?: string; offline?: boolean }> {
    if (!isOnline()) {
        return { ok: false, offline: true, error: 'No internet connection' };
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const data = await fn();
            return { ok: true, data };
        } catch (e: any) {
            if (!isOnline()) {
                return { ok: false, offline: true, error: 'Lost internet connection' };
            }
            if (attempt < retries) {
                await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, attempt)));
            } else {
                return { ok: false, error: e.message || 'Operation failed after retries' };
            }
        }
    }

    return { ok: false, error: 'Unexpected retry failure' };
}

// ─── localStorage safe helpers ───────────────────────────────────────────────

/** Safe localStorage.getItem that never throws */
export function safeGetItem(key: string): string | null {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

/** Safe localStorage.setItem that never throws */
export function safeSetItem(key: string, value: string): boolean {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch {
        return false;
    }
}

/** Safe localStorage.removeItem that never throws */
export function safeRemoveItem(key: string): void {
    try {
        localStorage.removeItem(key);
    } catch {
        // no-op  
    }
}
