import React, { useState, useEffect, useRef } from 'react';
import { File, Search } from 'lucide-react';
import { FileNode } from '../hooks/useFileSystem';

interface FileSwitcherProps {
    isOpen: boolean;
    onClose: () => void;
    files: FileNode[];
    onSelect: (file: FileNode) => void;
}

export function FileSwitcher({ isOpen, onClose, files, onSelect }: FileSwitcherProps) {
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Flatten files tree safely
    const flattenFiles = (nodes: FileNode[], result: FileNode[] = []) => {
        for (const node of nodes) {
            if (node.type === 'file') {
                result.push(node);
            } else if (node.type === 'folder' && node.children) {
                flattenFiles(node.children, result);
            }
        }
        return result;
    };

    const allFiles = flattenFiles(files);
    
    const filtered = allFiles.filter(f => 
        (f.path || f.name).toLowerCase().includes(query.toLowerCase())
    ).slice(0, 15);

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
                    onSelect(filtered[activeIndex]);
                    onClose();
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filtered, activeIndex, onClose, onSelect]);

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
                        placeholder="Search files by name... (Ctrl+P)"
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
                        filtered.map((file, index) => (
                            <div 
                                key={file.id} 
                                className={`flex items-center gap-3 px-4 py-2 text-sm cursor-pointer transition-colors ${
                                    index === activeIndex ? 'bg-blue-500/20 text-blue-100' : 'hover:bg-white/5 text-gray-300'
                                }`}
                                onClick={() => {
                                    onSelect(file);
                                    onClose();
                                }}
                                onMouseEnter={() => setActiveIndex(index)}
                            >
                                <div className={`p-1 rounded ${index === activeIndex ? 'bg-blue-500/30' : 'bg-white/5'}`}>
                                    <File className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex flex-col">
                                    <span>{file.name}</span>
                                    {file.path && <span className="text-[10px] opacity-50 truncate max-w-[400px]">{file.path}</span>}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="px-4 py-8 text-center text-sm text-white/30 flex flex-col items-center gap-2">
                             <File className="w-8 h-8 opacity-20" />
                             No files found matching '{query}'.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
