import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { SoundtrackFile, SoundtrackType, Project } from '../types';
import * as api from '../services/appwrite';
import LoadingSpinner from './LoadingSpinner';
import UploadSoundtrackModal from './UploadSoundtrackModal';
import { useNotification } from '../contexts/NotificationContext';
import { useConfirmation } from '../contexts/ConfirmationDialogContext';

interface SoundtrackPanelProps {
    projects: Project[];
}

const soundtrackTypes: SoundtrackType[] = ['Background Music', 'Licensed Track', 'Score Cue', 'Sound Design Element', 'Foley'];

const SoundtrackPanel: React.FC<SoundtrackPanelProps> = ({ projects }) => {
    const [soundtracks, setSoundtracks] = useState<SoundtrackFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { addNotification } = useNotification();
    const { confirm } = useConfirmation();

    const [editingElement, setEditingElement] = useState<SoundtrackFile | null>(null);
    const [editForm, setEditForm] = useState({ title: '', type: 'Background Music' as SoundtrackType, composer: '', licenseInfo: '', productionIds: [] as string[] });
    const [isUpdating, setIsUpdating] = useState(false);
    
    const [filters, setFilters] = useState({
        projectId: '',
        type: '',
    });
    
    const [playingFileId, setPlayingFileId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const projectsMap = useMemo(() => new Map(projects.map(p => [p.$id, p.title])), [projects]);

    const fetchSoundtracks = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const list = await api.listSoundtrackFiles();
            setSoundtracks(list);
        } catch (err) {
            setError('Failed to load soundtracks.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSoundtracks();
    }, [fetchSoundtracks]);

    useEffect(() => {
        if (editingElement) {
            setEditForm({
                title: editingElement.title,
                type: editingElement.type,
                composer: editingElement.composer,
                licenseInfo: editingElement.licenseInfo,
                productionIds: editingElement.productionIds || [],
            });
        }
    }, [editingElement]);

    const filteredSoundtracks = useMemo(() => {
        return soundtracks.filter(s => {
            const projectMatch = !filters.projectId || s.productionIds.includes(filters.projectId);
            const typeMatch = !filters.type || s.type === filters.type;
            return projectMatch && typeMatch;
        });
    }, [soundtracks, filters]);

    const handleDelete = async (element: SoundtrackFile) => {
        const isConfirmed = await confirm({
            title: 'Confirm Deletion',
            message: `Are you sure you want to permanently delete "${element.title}"?`,
            confirmStyle: 'destructive'
        });
        if (!isConfirmed) return;

        try {
            await api.deleteSoundtrackFile(element.$id);
            setSoundtracks(prev => prev.filter(f => f.$id !== element.$id));
            addNotification('info', 'Deleted', `"${element.title}" has been deleted.`);
        } catch (err) {
            addNotification('error', 'Delete Failed', 'Failed to delete soundtrack.');
            console.error(err);
        }
    };

    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingElement) return;

        setIsUpdating(true);
        setError(null);
        try {
            await api.updateSoundtrack(editingElement.$id, editForm);
            addNotification('success', 'Updated', `Details for "${editForm.title}" updated.`);
            setEditingElement(null);
            await fetchSoundtracks();
        } catch (err) {
            setError('Failed to update details.');
        } finally {
            setIsUpdating(false);
        }
    };
    
    const togglePlay = (fileId: string) => {
        if (playingFileId === fileId) {
            audioRef.current?.pause();
            setPlayingFileId(null);
        } else {
            setPlayingFileId(fileId);
        }
    };
    
     useEffect(() => {
        if (playingFileId && audioRef.current) {
            audioRef.current.src = api.getSoundtrackFilePreviewUrl(playingFileId);
            audioRef.current.play().catch(e => console.error("Audio play failed", e));
        } else if (audioRef.current) {
            audioRef.current.pause();
        }
    }, [playingFileId]);

    const openEditModal = (element: SoundtrackFile) => {
        setEditingElement(element);
        setError(null);
    };

    return (
        <div className="bg-[var(--bg-primary)] p-6 rounded-lg shadow-lg border border-[var(--border-color)]">
            <audio ref={audioRef} onEnded={() => setPlayingFileId(null)} className="hidden" />
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[var(--primary-color)] flex items-center">
                    <i className="fas fa-music mr-3"></i>Soundtrack Library
                </h2>
                <button onClick={() => setIsUploadModalOpen(true)} className="cursor-pointer bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors flex items-center space-x-2">
                    <i className="fas fa-plus"></i><span>Add Soundtrack</span>
                </button>
            </div>
            
            <div className="mb-6 p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] flex items-center gap-4">
                <div className="flex-grow">
                    <label htmlFor="project-filter" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Filter by Production</label>
                    <select id="project-filter" value={filters.projectId} onChange={(e) => setFilters(p => ({...p, projectId: e.target.value}))} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]">
                        <option value="">All Productions</option>
                        {projects.map(p => <option key={p.$id} value={p.$id}>{p.title}</option>)}
                    </select>
                </div>
                <div className="flex-grow">
                    <label htmlFor="type-filter" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Filter by Type</label>
                    <select id="type-filter" value={filters.type} onChange={(e) => setFilters(p => ({...p, type: e.target.value}))} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]">
                        <option value="">All Types</option>
                        {soundtrackTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>
            
            {error && !editingElement && <div className="bg-red-500 text-white p-3 rounded-md mb-4">{error}</div>}

            {isLoading ? <div className="flex justify-center py-10"><LoadingSpinner /></div> : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-[var(--text-secondary)]">
                        <thead className="text-xs uppercase bg-[var(--bg-secondary)]">
                            <tr>
                                <th scope="col" className="p-4 w-12"></th>
                                <th scope="col" className="px-6 py-3">Title</th>
                                <th scope="col" className="px-6 py-3">Composer/Artist</th>
                                <th scope="col" className="px-6 py-3">Type</th>
                                <th scope="col" className="px-6 py-3">Productions</th>
                                <th scope="col" className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSoundtracks.length > 0 ? filteredSoundtracks.map(s => (
                                <tr key={s.$id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)]">
                                    <td className="p-4">
                                        <button onClick={() => togglePlay(s.$id)} className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--primary-color)] text-gray-900">
                                            <i className={`fas ${playingFileId === s.$id ? 'fa-pause' : 'fa-play'}`}></i>
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-[var(--text-primary)] whitespace-nowrap">{s.title}</td>
                                    <td className="px-6 py-4">{s.composer}</td>
                                    <td className="px-6 py-4">{s.type}</td>
                                    <td className="px-6 py-4">{s.productionIds.map(id => projectsMap.get(id)).join(', ')}</td>
                                    <td className="px-6 py-4 flex items-center gap-2">
                                        <button onClick={() => openEditModal(s)} className="text-blue-400 hover:text-blue-300"><i className="fas fa-pencil-alt"></i></button>
                                        <button onClick={() => handleDelete(s)} className="text-red-400 hover:text-red-300"><i className="fas fa-trash"></i></button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={6} className="text-center py-10">No soundtracks found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {isUploadModalOpen && <UploadSoundtrackModal onClose={() => setIsUploadModalOpen(false)} onUploadSuccess={() => { setIsUploadModalOpen(false); fetchSoundtracks(); }} projects={projects} />}
            
            {editingElement && (
                 <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-lg shadow-2xl w-full max-w-2xl relative text-[var(--text-primary)]">
                        <button onClick={() => setEditingElement(null)} aria-label="Close modal" className="absolute top-4 right-4 text-[var(--text-secondary)] text-2xl">&times;</button>
                        <h2 className="text-2xl font-bold mb-6">Edit Soundtrack</h2>
                        <form onSubmit={handleUpdateSubmit} className="space-y-4">
                            {/* Form fields identical to Upload modal, without file input */}
                             <div>
                                <label htmlFor="title" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Title</label>
                                <input id="title" name="title" type="text" value={editForm.title} onChange={e => setEditForm(p => ({...p, title: e.target.value}))} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" required />
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="composer" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Composer / Artist</label>
                                    <input id="composer" name="composer" type="text" value={editForm.composer} onChange={e => setEditForm(p => ({...p, composer: e.target.value}))} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" required />
                                </div>
                                <div>
                                    <label htmlFor="type" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Type</label>
                                    <select id="type" name="type" value={editForm.type} onChange={e => setEditForm(p => ({...p, type: e.target.value as SoundtrackType}))} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" required>
                                        {soundtrackTypes.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="licenseInfo" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">License Information</label>
                                <textarea id="licenseInfo" name="licenseInfo" value={editForm.licenseInfo} onChange={e => setEditForm(p => ({...p, licenseInfo: e.target.value}))} rows={3} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" required />
                            </div>
                            <div>
                                <label htmlFor="productionIds" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Associated Production(s)</label>
                                <select multiple id="productionIds" name="productionIds" value={editForm.productionIds} onChange={e => {
                                    const options = e.target.options;
                                    const value = [];
                                    for(let i = 0, l = options.length; i < l; i++) {
                                        if (options[i].selected) { value.push(options[i].value); }
                                    }
                                    setEditForm(p => ({...p, productionIds: value}));
                                }} className="w-full h-32 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" required>
                                    {projects.map(p => <option key={p.$id} value={p.$id}>{p.title}</option>)}
                                </select>
                            </div>

                            {error && <p className="text-red-500 text-sm">{error}</p>}
                            <div className="flex justify-end space-x-4 pt-4">
                                <button type="button" onClick={() => setEditingElement(null)} disabled={isUpdating} className="bg-gray-500 text-white font-bold py-2 px-4 rounded">Cancel</button>
                                <button type="submit" disabled={isUpdating} className="bg-[var(--primary-color)] text-gray-900 font-bold py-2 px-4 rounded w-28 flex justify-center">{isUpdating ? <LoadingSpinner/> : 'Update'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SoundtrackPanel;
