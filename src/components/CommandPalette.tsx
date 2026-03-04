
import { useState, useEffect, useRef } from 'react';
import { Search, Play, FolderPlus, FilePlus, Settings, Command } from 'lucide-react';

export interface CommandPaletteItem {
    id: string;
    name: string;
    shortcut?: string;
    icon: any;
    action: () => void | Promise<void>;
}

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    commands: CommandPaletteItem[];
}

export function CommandPalette({ isOpen, onClose, commands }: CommandPaletteProps) {
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const filtered = commands.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase())
    );

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            setQuery('');
            setActiveIndex(0);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex(prev => Math.min(prev + 1, filtered.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filtered[activeIndex]) {
                    filtered[activeIndex].action();
                    onClose();
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filtered, activeIndex, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[1px] z-[200] flex items-start justify-center pt-[20vh]" onClick={onClose}>
            <div
                className="w-[600px] max-w-[90vw] flex flex-col rounded-lg shadow-2xl overflow-hidden border border-white/10 bg-[#1e1e2e] text-white"
                onClick={e => e.stopPropagation()}
                style={{ top: '20vh' }}
            >
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
                    <Search className="w-4 h-4 text-white/40" />
                    <input
                        ref={inputRef}
                        type="text"
                        className="flex-1 bg-transparent outline-none placeholder:text-white/30 text-sm"
                        placeholder="Type a command..."
                        value={query}
                        onChange={e => {
                            setQuery(e.target.value);
                            setActiveIndex(0);
                        }}
                    />
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/50">Esc</span>
                    </div>
                </div>

                {/* Results List */}
                <div className="max-h-[300px] overflow-auto py-1">
                    {filtered.length > 0 ? (
                        filtered.map((item, index) => (
                            <div
                                key={item.id}
                                className={`flex items-center gap-3 px-4 py-2 text-sm cursor-pointer transition-colors ${index === activeIndex ? 'bg-blue-500/20 text-blue-100' : 'hover:bg-white/5 text-gray-300'
                                    }`}
                                onClick={() => {
                                    item.action();
                                    onClose();
                                }}
                                onMouseEnter={() => setActiveIndex(index)}
                            >
                                <div className={`p-1 rounded ${index === activeIndex ? 'bg-blue-500/30' : 'bg-white/5'}`}>
                                    <item.icon className="w-3.5 h-3.5" />
                                </div>
                                <span className="flex-1">{item.name}</span>
                                {item.shortcut && (
                                    <span className="text-[10px] opacity-50 font-mono tracking-wider">{item.shortcut}</span>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="px-4 py-8 text-center text-sm text-white/30">
                            No commands found.
                        </div>
                    )}
                </div>

                {/* Footer Hint */}
                <div className="px-3 py-1.5 bg-[#181825] border-t border-white/5 flex justify-end">
                    <div className="flex items-center gap-4 text-[10px] text-white/30">
                        <span className="flex items-center gap-1"><span className="bg-white/10 px-1 rounded">↑</span><span className="bg-white/10 px-1 rounded">↓</span> Navigate</span>
                        <span className="flex items-center gap-1"><span className="bg-white/10 px-1 rounded">↵</span> Select</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
