import { useEffect, useRef, useCallback } from 'react';

interface AutoSaveOptions {
    content: string;
    fileId: string | null;
    onSave: () => Promise<void>;
    intervalMs?: number;
    enabled?: boolean;
}

const BACKUP_KEY_PREFIX = 'codenest_backup_';

/**
 * Auto-save hook for background saving and crash recovery
 */
export function useAutoSave({
    content,
    fileId,
    onSave,
    intervalMs = 5000,
    enabled = true,
}: AutoSaveOptions) {
    const lastSavedContentRef = useRef(content);
    const lastSaveTimeRef = useRef(Date.now());
    const isSavingRef = useRef(false);
    const contentRef = useRef(content);

    // Keep content ref in sync
    useEffect(() => {
        contentRef.current = content;
    }, [content]);

    // Save backup to localStorage for crash recovery
    const saveBackup = useCallback(() => {
        if (!fileId) return;

        try {
            const backup = {
                content,
                fileId,
                timestamp: Date.now(),
            };
            localStorage.setItem(`${BACKUP_KEY_PREFIX}${fileId}`, JSON.stringify(backup));
        } catch (e) {
            console.warn('Failed to save backup:', e);
        }
    }, [content, fileId]);

    // Clear backup after successful save
    const clearBackup = useCallback(() => {
        if (!fileId) return;
        localStorage.removeItem(`${BACKUP_KEY_PREFIX}${fileId}`);
    }, [fileId]);

    // Get backup for a file
    const getBackup = useCallback((targetFileId: string): { content: string; timestamp: number } | null => {
        try {
            const data = localStorage.getItem(`${BACKUP_KEY_PREFIX}${targetFileId}`);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.warn('Failed to get backup:', e);
        }
        return null;
    }, []);

    // Check if content has changed
    const hasChanges = content !== lastSavedContentRef.current;

    // Auto-save effect
    useEffect(() => {
        if (!enabled || !fileId) return;

        const interval = setInterval(async () => {
            if (isSavingRef.current) return;

            const currentContent = contentRef.current;

            // Save if content changed
            if (currentContent !== lastSavedContentRef.current) {
                isSavingRef.current = true;

                try {
                    // Save backup first (fast, local)
                    saveBackup();

                    // Then save to file system
                    await onSave();

                    lastSavedContentRef.current = currentContent;
                    lastSaveTimeRef.current = Date.now();

                    // Clear backup after successful save
                    clearBackup();
                } catch (e) {
                    console.error('Auto-save failed:', e);
                    // Keep backup on failure
                } finally {
                    isSavingRef.current = false;
                }
            }
        }, intervalMs);

        return () => clearInterval(interval);
    }, [fileId, onSave, intervalMs, enabled, saveBackup, clearBackup]);

    // Save backup on content change (immediate, local only)
    useEffect(() => {
        if (enabled && fileId && content !== lastSavedContentRef.current) {
            saveBackup();
        }
    }, [content, fileId, enabled, saveBackup]);

    // Save backup before page unload
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (fileId && content !== lastSavedContentRef.current) {
                saveBackup();
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [fileId, content, saveBackup]);

    return {
        hasChanges,
        getBackup,
        clearBackup,
        saveBackup,
    };
}

/**
 * Check for any crash recovery backups on startup
 */
export function checkForBackups(): Array<{ fileId: string; content: string; timestamp: number }> {
    const backups: Array<{ fileId: string; content: string; timestamp: number }> = [];

    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(BACKUP_KEY_PREFIX)) {
                const data = localStorage.getItem(key);
                if (data) {
                    const parsed = JSON.parse(data);
                    backups.push({
                        fileId: parsed.fileId,
                        content: parsed.content,
                        timestamp: parsed.timestamp,
                    });
                }
            }
        }
    } catch (e) {
        console.warn('Failed to check backups:', e);
    }

    return backups;
}

/**
 * Clear all backups (call after successful recovery)
 */
export function clearAllBackups(): void {
    try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(BACKUP_KEY_PREFIX)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (e) {
        console.warn('Failed to clear backups:', e);
    }
}
