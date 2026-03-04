import { useState, useCallback } from 'react';

export interface EditorTab {
    id: string;
    fileId: string;
    fileName: string;
    content: string;
    savedContent: string;
    language: string;
    isSaved: boolean;
}

interface OpenTabParams {
    fileId: string;
    fileName: string;
    content: string;
    language: string;
}

export function useEditorTabs() {
    const [tabs, setTabs] = useState<EditorTab[]>([]);
    const [activeTabId, setActiveTabId] = useState<string | null>(null);

    // Open a file in a new tab or focus existing
    const openTab = useCallback((params: OpenTabParams) => {
        const { fileId, fileName, content, language } = params;

        setTabs(prev => {
            // Check if already open
            const existing = prev.find(t => t.fileId === fileId);
            if (existing) {
                setActiveTabId(existing.id);
                return prev;
            }

            // Create new tab
            const newTab: EditorTab = {
                id: `tab-${Date.now()}`,
                fileId,
                fileName,
                content,
                savedContent: content,
                language,
                isSaved: true,
            };

            setActiveTabId(newTab.id);
            return [...prev, newTab];
        });
    }, []);

    // Close a tab
    const closeTab = useCallback((tabId: string): boolean => {
        let hadUnsaved = false;

        setTabs(prev => {
            const tab = prev.find(t => t.id === tabId);
            if (tab && !tab.isSaved) {
                hadUnsaved = true;
                return prev; // Don't close, return unchanged
            }

            const newTabs = prev.filter(t => t.id !== tabId);

            setActiveTabId(prevActive => {
                if (prevActive === tabId) {
                    const closedIndex = prev.findIndex(t => t.id === tabId);
                    const newActiveIndex = Math.min(closedIndex, newTabs.length - 1);
                    return newTabs[newActiveIndex]?.id || null;
                }
                return prevActive;
            });

            return newTabs;
        });

        return !hadUnsaved;
    }, []);

    // Force close (ignore unsaved)
    const forceCloseTab = useCallback((tabId: string) => {
        setTabs(prev => {
            const newTabs = prev.filter(t => t.id !== tabId);

            setActiveTabId(prevActive => {
                if (prevActive === tabId) {
                    const closedIndex = prev.findIndex(t => t.id === tabId);
                    const newActiveIndex = Math.min(closedIndex, newTabs.length - 1);
                    return newTabs[newActiveIndex]?.id || null;
                }
                return prevActive;
            });

            return newTabs;
        });
    }, []);

    // Update tab content
    const updateTabContent = useCallback((tabId: string, content: string) => {
        setTabs(prev => prev.map(t =>
            t.id === tabId ? { ...t, content, isSaved: content === t.savedContent } : t
        ));
    }, []);

    // Mark tab as saved
    const markTabSaved = useCallback((tabId: string) => {
        setTabs(prev => prev.map(t =>
            t.id === tabId ? { ...t, savedContent: t.content, isSaved: true } : t
        ));
    }, []);

    // Save tab (mark as saved) - legacy support
    const saveTab = useCallback((tabId: string): string => {
        let savedContent = '';
        setTabs(prev => prev.map(t => {
            if (t.id === tabId) {
                savedContent = t.content;
                return { ...t, savedContent: t.content, isSaved: true };
            }
            return t;
        }));
        return savedContent;
    }, []);

    // Set active tab
    const setActiveTab = useCallback((tabId: string) => {
        setActiveTabId(tabId);
    }, []);

    // Get active tab
    const getActiveTab = useCallback((): EditorTab | null => {
        return tabs.find(t => t.id === activeTabId) || null;
    }, [tabs, activeTabId]);

    // Check if tab has unsaved changes
    const hasUnsavedChanges = useCallback((tabId: string): boolean => {
        const tab = tabs.find(t => t.id === tabId);
        return tab ? !tab.isSaved : false;
    }, [tabs]);

    // Check if any tab has unsaved changes
    const hasAnyUnsavedChanges = useCallback((): boolean => {
        return tabs.some(t => !t.isSaved);
    }, [tabs]);

    // Update tab when file is renamed
    const updateTabFileName = useCallback((fileId: string, newName: string) => {
        setTabs(prev => prev.map(t =>
            t.fileId === fileId ? { ...t, fileName: newName } : t
        ));
    }, []);

    // Close tabs for deleted file
    const closeTabsForFile = useCallback((fileId: string) => {
        setTabs(prev => {
            const newTabs = prev.filter(t => t.fileId !== fileId);

            setActiveTabId(prevActive => {
                const wasActive = prev.some(t => t.fileId === fileId && t.id === prevActive);
                if (wasActive) {
                    return newTabs[0]?.id || null;
                }
                return prevActive;
            });

            return newTabs;
        });
    }, []);

    return {
        tabs,
        activeTabId,
        setActiveTabId,
        setActiveTab,
        openTab,
        closeTab,
        forceCloseTab,
        updateTabContent,
        markTabSaved,
        saveTab,
        getActiveTab,
        hasUnsavedChanges,
        hasAnyUnsavedChanges,
        updateTabFileName,
        closeTabsForFile,
    };
}
