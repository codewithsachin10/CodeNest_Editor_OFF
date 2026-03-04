/**
 * Release Manager — OS Detection & Download Utilities
 *
 * Used by the website landing page to detect visitor OS and serve
 * the correct installer download link from Supabase Storage.
 *
 * Also used by the "Check for Updates" settings panel for manual checks.
 */

// ─── Types ─────────────────────────────────────────────────────────

export type Platform = 'mac' | 'windows' | 'linux' | 'unknown';

export interface ReleaseAsset {
    name: string;
    url: string;
    size: number;     // bytes
    platform: Platform;
}

export interface ReleaseInfo {
    version: string;
    releaseDate: string;
    releaseNotes: string;
    assets: ReleaseAsset[];
}

// ─── Configuration ─────────────────────────────────────────────────

/**
 * Replace with your actual Supabase Storage bucket URL.
 * Structure: /releases/v{version}/CodeNestStudio-{version}-{os}.{ext}
 */
const RELEASE_BASE_URL =
    import.meta.env.VITE_SUPABASE_URL
        ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/releases`
        : import.meta.env.VITE_RELEASE_URL || 'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/releases';

const LATEST_JSON_URL = `${RELEASE_BASE_URL}/latest.json`;

// ─── OS Detection ──────────────────────────────────────────────────

/**
 * Detect the visitor's operating system from navigator.userAgent.
 * Returns a normalized platform string.
 */
export function detectPlatform(): Platform {
    if (typeof navigator === 'undefined') return 'unknown';

    const ua = navigator.userAgent.toLowerCase();
    const platform = (navigator as any).userAgentData?.platform?.toLowerCase() || '';

    // Check userAgentData first (modern browsers)
    if (platform.includes('mac') || ua.includes('mac os x') || ua.includes('macintosh')) {
        return 'mac';
    }
    if (platform.includes('windows') || ua.includes('windows') || ua.includes('win32') || ua.includes('win64')) {
        return 'windows';
    }
    if (platform.includes('linux') || ua.includes('linux') || ua.includes('ubuntu') || ua.includes('fedora')) {
        return 'linux';
    }

    return 'unknown';
}

/**
 * Get the expected file extension for a platform.
 */
export function getExtensionForPlatform(platform: Platform): string {
    switch (platform) {
        case 'mac': return 'dmg';
        case 'windows': return 'exe';
        case 'linux': return 'AppImage';
        default: return 'zip';
    }
}

/**
 * Get human-readable platform label.
 */
export function getPlatformLabel(platform: Platform): string {
    switch (platform) {
        case 'mac': return 'macOS';
        case 'windows': return 'Windows';
        case 'linux': return 'Linux';
        default: return 'Your OS';
    }
}

// ─── Release Fetching ──────────────────────────────────────────────

/**
 * Fetch the latest release metadata from the server.
 * Returns null if offline or unavailable.
 */
export async function fetchLatestRelease(): Promise<ReleaseInfo | null> {
    try {
        const response = await fetch(LATEST_JSON_URL, {
            cache: 'no-cache',
            signal: AbortSignal.timeout(10000), // 10s timeout
        });

        if (!response.ok) return null;

        const data = await response.json();

        return {
            version: data.version,
            releaseDate: data.releaseDate || data.date || new Date().toISOString(),
            releaseNotes: data.releaseNotes || data.notes || '',
            assets: (data.assets || data.files || []).map((a: any) => ({
                name: a.name || a.fileName,
                url: a.url || `${RELEASE_BASE_URL}/v${data.version}/${a.name || a.fileName}`,
                size: a.size || 0,
                platform: inferPlatformFromFilename(a.name || a.fileName || ''),
            })),
        };
    } catch {
        // Network error or timeout — return null silently
        return null;
    }
}

/**
 * Get the direct download URL for the current visitor's platform.
 * Returns null if no matching asset found.
 */
export async function getDownloadUrl(platform?: Platform): Promise<string | null> {
    const target = platform || detectPlatform();
    const release = await fetchLatestRelease();

    if (!release) return null;

    const asset = release.assets.find(a => a.platform === target);
    return asset?.url || null;
}

/**
 * Build a deterministic download URL without fetching latest.json.
 * Useful for static "Download" buttons that always point to latest.
 */
export function buildDownloadUrl(version: string, platform: Platform): string {
    const ext = getExtensionForPlatform(platform);
    const os = platform === 'mac' ? 'mac' : platform === 'windows' ? 'win' : 'linux';
    return `${RELEASE_BASE_URL}/v${version}/CodeNestStudio-${version}-${os}.${ext}`;
}

// ─── Helpers ───────────────────────────────────────────────────────

function inferPlatformFromFilename(name: string): Platform {
    const lower = name.toLowerCase();
    if (lower.includes('mac') || lower.endsWith('.dmg')) return 'mac';
    if (lower.includes('win') || lower.endsWith('.exe') || lower.endsWith('.msi')) return 'windows';
    if (lower.includes('linux') || lower.endsWith('.appimage') || lower.endsWith('.deb') || lower.endsWith('.rpm')) return 'linux';
    return 'unknown';
}

/**
 * Format bytes to human-readable string.
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Compare two semver strings. Returns:
 * -1 if a < b, 0 if equal, 1 if a > b
 */
export function compareSemver(a: string, b: string): -1 | 0 | 1 {
    const pa = a.replace(/^v/, '').split('.').map(Number);
    const pb = b.replace(/^v/, '').split('.').map(Number);

    for (let i = 0; i < 3; i++) {
        const na = pa[i] || 0;
        const nb = pb[i] || 0;
        if (na < nb) return -1;
        if (na > nb) return 1;
    }
    return 0;
}
