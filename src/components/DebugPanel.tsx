
import { Play, SkipForward, ArrowRight, Square, Activity, Database } from 'lucide-react';

export interface DebugVariable {
    name: string;
    value: string;
    type: string;
}

interface DebugPanelProps {
    status: 'idle' | 'running' | 'paused' | 'stopped';
    variables: DebugVariable[];
    currentLine: number | null;
    onContinue: () => void;
    onStepOver: () => void;
    onStepInto: () => void;
    onStop: () => void;
}

export function DebugPanel({ status, variables, currentLine, onContinue, onStepOver, onStepInto, onStop }: DebugPanelProps) {
    return (
        <div className="flex flex-col h-full bg-[var(--sidebar)] border-l border-[var(--border)] text-[var(--foreground)]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[var(--activity-bar)] border-b border-[var(--border)]">
                <span className="text-xs font-semibold tracking-wider flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-orange-400" /> DEBUGGING
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${status === 'paused' ? 'bg-orange-500/20 text-orange-400' :
                    status === 'running' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/50'
                    }`}>
                    {status.toUpperCase()}
                </span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-1 p-2 bg-[var(--background)] border-b border-[var(--border)]">
                <button
                    onClick={onContinue}
                    disabled={status === 'idle'}
                    className="p-1.5 rounded hover:bg-white/10 text-green-400 disabled:opacity-30"
                    title="Continue (F5)"
                >
                    <Play className="w-4 h-4 fill-current" />
                </button>
                <button
                    onClick={onStepOver}
                    disabled={status !== 'paused'}
                    className="p-1.5 rounded hover:bg-white/10 text-blue-400 disabled:opacity-30"
                    title="Step Over (F10)"
                >
                    <SkipForward className="w-4 h-4" />
                </button>
                <button
                    onClick={onStepInto}
                    disabled={status !== 'paused'}
                    className="p-1.5 rounded hover:bg-white/10 text-sky-400 disabled:opacity-30"
                    title="Step Into (F11)"
                >
                    <ArrowRight className="w-4 h-4" />
                </button>
                <button
                    onClick={onStop}
                    disabled={status === 'idle'}
                    className="p-1.5 rounded hover:bg-white/10 text-red-400 disabled:opacity-30"
                    title="Stop (Shift+F5)"
                >
                    <Square className="w-4 h-4 fill-current" />
                </button>
            </div>

            {/* Variables */}
            <div className="flex-1 overflow-auto bg-[var(--sidebar)]">
                <div className="px-3 py-2 text-[10px] uppercase font-bold text-white/40 border-b border-[var(--border)] bg-[var(--activity-bar)] flex items-center gap-2">
                    <Database className="w-3 h-3" /> Variables
                </div>
                {variables.length > 0 ? (
                    <div className="divide-y divide-white/5">
                        {variables.map((v, i) => (
                            <div key={i} className="px-3 py-2 hover:bg-white/5 group">
                                <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-xs font-mono text-blue-300">{v.name}</span>
                                    <span className="text-[10px] text-white/30">{v.type}</span>
                                </div>
                                <div className="text-xs font-mono text-orange-200 truncate break-all group-hover:whitespace-normal group-hover:break-words">
                                    {v.value}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-4 text-center text-xs text-white/30 italic">
                        {status === 'idle' ? 'Start debugging to inspect.' : 'No local variables.'}
                    </div>
                )}
            </div>

            {/* Current Line Indicator */}
            {currentLine && (
                <div className="p-2 border-t border-[var(--border)] bg-[var(--background)]">
                    <div className="text-[10px] text-white/40 mb-1">Paused at line</div>
                    <div className="text-sm font-mono text-yellow-400 flex items-center justify-between">
                        L{currentLine}
                        <span className="animate-pulse w-2 h-2 rounded-full bg-yellow-500"></span>
                    </div>
                </div>
            )}
        </div>
    );
}
