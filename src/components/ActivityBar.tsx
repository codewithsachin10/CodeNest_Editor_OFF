import React from 'react';
import { Folder, Bug, GraduationCap, GitBranch } from 'lucide-react';
import type { ShellColors } from '../themes/themeTypes';

interface ActivityBarProps {
    theme: ShellColors;
    sidebarVisible: boolean;
    activeSidebarView: 'explorer' | 'debug' | 'snippets' | 'git';
    setActiveSidebarView: (view: 'explorer' | 'debug' | 'snippets' | 'git') => void;
}

export function ActivityBar({ theme, sidebarVisible, activeSidebarView, setActiveSidebarView }: ActivityBarProps) {
    if (!sidebarVisible) return null;

    return (
        <div className="w-[48px] flex flex-col items-center py-2 gap-4 shrink-0 transition-all z-10" style={{ backgroundColor: theme.activityBar, borderRight: `1px solid ${theme.border}` }}>
            <button
                onClick={() => setActiveSidebarView('explorer')}
                className={`p-2.5 rounded-lg transition-all ${activeSidebarView === 'explorer' ? 'bg-sky-400/10 text-sky-400' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                title="Explorer (Cmd+Shift+E)"
                aria-label="Explorer"
            >
                <Folder className="w-5 h-5" />
            </button>
            <button
                onClick={() => setActiveSidebarView('debug')}
                className={`p-2.5 rounded-lg transition-all ${activeSidebarView === 'debug' ? 'bg-sky-400/10 text-sky-400' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                title="Debug (Cmd+Shift+D)"
                aria-label="Debug"
            >
                <Bug className="w-5 h-5" />
            </button>
            <button
                onClick={() => setActiveSidebarView('snippets')}
                className={`p-2.5 rounded-lg transition-all ${activeSidebarView === 'snippets' ? 'bg-sky-400/10 text-sky-400' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                title="Code Snippets"
                aria-label="Code Snippets"
            >
                <GraduationCap className="w-5 h-5" />
            </button>
            <button
                onClick={() => setActiveSidebarView('git')}
                className={`p-2.5 rounded-lg transition-all ${activeSidebarView === 'git' ? 'bg-sky-400/10 text-sky-400' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                title="Version Control"
                aria-label="Version Control"
            >
                <GitBranch className="w-5 h-5" />
            </button>
        </div>
    );
}
