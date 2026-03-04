/**
 * CodeNest Studio — Language Icon System
 *
 * Centralised mapping from file extension / language id to local SVG icons.
 * Every component in the app should use this module instead of inline emojis
 * or CDN URLs.
 *
 * Icons are imported as Vite static assets (URL strings).
 * Render with <img> — keeps the original SVG colours intact.
 */

// ─── Static SVG imports (Vite resolves these to hashed URLs) ─────────────────

import cIcon from '@/assets/icons/c.svg';
import cppIcon from '@/assets/icons/cpp.svg';
import pythonIcon from '@/assets/icons/python.svg';
import javaIcon from '@/assets/icons/java.svg';
import jsIcon from '@/assets/icons/javascript.svg';
import nodeIcon from '@/assets/icons/nodejs.svg';
import defaultFileIcon from '@/assets/icons/default-file.svg';

// ─── Extension → icon URL ────────────────────────────────────────────────────

const EXT_ICON_MAP: Record<string, string> = {
    // C
    c: cIcon,
    h: cIcon,

    // C++
    cpp: cppIcon,
    cxx: cppIcon,
    cc: cppIcon,
    hpp: cppIcon,

    // Python
    py: pythonIcon,
    pyw: pythonIcon,

    // Java
    java: javaIcon,

    // JavaScript
    js: jsIcon,
    mjs: jsIcon,
    cjs: jsIcon,
    jsx: jsIcon,

    // TypeScript (reuse JS icon — close enough)
    ts: jsIcon,
    tsx: jsIcon,

    // Node (package.json etc. won't have an ext match — use via language id)
};

// ─── Language id → icon URL ──────────────────────────────────────────────────

const LANG_ICON_MAP: Record<string, string> = {
    c: cIcon,
    cpp: cppIcon,
    'c++': cppIcon,
    python: pythonIcon,
    java: javaIcon,
    javascript: jsIcon,
    js: jsIcon,
    typescript: jsIcon,
    ts: jsIcon,
    node: nodeIcon,
    nodejs: nodeIcon,
};

// ─── Public API ──────────────────────────────────────────────────────────────

/** Get icon URL for a filename (uses extension). */
export function getFileIconUrl(filename: string): string {
    const ext = filename.includes('.') ? filename.split('.').pop()!.toLowerCase() : '';
    return EXT_ICON_MAP[ext] || defaultFileIcon;
}

/** Get icon URL for a language id (e.g. "python", "java"). */
export function getLangIconUrl(langId: string): string {
    return LANG_ICON_MAP[langId.toLowerCase()] || defaultFileIcon;
}

/** Default file icon URL. */
export const DEFAULT_FILE_ICON = defaultFileIcon;

// ─── React helper component ─────────────────────────────────────────────────

export { cIcon, cppIcon, pythonIcon, javaIcon, jsIcon, nodeIcon, defaultFileIcon };
