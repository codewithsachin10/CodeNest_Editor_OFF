import React, { useState, useEffect } from 'react';
import { GitBranch, Plus, Check, RotateCcw, Box, CheckCircle2, AlertCircle, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettings } from '@/settings/SettingsContext';

interface GitPanelProps {
    cwd: string;
}

export function GitPanel({ cwd }: GitPanelProps) {
    const { settings } = useSettings();
    const isDarkTheme = settings.appearance.theme === 'dark';
    
    const [statusText, setStatusText] = useState<string>('');
    const [commitMessage, setCommitMessage] = useState<string>('');
    const [isGitRepo, setIsGitRepo] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const runGit = async (args: string) => {
        try {
            setLoading(true);
            setError('');
            const result = await (window as any).electronAPI.terminal.execute(`git ${args}`, cwd, {
                env: settings.advanced.customEnvVars
            });
            return result.output;
        } catch (e: any) {
            setError(e.message || 'Git command failed');
            return null;
        } finally {
            setLoading(false);
        }
    };

    const checkStatus = async () => {
        const out = await runGit('status');
        if (out !== null) {
            setStatusText(out);
            setIsGitRepo(!out.includes('not a git repository'));
        } else {
            setIsGitRepo(false);
        }
    };

    useEffect(() => {
        if (cwd) {
            checkStatus();
        }
    }, [cwd]);

    const handleInit = async () => {
        await runGit('init');
        await checkStatus();
    };

    const handleCommit = async () => {
        if (!commitMessage.trim()) return;
        await runGit('add .');
        await runGit(`commit -m "${commitMessage.replace(/"/g, '\\"')}"`);
        setCommitMessage('');
        await checkStatus();
    };

    const inputBg = isDarkTheme ? 'bg-[#0F172A]' : 'bg-slate-50';
    const inputBorder = isDarkTheme ? 'border-[#1E293B]' : 'border-slate-200';
    const textColor = isDarkTheme ? 'text-[#E5E7EB]' : 'text-slate-800';
    const mutedColor = isDarkTheme ? 'text-[#9CA3AF]' : 'text-slate-500';

    return (
        <div className={cn("flex flex-col h-full w-full p-4 overflow-y-auto", textColor)}>
            <div className="flex items-center gap-2 mb-6">
                <GitBranch className="w-5 h-5 text-sky-400" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-sky-400">Version Control</h2>
            </div>

            {!isGitRepo ? (
                <div className="flex flex-col items-center justify-center flex-1 text-center opacity-80 mt-10">
                    <Box className={cn("w-12 h-12 mb-4", mutedColor)} />
                    <h3 className="text-sm font-medium mb-2">No Git Repository</h3>
                    <p className={cn("text-xs mb-6 max-w-[200px]", mutedColor)}>
                        The current folder is not a Git repository. Initialize one to start tracking changes.
                    </p>
                    <button
                        onClick={handleInit}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Initialize Repository
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {/* Commit Box */}
                    <div className="flex flex-col gap-2">
                        <textarea
                            value={commitMessage}
                            onChange={(e) => setCommitMessage(e.target.value)}
                            placeholder="Commit message..."
                            className={cn(
                                "w-full min-h-[80px] text-xs p-3 rounded-xl border focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 transition-all resize-none",
                                inputBg, inputBorder, textColor
                            )}
                        />
                        <button
                            onClick={handleCommit}
                            disabled={loading || !commitMessage.trim()}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-500/50 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-colors w-full"
                        >
                            <Check className="w-4 h-4" />
                            Commit All Changes
                        </button>
                    </div>

                    {/* Status Output */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-semibold uppercase tracking-wider opacity-70">Status</h3>
                            <button onClick={checkStatus} disabled={loading} className="p-1 hover:bg-white/10 rounded-md transition-colors" title="Refresh Status">
                                <RotateCcw className={cn("w-3 h-3", mutedColor, loading && "animate-spin")} />
                            </button>
                        </div>
                        <div className={cn(
                            "w-full h-[200px] overflow-y-auto text-[11px] font-mono p-3 rounded-xl border whitespace-pre-wrap leading-relaxed",
                            inputBg, inputBorder, mutedColor
                        )}>
                            {error ? <span className="text-red-400">{error}</span> : statusText || 'Clean working tree.'}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
