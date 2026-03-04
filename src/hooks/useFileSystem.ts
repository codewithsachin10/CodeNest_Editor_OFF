import { useState, useEffect, useCallback } from 'react';

export interface FileNode {
    id: string;
    name: string;
    type: 'file' | 'folder';
    path?: string;
    children?: FileNode[];
    content?: string;
    expanded?: boolean;
}

interface FileSystem {
    files: FileNode[];
    activeFileId: string | null;
    workspacePath: string | null;
}

const STORAGE_KEY = 'codenest-filesystem';

// Check if running in Electron
const isElectron = !!(window as any).electronAPI?.isElectron;

const defaultFileSystem: FileSystem = {
    files: [
        {
            id: 'root',
            name: 'my-first-project',
            type: 'folder',
            expanded: true,
            children: [
                {
                    id: 'file-1',
                    name: 'hello.py',
                    type: 'file',
                    content: `# My first Python program

def main():
    print("Hello, World!")
    print("Welcome to CodeNest!")

if __name__ == "__main__":
    main()
`,
                },
                {
                    id: 'file-2',
                    name: 'README.md',
                    type: 'file',
                    content: `# My First Project

Welcome to CodeNest! Start coding here.
`,
                },
            ],
        },
    ],
    activeFileId: 'file-1',
    workspacePath: null,
};

// Generate unique ID
const generateId = () => `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Get file extension
export const getFileExtension = (filename: string): string => {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

// Get language from extension
export const getLanguageFromExtension = (ext: string): string => {
    const langMap: Record<string, string> = {
        py: 'python',
        js: 'javascript',
        ts: 'typescript',
        jsx: 'javascript',
        tsx: 'typescript',
        html: 'html',
        css: 'css',
        json: 'json',
        md: 'markdown',
        cpp: 'cpp',
        c: 'c',
        java: 'java',
        rs: 'rust',
        go: 'go',
    };
    return langMap[ext] || 'plaintext';
};

export function useFileSystem() {
    const [fileSystem, setFileSystem] = useState<FileSystem>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Only restore if it's a virtual workspace (legacy check) or if we want to default to last known state
                // Since loadElectronWorkspace will override if a real workspace exists, this is safe
                if (!parsed.workspacePath) {
                    return parsed;
                }
            }
        } catch (e) {
            console.error('Failed to load file system:', e);
        }
        return defaultFileSystem;
    });

    const [isLoading, setIsLoading] = useState(isElectron);

    // Load workspace from Electron
    useEffect(() => {
        if (isElectron) {
            loadElectronWorkspace();
        }
    }, []);

    // Load files from disk in Electron mode
    const loadElectronWorkspace = async () => {
        try {
            const api = (window as any).electronAPI;
            const workspacePath = await api.workspace.get();

            if (workspacePath) {
                await loadDirectoryTree(workspacePath);
            } else {
                setIsLoading(false);
            }
        } catch (e) {
            console.error('Failed to load workspace:', e);
            setIsLoading(false);
        }
    };

    // Recursively load directory tree
    const loadDirectoryTree = async (dirPath: string) => {
        try {
            const api = (window as any).electronAPI;
            const items = await api.fs.readDir(dirPath);

            if (items.error) {
                throw new Error(items.error);
            }

            // Directories to skip during tree loading (performance/safety)
            const SKIP_DIRS = new Set([
                'node_modules', '.git', '.svn', '.hg', '__pycache__',
                '.venv', 'venv', '.env', 'env', '.idea', '.vscode',
                'dist', 'build', '.next', '.cache', 'coverage',
            ]);

            const buildTree = async (items: any[], parentPath: string, depth = 0): Promise<FileNode[]> => {
                const nodes: FileNode[] = [];

                for (const item of items) {
                    // Skip hidden/heavy directories
                    if (item.isDirectory && SKIP_DIRS.has(item.name)) {
                        continue;
                    }
                    // Skip hidden files/dirs starting with .
                    if (item.name.startsWith('.') && item.isDirectory) {
                        continue;
                    }

                    const node: FileNode = {
                        id: generateId(),
                        name: item.name,
                        type: item.isDirectory ? 'folder' : 'file',
                        path: item.path,
                    };

                    if (item.isDirectory) {
                        // Only recurse up to 5 levels deep to prevent freezing
                        if (depth < 5) {
                            const children = await api.fs.readDir(item.path);
                            if (!children.error) {
                                node.children = await buildTree(children, item.path, depth + 1);
                            } else {
                                node.children = [];
                            }
                        } else {
                            node.children = [];
                        }
                        node.expanded = false;
                    }

                    nodes.push(node);
                }

                // Sort: folders first, then alphabetically
                return nodes.sort((a, b) => {
                    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
                    return a.name.localeCompare(b.name);
                });
            };

            const rootName = dirPath.split('/').pop() || dirPath.split('\\').pop() || 'Workspace';
            const children = await buildTree(items, dirPath);

            setFileSystem({
                files: [{
                    id: 'root',
                    name: rootName,
                    type: 'folder',
                    path: dirPath,
                    expanded: true,
                    children,
                }],
                activeFileId: null,
                workspacePath: dirPath,
            });

            setIsLoading(false);
        } catch (e) {
            console.error('Failed to load directory:', e);
            setIsLoading(false);
        }
    };

    // Persist to localStorage (web mode OR electron virtual mode)
    useEffect(() => {
        if (!isElectron || !fileSystem.workspacePath) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(fileSystem));
            } catch (e) {
                console.error('Failed to save file system:', e);
            }
        }
    }, [fileSystem]);

    // Find node by ID
    const findNode = useCallback((nodes: FileNode[], id: string): FileNode | null => {
        for (const node of nodes) {
            if (node.id === id) return node;
            if (node.children) {
                const found = findNode(node.children, id);
                if (found) return found;
            }
        }
        return null;
    }, []);

    // Get active file
    const getActiveFile = useCallback((): FileNode | null => {
        if (!fileSystem.activeFileId) return null;
        return findNode(fileSystem.files, fileSystem.activeFileId);
    }, [fileSystem, findNode]);

    // Set active file
    const setActiveFile = useCallback((id: string | null) => {
        setFileSystem(prev => ({ ...prev, activeFileId: id }));
    }, []);

    // Read file content (async for Electron)
    const readFileContent = useCallback(async (node: FileNode): Promise<string> => {
        if (isElectron && node.path) {
            const api = (window as any).electronAPI;
            const content = await api.fs.readFile(node.path);
            if (content && typeof content === 'object' && content.error) {
                throw new Error(content.error);
            }
            return typeof content === 'string' ? content : '';
        }
        return node.content || '';
    }, []);

    // Create file
    const createFile = useCallback(async (parentId: string, name: string, content: string = ''): Promise<string> => {
        const newId = generateId();

        if (isElectron) {
            const parent = findNode(fileSystem.files, parentId);
            if (parent?.path) {
                const api = (window as any).electronAPI;
                const filePath = `${parent.path}/${name}`;
                const result = await api.fs.createFile(filePath, content);
                if (result.error) {
                    throw new Error(result.error);
                }

                const newFile: FileNode = {
                    id: newId,
                    name,
                    type: 'file',
                    path: filePath,
                };

                setFileSystem(prev => {
                    const updateNodes = (nodes: FileNode[]): FileNode[] => {
                        return nodes.map(node => {
                            if (node.id === parentId && node.type === 'folder') {
                                return {
                                    ...node,
                                    expanded: true,
                                    children: [...(node.children || []), newFile],
                                };
                            }
                            if (node.children) {
                                return { ...node, children: updateNodes(node.children) };
                            }
                            return node;
                        });
                    };
                    return { ...prev, files: updateNodes(prev.files), activeFileId: newId };
                });

                return newId;
            }
        }

        // Web mode (localStorage)
        const newFile: FileNode = {
            id: newId,
            name,
            type: 'file',
            content,
        };

        setFileSystem(prev => {
            const updateNodes = (nodes: FileNode[]): FileNode[] => {
                return nodes.map(node => {
                    if (node.id === parentId && node.type === 'folder') {
                        return {
                            ...node,
                            expanded: true,
                            children: [...(node.children || []), newFile],
                        };
                    }
                    if (node.children) {
                        return { ...node, children: updateNodes(node.children) };
                    }
                    return node;
                });
            };
            return { ...prev, files: updateNodes(prev.files), activeFileId: newId };
        });

        return newId;
    }, [fileSystem, findNode]);

    // Create folder
    const createFolder = useCallback(async (parentId: string, name: string): Promise<string> => {
        const newId = generateId();

        if (isElectron) {
            const parent = findNode(fileSystem.files, parentId);
            if (parent?.path) {
                const api = (window as any).electronAPI;
                const folderPath = `${parent.path}/${name}`;
                const result = await api.fs.createFolder(folderPath);
                if (result.error) {
                    throw new Error(result.error);
                }

                const newFolder: FileNode = {
                    id: newId,
                    name,
                    type: 'folder',
                    path: folderPath,
                    children: [],
                    expanded: true,
                };

                setFileSystem(prev => {
                    const updateNodes = (nodes: FileNode[]): FileNode[] => {
                        return nodes.map(node => {
                            if (node.id === parentId && node.type === 'folder') {
                                return {
                                    ...node,
                                    expanded: true,
                                    children: [...(node.children || []), newFolder],
                                };
                            }
                            if (node.children) {
                                return { ...node, children: updateNodes(node.children) };
                            }
                            return node;
                        });
                    };
                    return { ...prev, files: updateNodes(prev.files) };
                });

                return newId;
            }
        }

        // Web mode
        const newFolder: FileNode = {
            id: newId,
            name,
            type: 'folder',
            children: [],
            expanded: true,
        };

        setFileSystem(prev => {
            const updateNodes = (nodes: FileNode[]): FileNode[] => {
                return nodes.map(node => {
                    if (node.id === parentId && node.type === 'folder') {
                        return {
                            ...node,
                            expanded: true,
                            children: [...(node.children || []), newFolder],
                        };
                    }
                    if (node.children) {
                        return { ...node, children: updateNodes(node.children) };
                    }
                    return node;
                });
            };
            return { ...prev, files: updateNodes(prev.files) };
        });

        return newId;
    }, [fileSystem, findNode]);

    // Rename node
    const renameNode = useCallback(async (id: string, newName: string) => {
        if (isElectron) {
            const node = findNode(fileSystem.files, id);
            if (node?.path) {
                const api = (window as any).electronAPI;
                // Handle both Unix and Windows path separators
                const lastSlash = Math.max(node.path.lastIndexOf('/'), node.path.lastIndexOf('\\'));
                const parentPath = lastSlash >= 0 ? node.path.substring(0, lastSlash) : node.path;
                const sep = node.path.includes('\\') ? '\\' : '/';
                const newPath = `${parentPath}${sep}${newName}`;
                const result = await api.fs.rename(node.path, newPath);
                if (result.error) {
                    throw new Error(result.error);
                }

                setFileSystem(prev => {
                    const updateNodes = (nodes: FileNode[]): FileNode[] => {
                        return nodes.map(n => {
                            if (n.id === id) {
                                return { ...n, name: newName, path: newPath };
                            }
                            if (n.children) {
                                return { ...n, children: updateNodes(n.children) };
                            }
                            return n;
                        });
                    };
                    return { ...prev, files: updateNodes(prev.files) };
                });
                return;
            }
        }

        setFileSystem(prev => {
            const updateNodes = (nodes: FileNode[]): FileNode[] => {
                return nodes.map(node => {
                    if (node.id === id) {
                        return { ...node, name: newName };
                    }
                    if (node.children) {
                        return { ...node, children: updateNodes(node.children) };
                    }
                    return node;
                });
            };
            return { ...prev, files: updateNodes(prev.files) };
        });
    }, [fileSystem, findNode]);

    // Delete node
    const deleteNode = useCallback(async (id: string) => {
        if (isElectron) {
            const node = findNode(fileSystem.files, id);
            if (node?.path) {
                const api = (window as any).electronAPI;
                const result = await api.fs.delete(node.path);
                if (result.error) {
                    throw new Error(result.error);
                }
            }
        }

        setFileSystem(prev => {
            const removeNode = (nodes: FileNode[]): FileNode[] => {
                return nodes
                    .filter(node => node.id !== id)
                    .map(node => {
                        if (node.children) {
                            return { ...node, children: removeNode(node.children) };
                        }
                        return node;
                    });
            };
            return {
                ...prev,
                files: removeNode(prev.files),
                activeFileId: prev.activeFileId === id ? null : prev.activeFileId,
            };
        });
    }, [fileSystem, findNode]);

    // Toggle folder
    const toggleFolder = useCallback((id: string) => {
        setFileSystem(prev => {
            const updateNodes = (nodes: FileNode[]): FileNode[] => {
                return nodes.map(node => {
                    if (node.id === id && node.type === 'folder') {
                        return { ...node, expanded: !node.expanded };
                    }
                    if (node.children) {
                        return { ...node, children: updateNodes(node.children) };
                    }
                    return node;
                });
            };
            return { ...prev, files: updateNodes(prev.files) };
        });
    }, []);

    // Update file content
    const updateFileContent = useCallback(async (id: string, content: string) => {
        if (isElectron) {
            const node = findNode(fileSystem.files, id);
            if (node?.path) {
                const api = (window as any).electronAPI;
                await api.fs.writeFile(node.path, content);
            }
        }

        setFileSystem(prev => {
            const updateNodes = (nodes: FileNode[]): FileNode[] => {
                return nodes.map(node => {
                    if (node.id === id && node.type === 'file') {
                        return { ...node, content };
                    }
                    if (node.children) {
                        return { ...node, children: updateNodes(node.children) };
                    }
                    return node;
                });
            };
            return { ...prev, files: updateNodes(prev.files) };
        });
    }, [fileSystem, findNode]);

    // Get all files (flat)
    const getAllFiles = useCallback((): FileNode[] => {
        const files: FileNode[] = [];
        const collect = (nodes: FileNode[]) => {
            for (const node of nodes) {
                if (node.type === 'file') {
                    files.push(node);
                }
                if (node.children) {
                    collect(node.children);
                }
            }
        };
        collect(fileSystem.files);
        return files;
    }, [fileSystem.files]);

    // Get root folder ID
    const getRootFolderId = useCallback((): string => {
        return fileSystem.files[0]?.id || 'root';
    }, [fileSystem.files]);

    // Open workspace (Electron only)
    const openWorkspace = useCallback(async (): Promise<string | null> => {
        if (!isElectron) return null;

        const api = (window as any).electronAPI;
        const path = await api.dialog.openFolder();

        if (path) {
            await api.workspace.set(path);
            await loadDirectoryTree(path);
            return path;
        }
        return null;
    }, []);

    // Create default files in workspace
    const createDefaultFiles = useCallback(async (folderPath: string) => {
        if (!isElectron) return;
        const api = (window as any).electronAPI;
        await api.workspace.createDefaults(folderPath);
        await loadDirectoryTree(folderPath);
    }, []);

    return {
        files: fileSystem.files,
        activeFileId: fileSystem.activeFileId,
        workspacePath: fileSystem.workspacePath,
        isLoading,
        isElectron,
        getActiveFile,
        setActiveFile,
        readFileContent,
        createFile,
        createFolder,
        renameNode,
        deleteNode,
        toggleFolder,
        updateFileContent,
        findNode,
        getAllFiles,
        getRootFolderId,
        openWorkspace,
        createDefaultFiles,
        refreshWorkspace: loadElectronWorkspace,
    };
}
