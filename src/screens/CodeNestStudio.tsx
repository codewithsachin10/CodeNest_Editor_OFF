import { useState, useEffect, useCallback, useRef } from "react";
import Editor, { OnMount, Monaco, useMonaco } from "@monaco-editor/react";
import {
    Search,
    ChevronRight,
    ChevronDown,
    File,
    Folder,
    FolderOpen,
    X,
    Play,
    Square,
    Settings,
    FolderPlus,
    FilePlus,
    Trash2,
    Edit3,
    Sun,
    Moon,
    Plus,
    Minus,
    ArrowLeft,
    Save,
    GraduationCap,
    Loader2,
    Terminal,
    AlertTriangle,
    Bug,
    SkipForward,
    Maximize2,
    Minimize2,
    GripHorizontal,
    Move,
    Copy,
    Files,
    XCircle,
    Monitor,
    Wifi,
    WifiOff,
    GitBranch,
} from "lucide-react";
import { ActivityBar } from "../components/ActivityBar";
import { TerminalArea } from "../components/TerminalArea";
import { CommandPalette } from "../components/CommandPalette";
import { GitPanel } from "../components/GitPanel";
import { DebugPanel, DebugVariable } from "../components/DebugPanel";
import { useFileSystem, FileNode, getFileExtension, getLanguageFromExtension } from "../hooks/useFileSystem";
import { useEditorTabs } from "../hooks/useEditorTabs";
import { useAutoSave } from "../hooks/useAutoSave";
import { XTerminal, XTerminalHandle } from "../components/XTerminal";
import { parsePythonError, parseError, ParsedError } from "../utils/errorFormatter";
import { configureMonaco } from "../utils/monacoConfig";
import { customMonacoThemes } from "../themes/editorThemes";
import { useTheme, themeToMonacoData } from "../themes/ThemeContext";
import { NewProjectModal } from '../components/NewProjectModal';
import { projectTemplates } from '../utils/projectTemplates';
import { SnippetPanel } from '../components/SnippetPanel';
import { checkForBackups, clearAllBackups } from '../hooks/useAutoSave';
import { useSettings } from '../settings';
import { getFileIconUrl } from '../utils/languageIcons';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { UpdateBanner } from '../components/UpdateBanner';
import { useExecution } from '../hooks/useExecution';
import type { ExecutionResult } from '../core/types';


// Platform-aware modifier key symbol for display strings
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent);
const MOD = isMac ? '⌘' : 'Ctrl+';

interface CodeNestStudioProps {
    onBack?: () => void;
    onOpenSettings?: () => void;
    selectedLanguages?: string[];
}

// File type icon helper — returns an <img> element for the file's language SVG
const FileIcon = ({ filename, size = 16 }: { filename: string; size?: number }) => (
    <img src={getFileIconUrl(filename)} alt="" width={size} height={size} className="shrink-0" draggable={false} />
);

// Execution states
type ExecutionState = 'idle' | 'running' | 'finished' | 'stopped' | 'error';

export function CodeNestStudio({ onBack, onOpenSettings, selectedLanguages = [] }: CodeNestStudioProps) {
    // ─── Settings ─────────────────────────────────────────────────
    const { settings, updateSettings } = useSettings();
    const { activeTheme, monacoThemeName, getMonacoThemeData, isDark: isDarkTheme, setActiveTheme } = useTheme();
    const isOnline = useOnlineStatus();

    // State
    const [sidebarVisible, setSidebarVisible] = useState(true);
    const [outputVisible, setOutputVisible] = useState(true);
    const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });

    // Theme toggle helper (cycles between midnight-slate and clean-light)
    const setIsDarkTheme = (v: boolean | ((prev: boolean) => boolean)) => {
        const next = typeof v === 'function' ? v(isDarkTheme) : v;
        const newId = next ? 'midnight-slate' : 'clean-light';
        setActiveTheme(newId);
        updateSettings('appearance', { theme: next ? 'dark' : 'light', editorThemeId: newId });
    };
    const fontSize = settings.editor.fontSize;
    const setFontSize = (v: number | ((prev: number) => number)) => {
        const next = typeof v === 'function' ? v(fontSize) : v;
        updateSettings('editor', { fontSize: next });
    };
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
    const [renameNode, setRenameNode] = useState<{ id: string; name: string } | null>(null);
    const [showNewFileInput, setShowNewFileInput] = useState<{ parentId: string; type: 'file' | 'folder' } | null>(null);
    const [newItemName, setNewItemName] = useState('');
    // showSettings dropdown removed — gear button now opens full SettingsScreen
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [showNewProjectModal, setShowNewProjectModal] = useState(false);

    // Sidebar view
    const [activeSidebarView, setActiveSidebarView] = useState<'explorer' | 'debug' | 'snippets' | 'git'>('explorer');

    // File search in explorer
    const [fileSearchQuery, setFileSearchQuery] = useState('');

    // Tab context menu
    const [tabContextMenu, setTabContextMenu] = useState<{ x: number; y: number; tabId: string } | null>(null);

    // Crash recovery
    const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
    const [pendingBackups, setPendingBackups] = useState<Array<{ fileId: string; content: string; timestamp: number }>>([]);

    // Beginner mode (from settings)
    const beginnerMode = settings.beginnerMode.beginnerMode;
    const setBeginnerMode = (v: boolean | ((prev: boolean) => boolean)) => {
        const next = typeof v === 'function' ? v(beginnerMode) : v;
        updateSettings('beginnerMode', { beginnerMode: next });
    };

    // Command list

    // Execution state — OLD state kept for backward compat with debugger/PTY
    const [executionState, setExecutionState] = useState<ExecutionState>('idle');
    const [executionTime, setExecutionTime] = useState<string | null>(null);
    const [currentPtyId, setCurrentPtyId] = useState<string | null>(null);
    const [currentError, setCurrentError] = useState<ParsedError | null>(null);
    const [errorBuffer, setErrorBuffer] = useState<string>('');
    const errorBufferRef = useRef<string>('');
    const currentPtyIdRef = useRef<string | null>(null);

    // ═══ NEW: Execution Engine Hook ═══════════════════════════════════════
    // This is the ONLY interface for running code. Replaces direct PTY spawn.
    const execution = useExecution({
        onStdout: (data) => {
            terminalRef.current?.write(data);
        },
        onStderr: (data) => {
            terminalRef.current?.write(data);
        },
        onStateChange: (state) => {
            // Sync pipeline state to the legacy executionState for UI compat
            if (state === 'running' || state === 'compiling' || state === 'saving') {
                setExecutionState('running');
            }
        },
    });

    // Layout state
    const [sidebarWidth, setSidebarWidth] = useState(250);
    const [terminalHeight, setTerminalHeight] = useState(200);
    const [isTerminalFloating, setIsTerminalFloating] = useState(false);
    const [terminalPosition, setTerminalPosition] = useState({ x: 100, y: 100 });
    const [terminalSize, setTerminalSize] = useState({ width: 600, height: 400 });
    const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
    const [isDraggingTerminal, setIsDraggingTerminal] = useState(false);

    // Refs
    const editorRef = useRef<any>(null);
    const monacoRef = useRef<Monaco | null>(null);
    const terminalRef = useRef<XTerminalHandle>(null);
    const decorationsRef = useRef<string[]>([]);
    const startTimeRef = useRef<number>(0);

    // Hooks
    const fileSystem = useFileSystem();
    const editorTabs = useEditorTabs();

    // Get active tab
    const activeTab = editorTabs.tabs.find(t => t.id === editorTabs.activeTabId);

    // Auto-save hook
    const { hasChanges } = useAutoSave({
        content: activeTab?.content || '',
        fileId: activeTab?.fileId || null,
        onSave: async () => {
            if (activeTab) {
                await fileSystem.updateFileContent(activeTab.fileId, activeTab.content);
                editorTabs.markTabSaved(activeTab.id);
            }
        },
        enabled: !!activeTab,
    });

    // Debugging state
    const [debugMode, setDebugMode] = useState(false);
    const [debugStatus, setDebugStatus] = useState<'idle' | 'running' | 'paused' | 'stopped'>('idle');
    const [currentDebugLine, setCurrentDebugLine] = useState<number | null>(null);
    const [debugVariables, setDebugVariables] = useState<DebugVariable[]>([]);
    const debugLineDecorationRef = useRef<string[]>([]);

    // Theme colors — driven by the active theme preset
    const theme = {
        ...activeTheme.shellColors,
        bg: activeTheme.shellColors.background,
        text: activeTheme.shellColors.foreground,
    };


    // Apply theme
    useEffect(() => {
        document.documentElement.style.setProperty('--background', theme.bg);
        document.documentElement.style.setProperty('--foreground', theme.text);
        document.documentElement.style.setProperty('--sidebar', theme.sidebar);
        document.documentElement.style.setProperty('--activity-bar', theme.activityBar);
        document.documentElement.style.setProperty('--editor', theme.editor);
        document.documentElement.style.setProperty('--terminal', theme.terminal);
        document.documentElement.style.setProperty('--border', theme.border);
        document.documentElement.style.setProperty('--accent', theme.accent);
        document.documentElement.style.setProperty('--success', theme.success);
        document.documentElement.style.setProperty('--error', theme.error);
        document.documentElement.style.setProperty('--warning', theme.warning);
    }, [activeTheme]);

    // Live-update Monaco editor theme when activeTheme changes
    useEffect(() => {
        if (monacoRef.current) {
            const monacoData = getMonacoThemeData();
            monacoRef.current.editor.defineTheme(monacoThemeName, monacoData);
            monacoRef.current.editor.setTheme(monacoThemeName);
        }
    }, [activeTheme, monacoThemeName, getMonacoThemeData]);

    // Save file
    const handleSave = useCallback(async () => {
        if (!activeTab) return;

        await fileSystem.updateFileContent(activeTab.fileId, activeTab.content);
        editorTabs.markTabSaved(activeTab.id);
    }, [activeTab, fileSystem, editorTabs]);

    // Check for crash recovery backups on mount
    useEffect(() => {
        const backups = checkForBackups();
        if (backups.length > 0) {
            setPendingBackups(backups);
            setShowRecoveryDialog(true);
        }
    }, []);

    const handleRecoveryRestore = () => {
        for (const backup of pendingBackups) {
            const node = fileSystem.findNode(fileSystem.files, backup.fileId);
            if (node) {
                fileSystem.updateFileContent(backup.fileId, backup.content);
                // Also open the file in a tab
                const ext = getFileExtension(node.name);
                const language = getLanguageFromExtension(ext);
                editorTabs.openTab({
                    fileId: node.id,
                    fileName: node.name,
                    content: backup.content,
                    language,
                });
            }
        }
        clearAllBackups();
        setShowRecoveryDialog(false);
        setPendingBackups([]);
        terminalRef.current?.writeln('\x1b[32m✓ Recovered unsaved work from previous session\x1b[0m');
    };

    const handleRecoveryDiscard = () => {
        clearAllBackups();
        setShowRecoveryDialog(false);
        setPendingBackups([]);
    };

    // NOTE: Python path detection removed — RuntimeResolver in main process handles this now

    // Setup PTY listeners — use refs to avoid stale closures
    useEffect(() => {
        if (!fileSystem.isElectron) return;

        const api = window.electronAPI;

        // Listen for PTY data
        const removeDataListener = api.pty.onData((data: { id: string; data: string }) => {
            if (data.id === currentPtyIdRef.current) {
                // Always write to terminal
                terminalRef.current?.write(data.data);

                // Buffer stderr-like output for error parsing (capped at 100KB to prevent OOM)
                if (data.data.includes('Error') || data.data.includes('Traceback') || data.data.includes('error:')) {
                    const MAX_ERROR_BUFFER = 100 * 1024; // 100KB
                    if (errorBufferRef.current.length < MAX_ERROR_BUFFER) {
                        errorBufferRef.current += data.data;
                        setErrorBuffer(errorBufferRef.current);
                    }
                }
            }
        });

        // Listen for PTY exit
        const removeExitListener = api.pty.onExit((data: { id: string; exitCode: number }) => {
            if (data.id === currentPtyIdRef.current) {
                const elapsed = Date.now() - startTimeRef.current;
                setExecutionTime(`${elapsed}ms`);
                setCurrentPtyId(null);
                currentPtyIdRef.current = null;
                setDebugStatus('stopped');
                setCurrentDebugLine(null);
                clearDebugDecorations();

                if (data.exitCode === 0) {
                    setExecutionState('finished');
                } else {
                    setExecutionState('error');
                    const currentErrorBuf = errorBufferRef.current;
                    if (currentErrorBuf) {
                        // Use language-aware error parser
                        const parsed = parseError(currentErrorBuf, 'py');
                        setCurrentError(parsed);
                        if (parsed.lineNumber) {
                            highlightErrorLine(parsed.lineNumber, parsed.columnNumber);
                        }
                    }
                }

                terminalRef.current?.writeln(`\r\n\x1b[90m[Process exited with code ${data.exitCode}]\x1b[0m`);
            }
        });

        return () => {
            removeDataListener();
            removeExitListener();
        };
    }, [fileSystem.isElectron]);


    // Debugger Helpers
    const clearDebugDecorations = useCallback(() => {
        if (editorRef.current && debugLineDecorationRef.current.length > 0) {
            debugLineDecorationRef.current = editorRef.current.deltaDecorations(debugLineDecorationRef.current, []);
        }
    }, []);

    const highlightDebugLine = (lineNumber: number) => {
        if (!editorRef.current || !monacoRef.current) return;
        const monaco = monacoRef.current;
        const editor = editorRef.current;

        editor.revealLineInCenter(lineNumber);
        debugLineDecorationRef.current = editor.deltaDecorations(debugLineDecorationRef.current, [
            {
                range: new monaco.Range(lineNumber, 1, lineNumber, 1),
                options: {
                    isWholeLine: true,
                    className: 'debug-line-highlight',
                    glyphMarginClassName: 'debug-glyph',
                },
            },
        ]);
    };

    const runDebuggerCommand = (cmd: string) => {
        if (currentPtyId && fileSystem.isElectron) {
            const api = window.electronAPI;
            api.pty.write(currentPtyId, cmd + '\n');
        }
    };

    const handleDebug = useCallback(async () => {
        if (!activeTab || executionState === 'running') return;

        // Reset
        clearErrorDecorations();
        setCurrentError(null);
        setErrorBuffer('');
        terminalRef.current?.clear();
        await handleSave();

        setDebugMode(true);
        setExecutionState('running');
        setDebugStatus('running');
        startTimeRef.current = Date.now();

        if (fileSystem.isElectron) {
            const api = window.electronAPI;
            const file = fileSystem.findNode(fileSystem.files, activeTab.fileId);

            if (!file) return;

            // Only Python supported for now
            if (getFileExtension(file.name) !== 'py') {
                terminalRef.current?.writeln('\x1b[33mDebugger currently supports Python only.\x1b[0m');
                setExecutionState('finished');
                setDebugMode(false);
                return;
            }

            // Prepare Run
            let runPath = file.path;
            let runCwd = fileSystem.workspacePath;
            if (!runPath) { // Virtual file
                const tempDir = await api.app.getPath('temp');
                runPath = `${tempDir}/${file.name}`;
                await api.fs.writeFile(runPath, file.content || '');
                runCwd = tempDir;
            }

            // Spawn PDB
            terminalRef.current?.writeln(`\x1b[36m🐞 Debugging ${activeTab.fileName}...\x1b[0m`);
            const platform = await api.app.getInfo().then((info: any) => info.platform);
            const cmd = platform === 'win32' ? 'python' : 'python3';

            const result = await api.pty.spawn({
                cmd: cmd,
                args: ['-u', '-m', 'pdb', runPath],
                cwd: runCwd,
                cols: 80,
                rows: 24
            });

            if (result.success) {
                setCurrentPtyId(result.id);
                currentPtyIdRef.current = result.id;
            } else {
                setExecutionState('error');
                terminalRef.current?.writeln(`Error starting debugger: ${result.error}`);
            }
        }
    }, [activeTab, executionState, fileSystem, handleSave]);

    // Editor mount
    const handleEditorMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;

        // Register legacy custom themes (for fallback)
        Object.entries(customMonacoThemes).forEach(([name, themeData]) => {
            monaco.editor.defineTheme(name, themeData);
        });

        // Register and apply the active theme from ThemeContext
        const monacoData = getMonacoThemeData();
        monaco.editor.defineTheme(monacoThemeName, monacoData);
        monaco.editor.setTheme(monacoThemeName);

        // Configure IntelliSense
        configureMonaco(monaco);

        editor.onDidChangeCursorPosition((e) => {
            setCursorPosition({ line: e.position.lineNumber, column: e.position.column });
        });

        editor.onDidChangeModelContent(() => {
            if (activeTab) {
                editorTabs.updateTabContent(activeTab.id, editor.getValue());
            }
        });
    };

    // Resizing logic
    const handleMouseDown = (e: React.MouseEvent, type: 'sidebar' | 'terminal') => {
        e.preventDefault();
        if (type === 'sidebar') setIsDraggingSidebar(true);
        if (type === 'terminal') setIsDraggingTerminal(true);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDraggingSidebar) {
                const newWidth = Math.max(150, Math.min(600, e.clientX - 48)); // 48 is activity bar width
                setSidebarWidth(newWidth);
            }
            if (isDraggingTerminal && !isTerminalFloating) {
                // Docked terminal: resize from bottom up
                const newHeight = Math.max(100, Math.min(800, window.innerHeight - e.clientY));
                setTerminalHeight(newHeight);
            }
        };

        const handleMouseUp = () => {
            setIsDraggingSidebar(false);
            setIsDraggingTerminal(false);
        };

        if (isDraggingSidebar || isDraggingTerminal) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = isDraggingSidebar ? 'col-resize' : 'row-resize';
        } else {
            document.body.style.cursor = 'default';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
        };
    }, [isDraggingSidebar, isDraggingTerminal, isTerminalFloating]);

    // Handle file click
    const handleFileClick = useCallback(async (node: FileNode) => {
        if (node.type === 'folder') {
            fileSystem.toggleFolder(node.id);
            return;
        }

        let content = node.content || '';
        if (fileSystem.isElectron && node.path) {
            try {
                content = await fileSystem.readFileContent(node);
            } catch (e) {
                console.error('Failed to read file:', e);
            }
        }

        const ext = getFileExtension(node.name);
        const language = getLanguageFromExtension(ext);

        editorTabs.openTab({
            fileId: node.id,
            fileName: node.name,
            content,
            language,
        });

        fileSystem.setActiveFile(node.id);
    }, [fileSystem, editorTabs]);


    // Clear error decorations
    const clearErrorDecorations = useCallback(() => {
        if (editorRef.current && decorationsRef.current.length > 0) {
            decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
        }
    }, []);

    // Highlight error line
    const highlightErrorLine = (lineNumber: number, columnNumber?: number | null) => {
        if (!editorRef.current || !monacoRef.current) return;

        const monaco = monacoRef.current;
        const editor = editorRef.current;

        editor.revealLineInCenter(lineNumber);
        if (columnNumber) {
            editor.setPosition({ lineNumber, column: columnNumber });
        }

        decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
            {
                range: new monaco.Range(lineNumber, 1, lineNumber, 1),
                options: {
                    isWholeLine: true,
                    className: 'error-line-highlight',
                    glyphMarginClassName: 'error-glyph',
                },
            },
        ]);
    };

    // Stop execution
    // ═══ STOP — uses ExecutionService for code runs, PTY for debugger ═══
    const handleStop = useCallback(async () => {
        if (debugMode && currentPtyId && fileSystem.isElectron) {
            // Debugger uses PTY — kill via PTY API
            const api = window.electronAPI;
            await api.pty.kill(currentPtyId);
            terminalRef.current?.writeln('\r\n\x1b[33m[Debug session stopped by user]\x1b[0m');
            setCurrentPtyId(null);
            currentPtyIdRef.current = null;
            setDebugMode(false);
            setDebugStatus('stopped');
            setExecutionState('stopped');
        } else {
            // Code execution uses ExecutionService — kill via new engine
            await execution.stop();
            terminalRef.current?.writeln('\r\n\x1b[33m[Execution stopped by user]\x1b[0m');
            setExecutionState('stopped');
        }
    }, [currentPtyId, fileSystem.isElectron, debugMode, execution]);

    // ═══ RUN — uses ExecutionService (deterministic 10-step pipeline) ═══
    // This replaces the old 120-line handleRun that called pty.spawn directly.
    const handleRun = useCallback(async () => {
        // Guard: prevent overlapping runs
        if (executionState === 'running' || execution.executionState === 'running') return;
        if (!activeTab) return;

        // Clear previous state
        clearErrorDecorations();
        setCurrentError(null);
        setErrorBuffer('');
        errorBufferRef.current = '';
        setExecutionTime(null);
        if (settings.terminal.clearOnRun || settings.runDebug.clearOutputBeforeRun) {
            terminalRef.current?.clear();
        }

        setExecutionState('running');
        startTimeRef.current = Date.now();

        if (fileSystem.isElectron) {
            const file = fileSystem.findNode(fileSystem.files, activeTab.fileId);
            if (!file) {
                setExecutionState('error');
                terminalRef.current?.writeln('\x1b[31mError: File not found.\x1b[0m');
                return;
            }

            // Determine file path — use real path or create temp for virtual files
            let runPath = file.path;
            let runCwd = fileSystem.workspacePath || '';

            if (!runPath) {
                // Virtual file — construct a temp path (ExecutionService will save it)
                try {
                    const api = window.electronAPI;
                    const tempDir = await api.app.getPath('temp');
                    runPath = `${tempDir}/${file.name}`;
                    runCwd = tempDir;
                } catch {
                    runPath = file.name;
                }
            }

            if (!runCwd) {
                try {
                    const api = window.electronAPI;
                    runCwd = await api.app.getPath('home');
                } catch { /* ignore */ }
            }

            // ─── Call the ExecutionService via useExecution hook ───
            const result = await execution.run({
                filePath: runPath,
                content: activeTab.content || file.content || '',
                cwd: runCwd,
                timeoutMs: settings.runDebug.maxExecutionTimeMs || 10000,
            });

            // ─── Handle the structured ExecutionResult ─────────────
            if (result) {
                const elapsed = result.durationMs;
                setExecutionTime(`${elapsed}ms`);

                if (result.success) {
                    setExecutionState('finished');
                } else if (result.killed) {
                    if (result.errorType === 'timeout') {
                        setExecutionState('error');
                        terminalRef.current?.writeln(`\r\n\x1b[33m[Execution timed out]\x1b[0m`);
                    } else {
                        setExecutionState('stopped');
                    }
                } else {
                    setExecutionState('error');

                    // Highlight error line if available
                    if (result.errorLine) {
                        highlightErrorLine(result.errorLine, result.errorColumn);
                    }

                    // Set parsed error for the error panel
                    if (result.errorMessage) {
                        setCurrentError({
                            lineNumber: result.errorLine || null,
                            columnNumber: result.errorColumn || null,
                            errorType: result.errorType || 'Error',
                            friendlyMessage: result.errorMessage,
                            rawMessage: result.errorMessage,
                            fullTraceback: result.stderr,
                        });
                    }
                }

                terminalRef.current?.writeln(
                    `\r\n\x1b[90m[Process exited with code ${result.exitCode}] (${elapsed}ms)\x1b[0m`
                );
            } else {
                // null result = debounced or not ready
                setExecutionState('idle');
            }
        } else {
            // Web simulation
            terminalRef.current?.writeln('\x1b[33mReal terminal requires Electron desktop mode\x1b[0m');
            setTimeout(() => setExecutionState('finished'), 500);
        }
    }, [activeTab, executionState, execution, fileSystem, handleSave, clearErrorDecorations, settings]);

    // NOTE: getRunConfig() REMOVED — now handled by RuntimeResolver in main process.
    // The ExecutionService resolves compiler paths using:
    //   1. User settings (settings.languages)
    //   2. Bundled portable runtimes (resources/runtime/)
    //   3. System PATH
    // This eliminates shell:true, && chaining, and command injection risks.

    // Handle terminal input (for input())
    const handleTerminalData = useCallback((data: string) => {
        if (currentPtyId && fileSystem.isElectron) {
            const api = window.electronAPI;
            api.pty.write(currentPtyId, data);
        }
    }, [currentPtyId, fileSystem.isElectron]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isMod = e.metaKey || e.ctrlKey;

            if (isMod && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
            if (isMod && e.key === 'Enter') {
                e.preventDefault();
                if (executionState !== 'running') handleRun();
            }
            if (isMod && e.key === 'b') {
                e.preventDefault();
                setSidebarVisible(v => !v);
            }
            if (isMod && !e.shiftKey && (e.key === 'o' || e.key === 'O')) {
                e.preventDefault();
                fileSystem.openWorkspace();
            }
            if (isMod && e.key === '`') {
                e.preventDefault();
                setOutputVisible(v => !v);
            }
            if (isMod && e.shiftKey && (e.key === 'p' || e.key === 'P')) {
                e.preventDefault();
                setShowCommandPalette(true);
            }
            if (isMod && e.key === '=') {
                e.preventDefault();
                setFontSize(s => Math.min(s + 2, 24));
            }
            if (isMod && e.key === '-') {
                e.preventDefault();
                setFontSize(s => Math.max(s - 2, 10));
            }
            if (e.key === 'Escape' && executionState === 'running') {
                handleStop();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSave, handleRun, handleStop, executionState]);

    // Filter file tree by search query
    const filterFileTree = useCallback((nodes: FileNode[], query: string): FileNode[] => {
        if (!query.trim()) return nodes;
        const q = query.toLowerCase();
        return nodes.reduce<FileNode[]>((acc, node) => {
            if (node.type === 'folder') {
                const filteredChildren = filterFileTree(node.children || [], query);
                if (filteredChildren.length > 0 || node.name.toLowerCase().includes(q)) {
                    acc.push({ ...node, children: filteredChildren, expanded: true });
                }
            } else if (node.name.toLowerCase().includes(q)) {
                acc.push(node);
            }
            return acc;
        }, []);
    }, []);

    // Render file tree
    const renderFileTree = (nodes: FileNode[], depth = 0): JSX.Element[] => {
        return nodes.map((node) => {
            const isActive = activeTab?.fileId === node.id;
            const isFolder = node.type === 'folder';
            const isExpanded = node.expanded;

            return (
                <div key={node.id}>
                    <div
                        className={`flex items-center gap-1.5 px-2 py-1 cursor-pointer rounded-sm transition-colors ${isActive ? 'bg-white/10' : 'hover:bg-white/5'
                            }`}
                        style={{ paddingLeft: `${depth * 12 + 8}px` }}
                        onClick={() => handleFileClick(node)}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            setContextMenu({ x: e.clientX, y: e.clientY, nodeId: node.id });
                        }}
                    >
                        {isFolder ? (
                            <>
                                {isExpanded ? <ChevronDown className="w-3 h-3 opacity-50" /> : <ChevronRight className="w-3 h-3 opacity-50" />}
                                {isExpanded ? <FolderOpen className="w-4 h-4 text-yellow-400" /> : <Folder className="w-4 h-4 text-yellow-400" />}
                            </>
                        ) : (
                            <>
                                <span className="w-3" />
                                <FileIcon filename={node.name} size={16} />
                            </>
                        )}

                        {renameNode?.id === node.id ? (
                            <input
                                autoFocus
                                className="flex-1 bg-transparent border border-white/20 rounded px-1 text-xs"
                                value={renameNode.name}
                                onChange={(e) => setRenameNode({ ...renameNode, name: e.target.value })}
                                onBlur={() => {
                                    if (renameNode.name.trim()) fileSystem.renameNode(node.id, renameNode.name);
                                    setRenameNode(null);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        if (renameNode.name.trim()) fileSystem.renameNode(node.id, renameNode.name);
                                        setRenameNode(null);
                                    }
                                    if (e.key === 'Escape') setRenameNode(null);
                                }}
                            />
                        ) : (
                            <span className="text-xs truncate">{node.name}</span>
                        )}
                    </div>

                    {isFolder && isExpanded && node.children && renderFileTree(node.children, depth + 1)}
                </div>
            );
        });
    };

    // Create file/folder
    const handleCreateItem = async () => {
        if (!showNewFileInput || !newItemName.trim()) return;

        if (showNewFileInput.type === 'file') {
            await fileSystem.createFile(showNewFileInput.parentId, newItemName);
        } else {
            await fileSystem.createFolder(showNewFileInput.parentId, newItemName);
        }

        setShowNewFileInput(null);
        setNewItemName('');
    };

    // Command list
    const commands = [
        { id: 'run', name: 'Run Active File', shortcut: `${MOD}Enter`, icon: Play, action: () => handleRun() },
        { id: 'stop', name: 'Stop Execution', shortcut: 'Esc', icon: Square, action: () => handleStop() },
        { id: 'save', name: 'Save File', shortcut: `${MOD}S`, icon: Save, action: () => handleSave() },
        { id: 'new_file', name: 'New File', icon: FilePlus, action: () => setShowNewFileInput({ parentId: fileSystem.getRootFolderId(), type: 'file' }) },
        { id: 'new_project', name: 'New Project...', icon: FolderPlus, action: () => setShowNewProjectModal(true) },
        { id: 'open_folder', name: 'Open Folder...', shortcut: `${MOD}O`, icon: FolderOpen, action: () => fileSystem.openWorkspace() },
        { id: 'toggle_sidebar', name: 'Toggle Side Bar', shortcut: `${MOD}B`, icon: ChevronRight, action: () => setSidebarVisible(v => !v) },
        { id: 'toggle_terminal', name: 'Toggle Terminal', shortcut: `${MOD}\``, icon: Terminal, action: () => setOutputVisible(v => !v) },
        { id: 'zoom_in', name: 'Zoom In', shortcut: `${MOD}=`, icon: Plus, action: () => setFontSize(s => Math.min(s + 2, 24)) },
        { id: 'zoom_out', name: 'Zoom Out', shortcut: `${MOD}-`, icon: Minus, action: () => setFontSize(s => Math.max(s - 2, 10)) },
        { id: 'toggle_theme', name: `Toggle ${isDarkTheme ? 'Light' : 'Dark'} Theme`, icon: isDarkTheme ? Sun : Moon, action: () => setIsDarkTheme(v => !v) },
        { id: 'toggle_beginner', name: `Toggle Beginner Mode ${beginnerMode ? 'OFF' : 'ON'}`, icon: GraduationCap, action: () => setBeginnerMode(v => !v) },
        { id: 'snippets', name: 'Open Snippets Panel', icon: GraduationCap, action: () => { setSidebarVisible(true); setActiveSidebarView('snippets'); } },
        { id: 'back', name: 'Go Back Home', icon: ArrowLeft, action: () => onBack && onBack() },
    ];

    // Get execution status
    const getStatusDisplay = () => {
        switch (executionState) {
            case 'running':
                return <><Loader2 className="w-3 h-3 animate-spin" /> Running...</>;
            case 'finished':
                return <><span className="text-green-300">✓</span> Finished {executionTime && `(${executionTime})`}</>;
            case 'stopped':
                return <><span className="text-yellow-300">⏹</span> Stopped</>;
            case 'error':
                return <><span className="text-red-300">✗</span> Error {executionTime && `(${executionTime})`}</>;
            default:
                return <>Ready</>;
        }
    };

    return (
        <div
            className="flex flex-col h-screen overflow-hidden"
            style={{ backgroundColor: theme.bg, color: theme.text }}
            onClick={() => {
                setContextMenu(null);
                setTabContextMenu(null);
            }}
        >
            {/* Auto-Update Banner */}
            <UpdateBanner />

            {/* Title Bar */}
            <div
                className="flex items-center justify-between px-4 py-2 shrink-0 app-region-drag backdrop-blur-sm"
                style={{ backgroundColor: theme.activityBar + 'F2', borderBottom: `1px solid ${theme.border}` }}
            >
                <div className="flex items-center gap-4 app-region-no-drag">
                    <div className="flex items-center gap-1.5">
                        <button onClick={() => fileSystem.isElectron && window.electronAPI?.window.close()} className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-110" />
                        <button onClick={() => fileSystem.isElectron && window.electronAPI?.window.minimize()} className="w-3 h-3 rounded-full bg-[#febc2e] hover:brightness-110" />
                        <button onClick={() => fileSystem.isElectron && window.electronAPI?.window.maximize()} className="w-3 h-3 rounded-full bg-[#28c840] hover:brightness-110" />
                    </div>
                    <span className="text-sm font-semibold">🪺 CodeNest Studio</span>
                </div>

                <div className="flex items-center gap-2 app-region-no-drag">
                    {/* Run / Stop Controls */}
                    {executionState === 'running' ? (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-yellow-400 font-mono">{executionTime ? 'Finished' : 'Running...'}</span>
                            <button onClick={handleStop} className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/30 font-medium">
                                <Square className="w-4 h-4 fill-current" /> Stop
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button onClick={handleRun} className="flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 font-medium border border-emerald-500/20 transition-all hover:shadow-[0_0_12px_rgba(52,211,153,0.15)]" title={`Run (${MOD} Enter)`}>
                                <Play className="w-4 h-4 fill-current" /> Run
                            </button>
                            <button onClick={handleDebug} className="flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-lg bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 font-medium border border-amber-500/20 transition-all hover:shadow-[0_0_12px_rgba(251,191,36,0.15)]" title="Debug (Start PDB)">
                                <Bug className="w-4 h-4" /> Debug
                            </button>
                        </div>
                    )}
                    <button onClick={handleSave} className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md hover:bg-white/10 ${hasChanges ? 'text-yellow-400' : ''}`} title={`Save (${MOD}S)`}>
                        <Save className="w-4 h-4" />
                        {hasChanges && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />}
                    </button>
                </div>

                <div className="flex items-center gap-2 app-region-no-drag relative">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${theme.accent}20`, color: theme.accent }}>{activeTab ? getLanguageFromExtension(getFileExtension(activeTab.fileName)).charAt(0).toUpperCase() + getLanguageFromExtension(getFileExtension(activeTab.fileName)).slice(1) : 'Plain Text'}</span>
                    <button onClick={() => setFontSize(s => Math.max(s - 2, 10))} className="p-1.5 rounded hover:bg-white/10"><Minus className="w-4 h-4" /></button>
                    <span className="text-xs w-6 text-center">{fontSize}</span>
                    <button onClick={() => setFontSize(s => Math.min(s + 2, 24))} className="p-1.5 rounded hover:bg-white/10"><Plus className="w-4 h-4" /></button>

                    <button onClick={() => onOpenSettings?.()} className="p-1.5 rounded hover:bg-white/10" title="Settings"><Settings className="w-4 h-4" /></button>

                    {onBack && (
                        <button onClick={onBack} className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-white/10 opacity-70">
                            <ArrowLeft className="w-3 h-3" /> Back
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Activity Bar */}
                <ActivityBar 
                    theme={theme}
                    sidebarVisible={sidebarVisible}
                    activeSidebarView={activeSidebarView}
                    setActiveSidebarView={setActiveSidebarView}
                />

                {/* Sidebar Views */}
                {sidebarVisible && activeSidebarView === 'explorer' && (
                    <div className="flex flex-col shrink-0 relative" style={{ width: sidebarWidth, backgroundColor: theme.sidebar, borderRight: `1px solid ${theme.border}` }}>
                        <div className="flex items-center justify-between px-3 py-2 text-xs font-bold tracking-wider text-white/40">
                            <span>EXPLORER</span>
                            <div className="flex items-center gap-0.5">
                                <button onClick={() => fileSystem.openWorkspace()} className="p-1 rounded hover:bg-white/10" title="Open Folder"><FolderOpen className="w-3.5 h-3.5" /></button>
                                <button onClick={() => setShowNewFileInput({ parentId: fileSystem.getRootFolderId(), type: 'file' })} className="p-1 rounded hover:bg-white/10" title="New File"><FilePlus className="w-3.5 h-3.5" /></button>
                                <button onClick={() => setShowNewFileInput({ parentId: fileSystem.getRootFolderId(), type: 'folder' })} className="p-1 rounded hover:bg-white/10" title="New Folder"><FolderPlus className="w-3.5 h-3.5" /></button>
                            </div>
                        </div>
                        {/* File Search */}
                        <div className="px-2 pb-2">
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 opacity-40" />
                                <input
                                    type="text"
                                    placeholder="Search files..."
                                    value={fileSearchQuery}
                                    onChange={(e) => setFileSearchQuery(e.target.value)}
                                    className="w-full h-6 pl-6 pr-6 rounded text-xs bg-white/5 border border-white/10 placeholder-white/20 focus:outline-none focus:border-sky-500/40 transition-colors"
                                />
                                {fileSearchQuery && (
                                    <button onClick={() => setFileSearchQuery('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-white/10">
                                        <XCircle className="w-3 h-3 opacity-40" />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto py-1">
                            {showNewFileInput && (
                                <div className="flex items-center gap-1.5 px-2 py-1" style={{ paddingLeft: '20px' }}>
                                    {showNewFileInput.type === 'file' ? <File className="w-4 h-4 text-[#64748B]" /> : <Folder className="w-4 h-4 text-yellow-400" />}
                                    <input
                                        autoFocus
                                        className="flex-1 bg-transparent border border-white/20 rounded px-1 text-xs"
                                        placeholder={`New ${showNewFileInput.type}...`}
                                        value={newItemName}
                                        onChange={(e) => setNewItemName(e.target.value)}
                                        onBlur={() => { if (newItemName.trim()) handleCreateItem(); else { setShowNewFileInput(null); setNewItemName(''); } }}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleCreateItem(); if (e.key === 'Escape') { setShowNewFileInput(null); setNewItemName(''); } }}
                                    />
                                </div>
                            )}
                            {renderFileTree(filterFileTree(fileSystem.files, fileSearchQuery))}
                        </div>
                        {/* Resizer Handle */}
                        <div
                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/50 z-20"
                            onMouseDown={(e) => handleMouseDown(e, 'sidebar')}
                        />
                    </div>
                )}

                {/* Snippets Sidebar View */}
                {sidebarVisible && activeSidebarView === 'snippets' && (
                    <div className="shrink-0 border-r relative flex flex-col" style={{ width: sidebarWidth, backgroundColor: theme.sidebar, borderColor: theme.border }}>
                        <SnippetPanel
                            isDarkTheme={isDarkTheme}
                            currentLanguage={activeTab ? getLanguageFromExtension(getFileExtension(activeTab.fileName)) : undefined}
                            onInsert={(code) => {
                                if (editorRef.current) {
                                    const editor = editorRef.current;
                                    const position = editor.getPosition();
                                    if (position) {
                                        editor.executeEdits('snippet-insert', [{
                                            range: {
                                                startLineNumber: position.lineNumber,
                                                startColumn: position.column,
                                                endLineNumber: position.lineNumber,
                                                endColumn: position.column,
                                            },
                                            text: code,
                                        }]);
                                        editor.focus();
                                    }
                                }
                            }}
                        />
                        {/* Resizer Handle */}
                        <div
                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/50 z-20"
                            onMouseDown={(e) => handleMouseDown(e, 'sidebar')}
                        />
                    </div>
                )}

                {/* Debug Sidebar View */}
                {sidebarVisible && activeSidebarView === 'debug' && (
                    <div className="shrink-0 border-r relative" style={{ width: sidebarWidth, backgroundColor: theme.sidebar, borderColor: theme.border }}>
                        <DebugPanel
                            status={debugStatus}
                            variables={debugVariables}
                            currentLine={currentDebugLine}
                            onContinue={() => runDebuggerCommand('c')}
                            onStepOver={() => runDebuggerCommand('n')}
                            onStepInto={() => runDebuggerCommand('s')}
                            onStop={handleStop}
                        />
                        {/* Resizer Handle */}
                        <div
                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/50 z-20"
                            onMouseDown={(e) => handleMouseDown(e, 'sidebar')}
                        />
                    </div>
                )}

                {/* Git Sidebar View */}
                {sidebarVisible && activeSidebarView === 'git' && (
                    <div className="shrink-0 border-r relative flex flex-col" style={{ width: sidebarWidth, backgroundColor: theme.sidebar, borderColor: theme.border }}>
                        <GitPanel cwd={fileSystem.workspacePath || ''} />
                        {/* Resizer Handle */}
                        <div
                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/50 z-20"
                            onMouseDown={(e) => handleMouseDown(e, 'sidebar')}
                        />
                    </div>
                )}

                {/* Editor + Terminal */}
                <div className="flex flex-col flex-1 overflow-hidden">
                    {/* Tabs */}
                    <div className="flex items-center h-9 shrink-0 overflow-x-auto" style={{ backgroundColor: theme.sidebar, borderBottom: `1px solid ${theme.border}` }}>
                        {editorTabs.tabs.map((tab) => (
                            <div
                                key={tab.id}
                                className={`flex items-center gap-2 px-3 h-full cursor-pointer border-r group/tab relative ${tab.id === editorTabs.activeTabId ? '' : 'opacity-60 hover:opacity-100'}`}
                                style={{
                                    backgroundColor: tab.id === editorTabs.activeTabId ? theme.editor : 'transparent',
                                    borderColor: theme.border,
                                    borderBottom: tab.id === editorTabs.activeTabId ? `2px solid ${theme.accent}` : '2px solid transparent',
                                }}
                                onClick={() => editorTabs.setActiveTab(tab.id)}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    setTabContextMenu({ x: e.clientX, y: e.clientY, tabId: tab.id });
                                }}
                            >
                                <FileIcon filename={tab.fileName} size={14} />
                                <span className="text-xs">{tab.fileName}</span>
                                {!tab.isSaved && <span className="w-2 h-2 rounded-full bg-yellow-400" />}
                                <button onClick={(e) => { e.stopPropagation(); editorTabs.closeTab(tab.id); }} className="p-0.5 rounded hover:bg-white/10 opacity-0 group-hover/tab:opacity-100 transition-opacity">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        {editorTabs.tabs.length === 0 && (
                            <div className="flex items-center px-3 h-full text-xs opacity-30">No files open</div>
                        )}
                    </div>

                    {/* Editor */}
                    <div className="flex-1 relative" style={{ backgroundColor: theme.editor }}>
                        {activeTab ? (
                            <ErrorBoundary name="Editor">
                            <Editor
                                height="100%"
                                language={activeTab.language}
                                theme={monacoThemeName}
                                value={activeTab.content}
                                onMount={handleEditorMount}
                                loading={<div className="flex items-center justify-center h-full opacity-40"><Loader2 className="w-6 h-6 animate-spin" /><span className="ml-2 text-sm">Loading editor...</span></div>}
                                options={{
                                    fontSize: settings.editor.fontSize,
                                    fontFamily: settings.editor.fontFamily,
                                    fontLigatures: false,
                                    minimap: { 
                                        enabled: settings.editor.minimap, 
                                        maxColumn: 80,
                                        renderCharacters: false,
                                        scale: 0.9,
                                        showSlider: 'always'
                                    },
                                    find: {
                                        addExtraSpaceOnTop: false,
                                        autoFindInSelection: 'always',
                                        seedSearchStringFromSelection: 'always'
                                    },
                                    scrollBeyondLastLine: false,
                                    padding: { top: 12 },
                                    lineNumbers: settings.editor.showLineNumbers ? 'on' : 'off',
                                    lineNumbersMinChars: 3,
                                    lineDecorationsWidth: 8,
                                    tabSize: settings.editor.tabSize,
                                    insertSpaces: settings.editor.insertSpaces,
                                    automaticLayout: true,
                                    wordWrap: settings.editor.wordWrap,
                                    lineHeight: Math.round(settings.editor.fontSize * settings.editor.lineHeight),
                                    renderLineHighlight: settings.editor.highlightActiveLine ? 'line' : 'none',
                                    glyphMargin: false,
                                    folding: true,
                                    // ─── Performance optimizations ───
                                    renderWhitespace: 'none',
                                    guides: { indentation: true, bracketPairs: false },
                                    occurrencesHighlight: 'off',
                                    selectionHighlight: false,
                                    codeLens: false,
                                    links: false,
                                    colorDecorators: false,
                                    bracketPairColorization: { enabled: false },
                                    matchBrackets: 'near',
                                    suggest: { preview: false, showStatusBar: false },
                                    hover: { delay: 400 },
                                    quickSuggestions: { other: true, strings: false, comments: false },
                                    parameterHints: { enabled: false },
                                    smoothScrolling: false,
                                    cursorSmoothCaretAnimation: 'off',
                                    cursorBlinking: 'solid',
                                    scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
                                }}
                            />
                            </ErrorBoundary>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full opacity-40 text-center select-none">
                                <span className="text-6xl mb-4">🪺</span>
                                <h2 className="text-xl font-semibold mb-2">Welcome to CodeNest Studio</h2>
                                <p className="text-sm mb-6">Select a file from the explorer to start coding</p>
                                <div className="flex flex-col gap-2 text-xs opacity-70">
                                    <div className="flex items-center gap-2">
                                        <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px]">{MOD} Enter</kbd>
                                        <span>Run code</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px]">{MOD} S</kbd>
                                        <span>Save file</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px]">{MOD} {isMac ? '⇧' : 'Shift+'} P</kbd>
                                        <span>Command palette</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px]">{MOD} O</kbd>
                                        <span>Open folder</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Terminal */}
                    {outputVisible && (
                        <TerminalArea
                            isTerminalFloating={isTerminalFloating}
                            setIsTerminalFloating={setIsTerminalFloating}
                            terminalPosition={terminalPosition}
                            setTerminalPosition={setTerminalPosition}
                            terminalSize={terminalSize}
                            setTerminalSize={setTerminalSize}
                            terminalHeight={terminalHeight}
                            theme={theme}
                            handleMouseDown={handleMouseDown}
                            executionState={executionState}
                            getStatusDisplay={getStatusDisplay}
                            handleStop={handleStop}
                            handleRun={handleRun}
                            terminalRef={terminalRef}
                            beginnerMode={beginnerMode}
                            currentError={currentError}
                            highlightErrorLine={highlightErrorLine}
                            settings={settings}
                            isDarkTheme={isDarkTheme}
                            handleTerminalData={handleTerminalData}
                        />
                    )}
                </div>
            </div>

            {/* Status Bar */}
            <div className="flex items-center justify-between px-3 py-1 text-[10px] shrink-0" style={{ backgroundColor: theme.activityBar, borderTop: `1px solid ${theme.border}`, color: theme.textMuted }}>
                <div className="flex items-center gap-3 font-medium">
                    <span className="flex items-center gap-1">{activeTab ? (<><FileIcon filename={activeTab.fileName} size={12} />{getLanguageFromExtension(getFileExtension(activeTab.fileName)).charAt(0).toUpperCase() + getLanguageFromExtension(getFileExtension(activeTab.fileName)).slice(1)}</>) : 'Plain Text'}</span>
                    {beginnerMode && <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400"><GraduationCap className="w-3 h-3" /> Beginner</span>}
                    {fileSystem.isElectron && <span className="flex items-center gap-1 opacity-60"><Monitor className="w-3 h-3" />Desktop</span>}
                    {isOnline
                        ? <span className="flex items-center gap-1 opacity-50"><Wifi className="w-3 h-3" />Online</span>
                        : <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400"><WifiOff className="w-3 h-3" />Offline</span>
                    }
                </div>
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">{getStatusDisplay()}</span>
                    <span className="opacity-60">Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
                    <span className="opacity-60">UTF-8</span>
                    <span className="opacity-60">{editorTabs.tabs.length} file{editorTabs.tabs.length !== 1 ? 's' : ''}</span>
                </div>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div className="fixed py-1 rounded-lg shadow-2xl z-50 min-w-[160px]" style={{ left: contextMenu.x, top: contextMenu.y, backgroundColor: theme.sidebar, border: `1px solid ${theme.border}` }} onClick={(e) => e.stopPropagation()}>
                    <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/10" onClick={() => { const node = fileSystem.findNode(fileSystem.files, contextMenu.nodeId); if (node) setRenameNode({ id: node.id, name: node.name }); setContextMenu(null); }}>
                        <Edit3 className="w-3 h-3" /> Rename
                    </button>
                    <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/10" onClick={() => {
                        const node = fileSystem.findNode(fileSystem.files, contextMenu.nodeId);
                        if (node?.path) navigator.clipboard.writeText(node.path);
                        setContextMenu(null);
                    }}>
                        <Copy className="w-3 h-3" /> Copy Path
                    </button>
                    <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/10" onClick={async () => {
                        const node = fileSystem.findNode(fileSystem.files, contextMenu.nodeId);
                        if (node && node.type === 'file') {
                            const ext = node.name.includes('.') ? '.' + node.name.split('.').pop() : '';
                            const baseName = node.name.replace(ext, '');
                            const parentId = fileSystem.getRootFolderId();
                            await fileSystem.createFile(parentId, `${baseName}_copy${ext}`, node.content || '');
                        }
                        setContextMenu(null);
                    }}>
                        <Files className="w-3 h-3" /> Duplicate
                    </button>
                    <div className="h-px bg-white/10 my-1" />
                    <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-white/10" onClick={() => { fileSystem.deleteNode(contextMenu.nodeId); setContextMenu(null); }}>
                        <Trash2 className="w-3 h-3" /> Delete
                    </button>
                </div>
            )}

            <CommandPalette
                isOpen={showCommandPalette}
                onClose={() => setShowCommandPalette(false)}
                commands={commands}
            />

            {/* Tab Context Menu */}
            {tabContextMenu && (
                <div className="fixed py-1 rounded-lg shadow-2xl z-50 min-w-[160px]" style={{ left: tabContextMenu.x, top: tabContextMenu.y, backgroundColor: theme.sidebar, border: `1px solid ${theme.border}` }} onClick={(e) => e.stopPropagation()}>
                    <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/10" onClick={() => { editorTabs.closeTab(tabContextMenu.tabId); setTabContextMenu(null); }}>
                        <X className="w-3 h-3" /> Close
                    </button>
                    <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/10" onClick={() => {
                        editorTabs.tabs.filter(t => t.id !== tabContextMenu.tabId).forEach(t => editorTabs.closeTab(t.id));
                        setTabContextMenu(null);
                    }}>
                        <XCircle className="w-3 h-3" /> Close Others
                    </button>
                    <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/10" onClick={() => {
                        editorTabs.tabs.forEach(t => editorTabs.closeTab(t.id));
                        setTabContextMenu(null);
                    }}>
                        <X className="w-3 h-3" /> Close All
                    </button>
                </div>
            )}

            {/* New Project Modal */}
            {showNewProjectModal && (
                <NewProjectModal
                    onClose={() => setShowNewProjectModal(false)}
                    onCreate={async (templateId, location) => {
                        const template = projectTemplates.find(t => t.id === templateId);
                        if (!template) return;

                        if (fileSystem.isElectron) {
                            const api = window.electronAPI;
                            // Create directory
                            try {
                                await api.fs.mkdir(location);
                            } catch { /* may already exist */ }

                            // Write template files
                            for (const file of template.files) {
                                await api.fs.writeFile(`${location}/${file.name}`, file.content);
                            }

                            // Set workspace and refresh
                            await api.workspace.set(location);
                            await fileSystem.refreshWorkspace();
                            terminalRef.current?.writeln(`\x1b[32m✓ Project created at ${location}\x1b[0m`);
                        } else {
                            // Virtual filesystem — create files in the root
                            const rootId = fileSystem.getRootFolderId();
                            for (const file of template.files) {
                                await fileSystem.createFile(rootId, file.name, file.content);
                            }
                        }
                    }}
                    onBrowse={async () => {
                        if (fileSystem.isElectron) {
                            const api = window.electronAPI;
                            try {
                                const result = await api.dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] });
                                if (!result.canceled && result.filePaths?.[0]) {
                                    return result.filePaths[0];
                                }
                            } catch (e) {
                                console.error('Browse failed:', e);
                            }
                        }
                        return null;
                    }}
                />
            )}

            {/* Crash Recovery Dialog */}
            {showRecoveryDialog && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="rounded-xl shadow-2xl w-full max-w-md overflow-hidden" style={{ backgroundColor: theme.sidebar, border: `1px solid ${theme.border}` }}>
                        <div className="px-6 py-4" style={{ borderBottom: `1px solid ${theme.border}` }}>
                            <div className="flex items-center gap-2 text-lg font-semibold" style={{ color: theme.warning }}>
                                <AlertTriangle className="w-5 h-5" />
                                Recover Unsaved Work
                            </div>
                        </div>
                        <div className="px-6 py-4" style={{ color: theme.text }}>
                            <p className="text-sm mb-3">
                                We found <strong>{pendingBackups.length}</strong> unsaved file{pendingBackups.length > 1 ? 's' : ''} from a previous session.
                            </p>
                            <div className="rounded-lg p-3 space-y-1" style={{ backgroundColor: `${theme.bg}`, border: `1px solid ${theme.border}` }}>
                                {pendingBackups.map(b => {
                                    const node = fileSystem.findNode(fileSystem.files, b.fileId);
                                    const time = new Date(b.timestamp).toLocaleString();
                                    return (
                                        <div key={b.fileId} className="flex items-center justify-between text-xs" style={{ color: theme.textMuted }}>
                                            <span className="font-medium" style={{ color: theme.text }}>{node?.name || b.fileId}</span>
                                            <span>{time}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 px-6 py-4" style={{ backgroundColor: theme.activityBar, borderTop: `1px solid ${theme.border}` }}>
                            <button
                                onClick={handleRecoveryDiscard}
                                className="px-4 py-2 text-sm rounded-lg hover:bg-white/10 transition-colors"
                                style={{ color: theme.textMuted }}
                            >
                                Discard
                            </button>
                            <button
                                onClick={handleRecoveryRestore}
                                className="px-4 py-2 text-sm rounded-lg font-medium transition-colors"
                                style={{ backgroundColor: `${theme.accent}20`, color: theme.accent }}
                            >
                                Restore Files
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Error highlight styles */}
            <style>{`
        .error-line-highlight { background-color: rgba(239, 68, 68, 0.15) !important; border-left: 3px solid #ef4444 !important; }
        .error-glyph { background-color: #ef4444; border-radius: 50%; width: 8px !important; height: 8px !important; margin-left: 4px; margin-top: 6px; }
        .debug-line-highlight { background-color: rgba(234, 179, 8, 0.15) !important; border-left: 3px solid #eab308 !important; }
        .debug-glyph { background-color: #eab308; border-radius: 50%; width: 8px !important; height: 8px !important; margin-left: 4px; margin-top: 6px; }
      `}</style>
        </div>
    );
}

export default CodeNestStudio;
