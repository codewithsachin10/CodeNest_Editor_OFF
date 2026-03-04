import { useState, useMemo } from 'react';
import { Search, Code2, ChevronRight, ChevronDown, Copy, FileCode } from 'lucide-react';
import {
    getSnippetLanguages,
    getSnippetsGrouped,
    searchSnippets,
    type CodeSnippet,
} from '../utils/snippetLibrary';
import { getLangIconUrl, defaultFileIcon } from '../utils/languageIcons';

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
    javascript: 'JavaScript',
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

    const accent = isDarkTheme ? '#38BDF8' : '#0284C7';
    const bg = isDarkTheme ? '#111827' : '#F1F5F9';
    const textMuted = isDarkTheme ? '#9CA3AF' : '#64748B';
    const border = isDarkTheme ? '#1E293B' : '#E2E8F0';

    return (
        <div className="flex flex-col h-full" style={{ backgroundColor: bg }}>
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 text-xs font-bold tracking-wider" style={{ color: textMuted }}>
                <span className="flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5" />
                    SNIPPETS
                </span>
            </div>

            {/* Language Tabs */}
            <div className="flex items-center gap-1 px-2 pb-2 overflow-x-auto">
                {languages.map(lang => {
                    const label = languageLabels[lang] || lang;
                    const iconUrl = getLangIconUrl(lang);
                    const isActive = lang === selectedLang;
                    return (
                        <button
                            key={lang}
                            onClick={() => { setSelectedLang(lang); setSearchQuery(''); }}
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-colors"
                            style={{
                                backgroundColor: isActive ? `${accent}15` : 'transparent',
                                color: isActive ? accent : textMuted,
                                border: `1px solid ${isActive ? `${accent}40` : 'transparent'}`,
                            }}
                        >
                            <img src={iconUrl} alt="" width={12} height={12} className="shrink-0" draggable={false} />
                            {label}
                        </button>
                    );
                })}
            </div>

            {/* Search */}
            <div className="px-2 pb-2">
                <div className="flex items-center gap-1.5 rounded-md px-2 py-1.5" style={{ backgroundColor: isDarkTheme ? '#0F172A' : '#E2E8F0' }}>
                    <Search className="w-3 h-3" style={{ color: textMuted }} />
                    <input
                        type="text"
                        placeholder="Search snippets..."
                        className="flex-1 bg-transparent text-xs outline-none"
                        style={{ color: isDarkTheme ? '#E5E7EB' : '#1E293B' }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Snippet List */}
            <div className="flex-1 overflow-auto px-1">
                {Object.keys(grouped).length === 0 && (
                    <div className="text-center py-8 text-xs" style={{ color: textMuted }}>
                        No snippets found
                    </div>
                )}
                {Object.entries(grouped).map(([category, snippets]) => {
                    const isExpanded = expandedCategories.has(category) || searchQuery.trim().length > 0;
                    return (
                        <div key={category} className="mb-1">
                            <button
                                onClick={() => toggleCategory(category)}
                                className="w-full flex items-center gap-1 px-2 py-1.5 text-[11px] font-semibold rounded hover:bg-white/5 transition-colors"
                                style={{ color: isDarkTheme ? '#CBD5E1' : '#475569' }}
                            >
                                {isExpanded
                                    ? <ChevronDown className="w-3 h-3 opacity-50" />
                                    : <ChevronRight className="w-3 h-3 opacity-50" />
                                }
                                {category}
                                <span className="ml-auto text-[9px] opacity-40">{snippets.length}</span>
                            </button>

                            {isExpanded && (
                                <div className="ml-2 space-y-0.5">
                                    {snippets.map(snippet => (
                                        <div
                                            key={snippet.id}
                                            className="group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors hover:bg-white/5"
                                            onClick={() => setPreviewSnippet(previewSnippet?.id === snippet.id ? null : snippet)}
                                        >
                                            <FileCode className="w-3 h-3 shrink-0" style={{ color: accent }} />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[11px] font-medium truncate" style={{ color: isDarkTheme ? '#E5E7EB' : '#1E293B' }}>
                                                    {snippet.title}
                                                </div>
                                                <div className="text-[9px] truncate" style={{ color: textMuted }}>
                                                    {snippet.description}
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleInsert(snippet); }}
                                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 transition-all shrink-0"
                                                title="Insert into editor"
                                                style={{ color: copiedId === snippet.id ? '#22C55E' : accent }}
                                            >
                                                {copiedId === snippet.id
                                                    ? <span className="text-[9px] font-bold">✓</span>
                                                    : <Copy className="w-3 h-3" />
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

            {/* Preview */}
            {previewSnippet && (
                <div className="border-t" style={{ borderColor: border, maxHeight: '40%' }}>
                    <div className="flex items-center justify-between px-3 py-1.5" style={{ backgroundColor: isDarkTheme ? '#0F172A' : '#E2E8F0' }}>
                        <span className="text-[10px] font-semibold" style={{ color: isDarkTheme ? '#CBD5E1' : '#475569' }}>
                            {previewSnippet.title}
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => handleInsert(previewSnippet)}
                                className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors"
                                style={{ backgroundColor: `${accent}20`, color: accent }}
                            >
                                <Copy className="w-2.5 h-2.5" />
                                Insert
                            </button>
                            <button
                                onClick={() => setPreviewSnippet(null)}
                                className="p-0.5 rounded hover:bg-white/10 text-[10px]"
                                style={{ color: textMuted }}
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                    <pre className="overflow-auto text-[10px] p-2 leading-relaxed" style={{
                        color: isDarkTheme ? '#E5E7EB' : '#1E293B',
                        backgroundColor: isDarkTheme ? '#0B1120' : '#F8FAFC',
                        maxHeight: '150px',
                    }}>
                        <code>{previewSnippet.code}</code>
                    </pre>
                </div>
            )}
        </div>
    );
}
