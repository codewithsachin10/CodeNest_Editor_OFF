import { useState, useMemo } from 'react';
import { Search, Code2, ChevronRight, ChevronDown, Copy, FileCode } from 'lucide-react';
import {
    getSnippetLanguages,
    getSnippetsGrouped,
    searchSnippets,
    type CodeSnippet,
} from '../utils/snippetLibrary';
import { getLangIconUrl } from '../utils/languageIcons';
import { cn } from '@/lib/utils';

interface SnippetPanelProps {
    isDarkTheme: boolean;
    currentLanguage?: string;
    onInsert: (code: string) => void;
}

const languageLabels: Record<string, string> = {
    python: 'Python',
    c: 'C',
    cpp: 'C++',
    java: 'Java',
    javascript: 'JS',
};

export function SnippetPanel({ isDarkTheme, currentLanguage, onInsert }: SnippetPanelProps) {
    const languages = getSnippetLanguages();
    const [selectedLang, setSelectedLang] = useState<string>(currentLanguage || languages[0] || 'python');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Hello World', 'Input / Output']));
    const [previewSnippet, setPreviewSnippet] = useState<CodeSnippet | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Filter snippets
    const grouped = useMemo(() => {
        if (searchQuery.trim()) {
            const results = searchSnippets(searchQuery, selectedLang);
            const g: Record<string, CodeSnippet[]> = {};
            for (const s of results) {
                if (!g[s.category]) g[s.category] = [];
                g[s.category].push(s);
            }
            return g;
        }
        return getSnippetsGrouped(selectedLang);
    }, [selectedLang, searchQuery]);

    const toggleCategory = (cat: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(cat)) next.delete(cat);
            else next.add(cat);
            return next;
        });
    };

    const handleInsert = (snippet: CodeSnippet) => {
        onInsert(snippet.code);
        setCopiedId(snippet.id);
        setTimeout(() => setCopiedId(null), 1500);
    };

    const textColor = isDarkTheme ? 'text-[#E5E7EB]' : 'text-slate-800';
    const mutedColor = isDarkTheme ? 'text-[#9CA3AF]' : 'text-slate-500';

    return (
        <div className={cn("flex flex-col h-full w-full p-4 overflow-y-auto", textColor)}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-4 shrink-0">
                <Code2 className="w-5 h-5 text-sky-400" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-sky-400">Snippets</h2>
            </div>

            {/* Language Tabs */}
            <div className="flex items-center gap-1 mb-4 overflow-x-auto shrink-0 pb-1 scrollbar-hide">
                {languages.map(lang => {
                    const label = languageLabels[lang] || lang;
                    const iconUrl = getLangIconUrl(lang);
                    const isActive = lang === selectedLang;
                    
                    return (
                        <button
                            key={lang}
                            onClick={() => { setSelectedLang(lang); setSearchQuery(''); }}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border",
                                isActive 
                                    ? "bg-sky-500/10 border-sky-500/30 text-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.1)]" 
                                    : "border-transparent text-slate-500 hover:bg-white/5 hover:text-slate-300"
                            )}
                        >
                            <img src={iconUrl} alt="" className="w-4 h-4 rounded-sm drop-shadow-md" draggable={false} />
                            {label}
                        </button>
                    );
                })}
            </div>

            {/* Search */}
            <div className="relative mb-4 shrink-0">
                <Search className={cn("w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2", mutedColor)} />
                <input
                    type="text"
                    placeholder="Search templates..."
                    className={cn(
                        "w-full text-xs py-2 pl-9 pr-3 rounded-lg border focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 transition-all",
                        isDarkTheme ? "bg-[#0F172A] border-[#1E293B] text-white" : "bg-slate-50 border-slate-200 text-slate-800",
                        "placeholder:opacity-50"
                    )}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Snippet List */}
            <div className="flex-1 overflow-auto pr-1">
                {Object.keys(grouped).length === 0 ? (
                    <div className={cn("text-center py-10 text-xs", mutedColor)}>
                        No snippets found
                    </div>
                ) : (
                    <div className="space-y-3">
                        {Object.entries(grouped).map(([category, snippets]) => {
                            const isExpanded = expandedCategories.has(category) || searchQuery.trim().length > 0;
                            return (
                                <div key={category} className="rounded-xl border border-white/5 overflow-hidden">
                                    <button
                                        onClick={() => toggleCategory(category)}
                                        className={cn(
                                            "w-full flex items-center gap-2 px-3 py-2 text-xs font-bold transition-colors",
                                            isDarkTheme ? "bg-white/[0.03] hover:bg-white/[0.06] text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                        )}
                                    >
                                        {isExpanded
                                            ? <ChevronDown className="w-3.5 h-3.5 text-sky-400" />
                                            : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                                        }
                                        {category}
                                        <span className={cn("ml-auto text-[10px] px-1.5 rounded-md", isDarkTheme ? "bg-black/50" : "bg-white")}>{snippets.length}</span>
                                    </button>

                                    {isExpanded && (
                                        <div className={cn("p-1.5 space-y-1", isDarkTheme ? "bg-black/20" : "bg-white")}>
                                            {snippets.map(snippet => (
                                                <div
                                                    key={snippet.id}
                                                    className={cn(
                                                        "group flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all border border-transparent",
                                                        previewSnippet?.id === snippet.id
                                                            ? (isDarkTheme ? "bg-sky-500/10 border-sky-500/20" : "bg-sky-50 border-sky-200")
                                                            : (isDarkTheme ? "hover:bg-white/[0.04]" : "hover:bg-slate-50")
                                                    )}
                                                    onClick={() => setPreviewSnippet(previewSnippet?.id === snippet.id ? null : snippet)}
                                                >
                                                    <FileCode className={cn("w-4 h-4 shrink-0 transition-colors", previewSnippet?.id === snippet.id ? "text-sky-400" : "text-slate-500")} />
                                                    <div className="flex-1 min-w-0">
                                                        <div className={cn("text-xs font-semibold truncate", isDarkTheme ? "text-slate-200" : "text-slate-800")}>
                                                            {snippet.title}
                                                        </div>
                                                        <div className={cn("text-[10px] mt-0.5 truncate", mutedColor)}>
                                                            {snippet.description}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleInsert(snippet); }}
                                                        className={cn(
                                                            "opacity-0 group-hover:opacity-100 p-1.5 rounded-md transition-all shrink-0",
                                                            copiedId === snippet.id
                                                                ? "bg-green-500/20 text-green-400"
                                                                : "bg-sky-500/10 text-sky-400 hover:bg-sky-500/20"
                                                        )}
                                                        title="Insert into editor"
                                                    >
                                                        {copiedId === snippet.id
                                                            ? <span className="text-[10px] font-bold block w-3.5 text-center">✓</span>
                                                            : <Copy className="w-3.5 h-3.5" />
                                                        }
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Preview Section */}
            {previewSnippet && (
                <div className={cn("mt-4 shrink-0 rounded-xl border overflow-hidden flex flex-col", isDarkTheme ? "bg-[#0B1120] border-[#1E293B]" : "bg-white border-slate-200")}>
                    <div className={cn("flex items-center justify-between px-3 py-2 border-b", isDarkTheme ? "bg-[#0F172A] border-[#1E293B]" : "bg-slate-50 border-slate-200")}>
                        <span className={cn("text-xs font-bold", isDarkTheme ? "text-sky-300" : "text-sky-600")}>
                            {previewSnippet.title}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleInsert(previewSnippet)}
                                className="flex items-center gap-1.5 px-3 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 rounded-md text-[10px] font-bold transition-colors"
                            >
                                <Copy className="w-3 h-3" />
                                Insert
                            </button>
                            <button
                                onClick={() => setPreviewSnippet(null)}
                                className={cn("p-1 rounded-md transition-colors", isDarkTheme ? "hover:bg-white/10 text-slate-400" : "hover:bg-black/5 text-slate-500")}
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                    <pre className="overflow-y-auto text-xs p-3 font-mono leading-relaxed max-h-[160px] scrollbar-thin scrollbar-thumb-sky-500/20">
                        <code>{previewSnippet.code}</code>
                    </pre>
                </div>
            )}
        </div>
    );
}
