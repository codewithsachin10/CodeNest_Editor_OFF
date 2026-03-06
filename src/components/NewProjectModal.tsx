
import { useState } from 'react';
import { FileCode, Globe, Code, Coffee, FolderPlus, X } from 'lucide-react';
import { pythonIcon, cIcon, cppIcon, javaIcon, nodeIcon } from '@/utils/languageIcons';

interface NewProjectModalProps {
    onClose: () => void;
    onCreate: (templateId: string, location: string) => Promise<void>;
    onBrowse: () => Promise<string | null>;
}

export function NewProjectModal({ onClose, onCreate, onBrowse }: NewProjectModalProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [projectLocation, setProjectLocation] = useState('');
    const [projectName, setProjectName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const templates = [
        { id: 'python', name: 'Python Script', icon: <img src={pythonIcon} alt="Python" className="w-8 h-8 drop-shadow-md" draggable={false} />, desc: 'Simple Python application', color: 'from-blue-500/20 to-yellow-500/20', border: 'hover:border-blue-500/50' },
        { id: 'c', name: 'C Application', icon: <img src={cIcon} alt="C" className="w-8 h-8 drop-shadow-md" draggable={false} />, desc: 'Standard C program with GCC', color: 'from-blue-600/20 to-indigo-600/20', border: 'hover:border-indigo-500/50' },
        { id: 'cpp', name: 'C++ Application', icon: <img src={cppIcon} alt="C++" className="w-8 h-8 drop-shadow-md" draggable={false} />, desc: 'Modern C++17 application', color: 'from-indigo-600/20 to-purple-600/20', border: 'hover:border-purple-500/50' },
        { id: 'java', name: 'Java App', icon: <img src={javaIcon} alt="Java" className="w-8 h-8 drop-shadow-md" draggable={false} />, desc: 'Java class with main method', color: 'from-orange-500/20 to-red-500/20', border: 'hover:border-orange-500/50' },
        { id: 'web', name: 'Web Site', icon: <Globe className="w-8 h-8 text-sky-400 drop-shadow-md" />, desc: 'HTML5, CSS3, and JavaScript', color: 'from-sky-500/20 to-cyan-500/20', border: 'hover:border-sky-500/50' },
        { id: 'node', name: 'Node.js App', icon: <img src={nodeIcon} alt="Node.js" className="w-8 h-8 drop-shadow-md" draggable={false} />, desc: 'Node.js server application', color: 'from-green-500/20 to-emerald-500/20', border: 'hover:border-green-500/50' },
    ];

    const handleBrowse = async () => {
        const path = await onBrowse();
        if (path) setProjectLocation(path);
    };

    const handleCreate = async () => {
        if (!selectedTemplate || !projectLocation || !projectName) return;
        setIsCreating(true);
        try {
            await onCreate(selectedTemplate, `${projectLocation}/${projectName}`);
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <div className="relative w-full max-w-3xl animate-in fade-in zoom-in-95 duration-300">
                {/* Glowing glow effect behind modal */}
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-sky-500/30 to-purple-500/30 blur-2xl opacity-50" />
                
                <div className="relative bg-[#0F172A]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-3 text-white">
                                <span className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                                    <FolderPlus className="w-5 h-5" />
                                </span>
                                Create New Project
                            </h2>
                            <p className="text-sm text-slate-400 mt-1.5 font-medium">Select a language template to get started</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                        {/* Template Selection */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {templates.map(t => {
                                const isSelected = selectedTemplate === t.id;
                                return (
                                    <button
                                        key={t.id}
                                        onClick={() => setSelectedTemplate(t.id)}
                                        className={`group relative flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all duration-300 ${
                                            isSelected
                                                ? 'bg-gradient-to-br border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.2)] scale-[1.02]'
                                                : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.04] hover:scale-[1.01] hover:shadow-xl'
                                        }`}
                                    >
                                        {/* Background gradient override for selected state */}
                                        {isSelected && <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${t.color} opacity-40`} />}
                                        
                                        <div className={`relative p-3 rounded-xl transition-transform duration-300 group-hover:-translate-y-1 ${isSelected ? 'bg-white/10' : 'bg-white/5'}`}>
                                            {t.icon}
                                        </div>
                                        <div className="relative text-center w-full">
                                            <div className={`font-semibold text-sm mb-1 ${isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>{t.name}</div>
                                            <div className="text-[11px] font-medium text-slate-500 group-hover:text-slate-400 line-clamp-1">{t.desc}</div>
                                        </div>

                                        {/* Active indicator ring */}
                                        {isSelected && (
                                            <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Project Details */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-5">
                            <div>
                                <label className="text-xs font-bold tracking-wider uppercase text-slate-400 mb-2 block">Project Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-[#0B1120] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none transition-all shadow-inner"
                                    placeholder="my-awesome-app"
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold tracking-wider uppercase text-slate-400 mb-2 block">Location</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        className="flex-1 bg-[#0B1120]/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-400 cursor-not-allowed"
                                        value={projectLocation}
                                        placeholder="Select a parent folder..."
                                    />
                                    <button
                                        onClick={handleBrowse}
                                        className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold text-white transition-all shadow-sm hover:shadow-md active:scale-95"
                                    >
                                        Browse Options
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-white/5 bg-[#0B1120]/80 flex justify-end gap-3 rounded-b-2xl">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={!selectedTemplate || !projectName || !projectLocation || isCreating}
                            className="px-8 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:bg-sky-500/30 disabled:text-white/40 disabled:cursor-not-allowed rounded-xl text-sm font-bold text-white shadow-[0_0_20px_rgba(56,189,248,0.3)] hover:shadow-[0_0_25px_rgba(56,189,248,0.5)] transition-all active:scale-95 flex items-center gap-2"
                        >
                            {isCreating ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Project'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
