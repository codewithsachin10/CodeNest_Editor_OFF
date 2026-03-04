
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
        { id: 'python', name: 'Python Script', icon: <img src={pythonIcon} alt="Python" className="w-8 h-8" draggable={false} />, desc: 'Simple Python application' },
        { id: 'c', name: 'C Application', icon: <img src={cIcon} alt="C" className="w-8 h-8" draggable={false} />, desc: 'Standard C program with GCC' },
        { id: 'cpp', name: 'C++ Application', icon: <img src={cppIcon} alt="C++" className="w-8 h-8" draggable={false} />, desc: 'Modern C++17 application' },
        { id: 'java', name: 'Java App', icon: <img src={javaIcon} alt="Java" className="w-8 h-8" draggable={false} />, desc: 'Java class with main method' },
        { id: 'web', name: 'Web Site', icon: <Globe className="w-8 h-8 text-blue-400" />, desc: 'HTML5, CSS3, and JavaScript' },
        { id: 'node', name: 'Node.js App', icon: <img src={nodeIcon} alt="Node.js" className="w-8 h-8" draggable={false} />, desc: 'Node.js server application' },
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-[#111827] border border-[#1E293B] rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B]">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-[#E5E7EB]">
                        <FolderPlus className="w-5 h-5 text-sky-400" /> New Project
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-[#9CA3AF]" />
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-6 space-y-6">
                    {/* Template Selection */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {templates.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setSelectedTemplate(t.id)}
                                className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${selectedTemplate === t.id
                                        ? 'bg-sky-500/10 border-sky-500 ring-1 ring-sky-500'
                                        : 'bg-white/5 border-[#1E293B] hover:bg-white/10 hover:border-white/20'
                                    }`}
                            >
                                <div className="p-2 bg-white/5 rounded-lg">{t.icon}</div>
                                <div className="text-center">
                                    <div className="font-medium text-sm">{t.name}</div>
                                    <div className="text-[10px] opacity-60 mt-1">{t.desc}</div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Project Details */}
                    <div className="space-y-4 pt-4 border-t border-[#1E293B]">
                        <div>
                            <label className="text-xs font-medium text-[#9CA3AF] mb-1.5 block">Project Name</label>
                            <input
                                type="text"
                                className="w-full bg-[#0F172A] border border-[#1E293B] rounded-lg px-3 py-2 text-sm text-[#E5E7EB] focus:border-sky-500 focus:outline-none transition-colors"
                                placeholder="my-awesome-app"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-[#9CA3AF] mb-1.5 block">Location</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    className="flex-1 bg-[#0F172A] border border-[#1E293B] rounded-lg px-3 py-2 text-sm text-[#9CA3AF]"
                                    value={projectLocation}
                                    placeholder="Select a parent folder..."
                                />
                                <button
                                    onClick={handleBrowse}
                                    className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-[#1E293B] rounded-lg text-sm font-medium text-[#E5E7EB] transition-colors"
                                >
                                    Browse
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-[#1E293B] flex justify-end gap-3 bg-[#0F172A] rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 hover:bg-white/10 rounded-lg text-sm font-medium text-[#9CA3AF] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!selectedTemplate || !projectName || !projectLocation || isCreating}
                        className="px-6 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white shadow-lg shadow-sky-900/20 transition-all flex items-center gap-2"
                    >
                        {isCreating ? 'Creating...' : 'Create Project'}
                    </button>
                </div>
            </div>
        </div>
    );
}
