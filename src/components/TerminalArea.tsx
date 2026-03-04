import React from 'react';
import { Terminal, GripHorizontal, Minimize2, Trash2, Maximize2, Square, Play, AlertTriangle } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';
import { XTerminal, XTerminalHandle } from './XTerminal';
import type { ShellColors } from '../themes/themeTypes';
import type { CodeNestSettings } from '../settings/settingsTypes';
import type { ParsedError } from '../utils/errorFormatter';

interface TerminalAreaProps {
    isTerminalFloating: boolean;
    setIsTerminalFloating: (isFloating: boolean) => void;
    terminalPosition: { x: number; y: number };
    setTerminalPosition: (pos: { x: number; y: number }) => void;
    terminalSize: { width: number; height: number };
    setTerminalSize: (size: { width: number; height: number }) => void;
    terminalHeight: number;
    theme: ShellColors;
    handleMouseDown: (e: React.MouseEvent, type: 'terminal') => void;
    executionState: 'idle' | 'running' | 'finished' | 'stopped' | 'error';
    getStatusDisplay: () => React.ReactNode;
    handleStop: () => void;
    handleRun: () => void;
    terminalRef: React.RefObject<XTerminalHandle | null>;
    beginnerMode: boolean;
    currentError: ParsedError | null;
    highlightErrorLine: (line: number, col?: number | null) => void;
    settings: CodeNestSettings;
    isDarkTheme: boolean;
    handleTerminalData: (data: string) => void;
}

export function TerminalArea({
    isTerminalFloating,
    setIsTerminalFloating,
    terminalPosition,
    setTerminalPosition,
    terminalSize,
    setTerminalSize,
    terminalHeight,
    theme,
    handleMouseDown,
    executionState,
    getStatusDisplay,
    handleStop,
    handleRun,
    terminalRef,
    beginnerMode,
    currentError,
    highlightErrorLine,
    settings,
    isDarkTheme,
    handleTerminalData
}: TerminalAreaProps) {
    if (isTerminalFloating) {
        return (
            <div
                className="fixed z-50 rounded-lg shadow-2xl overflow-hidden flex flex-col border"
                style={{
                    left: terminalPosition.x,
                    top: terminalPosition.y,
                    width: terminalSize.width,
                    height: terminalSize.height,
                    backgroundColor: theme.terminal,
                    borderColor: theme.border,
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                }}
            >
                {/* Floating Header */}
                <div
                    className="flex items-center justify-between px-3 py-1.5 cursor-move bg-[var(--sidebar)] border-b border-[var(--border)]"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        const startX = e.clientX - terminalPosition.x;
                        const startY = e.clientY - terminalPosition.y;

                        const handleMouseMove = (mv: MouseEvent) => {
                            setTerminalPosition({
                                x: mv.clientX - startX,
                                y: mv.clientY - startY
                            });
                        };
                        const handleMouseUp = () => {
                            window.removeEventListener('mousemove', handleMouseMove);
                            window.removeEventListener('mouseup', handleMouseUp);
                        };
                        window.addEventListener('mousemove', handleMouseMove);
                        window.addEventListener('mouseup', handleMouseUp);
                    }}
                >
                    <div className="flex items-center gap-2">
                        <GripHorizontal className="w-4 h-4 text-white/20" />
                        <div className="flex items-center gap-2">
                            <Terminal className="w-3.5 h-3.5 opacity-60" />
                            <span className="text-xs font-medium opacity-80">TERMINAL</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setIsTerminalFloating(false)} className="p-1 rounded hover:bg-white/10" title="Dock Terminal">
                            <Minimize2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => terminalRef.current?.clear()} className="p-1 rounded hover:bg-white/10 opacity-60 hover:opacity-100">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden relative">
                    <ErrorBoundary name="Terminal">
                        <XTerminal
                            ref={terminalRef}
                            fontSize={settings.terminal.fontSize}
                            fontFamily={settings.terminal.fontFamily}
                            cursorStyle={settings.terminal.cursorStyle === 'line' ? 'bar' : settings.terminal.cursorStyle}
                            cursorBlink={settings.terminal.cursorBlink}
                            scrollback={settings.terminal.scrollbackLines}
                            isDarkTheme={isDarkTheme}
                            onData={handleTerminalData}
                        />
                    </ErrorBoundary>
                </div>

                {/* Resize Handle for Floating */}
                <div
                    className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-center justify-center opacity-50 hover:opacity-100"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const startX = e.clientX;
                        const startY = e.clientY;
                        const startWidth = terminalSize.width;
                        const startHeight = terminalSize.height;

                        const handleResizeMove = (mv: MouseEvent) => {
                            setTerminalSize({
                                width: Math.max(300, startWidth + (mv.clientX - startX)),
                                height: Math.max(200, startHeight + (mv.clientY - startY))
                            });
                        };
                        const handleResizeUp = () => {
                            window.removeEventListener('mousemove', handleResizeMove);
                            window.removeEventListener('mouseup', handleResizeUp);
                        };
                        window.addEventListener('mousemove', handleResizeMove);
                        window.addEventListener('mouseup', handleResizeUp);
                    }}
                >
                    <div className="w-2 h-2 border-r-2 border-b-2 border-white/30" />
                </div>
            </div>
        );
    }

    // DOCKED TERMINAL
    return (
        <div
            className="shrink-0 flex flex-col relative"
            style={{ height: terminalHeight, borderTop: `1px solid ${theme.border}` }}
        >
            {/* Resizer Handle (Top) */}
            <div
                className="absolute left-0 top-0 right-0 h-1 cursor-row-resize hover:bg-blue-500/50 z-20 -mt-0.5"
                onMouseDown={(e) => handleMouseDown(e, 'terminal')}
            />

            <div className="flex items-center justify-between px-3 py-1.5" style={{ backgroundColor: theme.terminal, borderBottom: `1px solid ${theme.border}` }}>
                <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 opacity-60" />
                    <span className="text-xs font-medium opacity-80">TERMINAL</span>
                    {executionState === 'running' && (
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                        </span>
                    )}
                    <span className="text-[10px] opacity-50 flex items-center gap-1">{getStatusDisplay()}</span>
                </div>
                <div className="flex items-center gap-1">
                    {executionState === 'running' ? (
                        <button onClick={handleStop} className="flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-red-500/20 text-red-400 hover:bg-red-500/30">
                            <Square className="w-3 h-3 fill-current" /> Stop
                        </button>
                    ) : (
                        <button onClick={handleRun} className="flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-green-500/20 text-green-400 hover:bg-green-500/30">
                            <Play className="w-3 h-3 fill-current" /> Run
                        </button>
                    )}
                    <button onClick={() => setIsTerminalFloating(true)} className="p-1 rounded hover:bg-white/10" title="Pop Out Terminal">
                        <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => terminalRef.current?.clear()} className="p-1 rounded hover:bg-white/10 opacity-60 hover:opacity-100">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Friendly Error Display (Beginner Mode) */}
            {beginnerMode && currentError && (
                <div className="px-3 py-2 bg-red-500/10 border-b border-red-500/30">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm text-red-400 font-medium">{currentError.friendlyMessage}</p>
                            {currentError.lineNumber && (
                                <button onClick={() => highlightErrorLine(currentError.lineNumber!, currentError.columnNumber)} className="text-xs text-red-300/70 hover:text-red-300 underline mt-1">
                                    → Go to line {currentError.lineNumber}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-hidden">
                <ErrorBoundary name="Terminal">
                    <XTerminal
                        ref={terminalRef}
                        fontSize={settings.terminal.fontSize}
                        fontFamily={settings.terminal.fontFamily}
                        cursorStyle={settings.terminal.cursorStyle === 'line' ? 'bar' : settings.terminal.cursorStyle}
                        cursorBlink={settings.terminal.cursorBlink}
                        scrollback={settings.terminal.scrollbackLines}
                        isDarkTheme={isDarkTheme}
                        onData={handleTerminalData}
                    />
                </ErrorBoundary>
            </div>
        </div>
    );
}
