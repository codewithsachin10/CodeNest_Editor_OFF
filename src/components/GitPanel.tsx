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
    const [commits, setCommits] = useState<any[]>([]);
    const [commitMessage, setCommitMessage] = useState<string>('');
    const [isGitRepo, setIsGitRepo] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const runGit = async (action: 'init' | 'status' | 'commit' | 'log' | 'restore', args?: string, hash?: string) => {
        try {
            setLoading(true);
            setError('');
            let result;
            if (action === 'init') result = await window.electronAPI.git.init(cwd);
            else if (action === 'status') result = await window.electronAPI.git.status(cwd);
            else if (action === 'commit') result = await window.electronAPI.git.commit(cwd, args!);
            else if (action === 'log') result = await window.electronAPI.git.log(cwd);
            else if (action === 'restore') result = await window.electronAPI.git.restore(cwd, args!);
            return result;
        } catch (e: any) {
            setError(e.message || 'Git command failed');
            return null;
        } finally {
            setLoading(false);
        }
    };

    const loadLog = async () => {
        const out = await runGit('log');
        if (out && out.success) {
            setCommits(out.commits || []);
        }
    };

    const checkStatus = async () => {
        const out = await runGit('status');
        if (out && out.success) {
            const files = out.files || [];
            if (files.length === 0) {
                setStatusText('Clean working tree.');
            } else {
                setStatusText(files.map((f: any) => `${f.status}  ${f.filePath}`).join('\n'));
            }
            setIsGitRepo(true);
            loadLog();
        } else if (out && out.error && out.error.includes('not a git repository')) {
            setIsGitRepo(false);
            setStatusText('');
        } else {
            setIsGitRepo(false);
            setError(out?.error || 'Failed to get status');
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
        await runGit('commit', commitMessage.trim());
        setCommitMessage('');
        await checkStatus();
    };

    const handleRestore = async (hash: string) => {
        if (confirm(`Are you sure you want to restore to commit ${hash.substring(0, 7)}? This will replace your working tree.`)) {
            await runGit('restore', hash);
            await checkStatus();
            alert('Working tree restored!');
        }
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
                            <h3 className="text-xs font-semibold uppercase tracking-wider opacity-70">Changes</h3>
                            <button onClick={checkStatus} disabled={loading} className="p-1 hover:bg-white/10 rounded-md transition-colors" title="Refresh Status">
                                <RotateCcw className={cn("w-3 h-3", mutedColor, loading && "animate-spin")} />
                            </button>
                        </div>
                        <div className={cn(
                            "w-full max-h-[120px] overflow-y-auto text-[11px] font-mono p-3 rounded-xl border whitespace-pre-wrap leading-relaxed",
                            inputBg, inputBorder, mutedColor
                        )}>
                            {error ? <span className="text-red-400">{error}</span> : statusText || 'Clean working tree.'}
                        </div>
                    </div>

                    {/* Commit History */}
                    <div className="flex flex-col gap-2 mt-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">Recent Commits</h3>
                        {commits.length === 0 ? (
                            <div className={cn("text-[11px] p-3 rounded-xl border", inputBg, inputBorder, mutedColor)}>
                                No commits yet.
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {commits.slice(0, 5).map((commit, i) => (
                                    <div key={commit.hash || i} className={cn("flex flex-col gap-1 p-3 rounded-xl border text-[11px]", inputBg, inputBorder)}>
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-sky-400 truncate max-w-[120px] inline-block">{commit.message}</span>
                                            <span className="opacity-50 text-[10px] shrink-0 ml-2">{commit.date}</span>
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="font-mono opacity-50 text-[10px]">{commit.hash.substring(0,7)} by {commit.author}</span>
                                            <button 
                                                onClick={() => handleRestore(commit.hash)}
                                                className="text-[10px] bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-2 py-0.5 rounded transition-colors"
                                            >
                                                Restore
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
