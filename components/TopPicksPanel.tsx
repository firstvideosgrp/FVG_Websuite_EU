import React, { useState, useEffect, useCallback } from 'react';
// FIX: Changed import from 'TopPick' to 'PublicSoundtrack' and aliased it as 'TopPick' to resolve the type error.
// This adapts the component to use the existing data structure for soundtracks.
import type { PublicSoundtrack as TopPick } from '../types';
import * as api from '../services/appwrite';
import LoadingSpinner from './LoadingSpinner';
import MediaLibraryModal from './MediaLibraryModal';
import { useNotification } from '../contexts/NotificationContext';
import { useConfirmation } from '../contexts/ConfirmationDialogContext';

interface TopPicksPanelProps {
    fileUsageMap: Map<string, string[]>;
}

const TopPicksPanel: React.FC<TopPicksPanelProps> = ({ fileUsageMap }) => {
    const [picks, setPicks] = useState<TopPick[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPick, setEditingPick] = useState<TopPick | null>(null);
    // FIX: Renamed form state fields to match the 'PublicSoundtrack' (aliased as 'TopPick') type.
    const [formState, setFormState] = useState({
        songTitle: '',
        movieTitle: '',
        artistName: '',
        topPickOrder: 1,
        albumArtUrl: '',
        imdbUrl: '',
        youtubeUrl: '',
    });
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    const { addNotification } = useNotification();
    const { confirm } = useConfirmation();

    const fetchPicks = useCallback(async () => {
        setIsLoading(true);
        try {
            // FIX: Replaced non-existent 'getTopPicks' with 'getPublicSoundtracks' and added filtering logic
            // to ensure this component only manages tracks designated as "Top Picks".
            const allTracks = await api.getPublicSoundtracks();
            setPicks(allTracks.filter(t => t.topPickOrder && t.topPickOrder > 0).sort((a,b) => a.topPickOrder! - b.topPickOrder!));
        } catch (error) {
            addNotification('error', 'Load Failed', 'Could not fetch top picks.');
        } finally {
            setIsLoading(false);
        }
    }, [addNotification]);

    useEffect(() => {
        fetchPicks();
    }, [fetchPicks]);

    const openModal = (pick: TopPick | null) => {
        setEditingPick(pick);
        if (pick) {
            // FIX: Updated to use correct field names from the 'PublicSoundtrack' type.
            setFormState({
                songTitle: pick.songTitle,
                movieTitle: pick.movieTitle,
                artistName: pick.artistName,
                topPickOrder: pick.topPickOrder || 1,
                albumArtUrl: pick.albumArtUrl || '',
                imdbUrl: pick.imdbUrl || '',
                youtubeUrl: pick.youtubeUrl || '',
            });
        } else {
            // FIX: Updated to calculate order based on the correct 'topPickOrder' field.
            const maxOrder = picks.reduce((max, p) => Math.max(max, p.topPickOrder || 0), 0);
            setFormState({
                songTitle: '',
                movieTitle: '',
                artistName: '',
                topPickOrder: maxOrder + 1,
                albumArtUrl: '',
                imdbUrl: '',
                youtubeUrl: '',
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormState(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value) || 0 : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const dataToSubmit = {
                ...formState,
                albumArtUrl: formState.albumArtUrl || undefined,
                imdbUrl: formState.imdbUrl || undefined,
                youtubeUrl: formState.youtubeUrl || undefined,
            };

            if (editingPick) {
                // FIX: Replaced non-existent 'updateTopPick' with 'updatePublicSoundtrack'.
                await api.updatePublicSoundtrack(editingPick.$id, dataToSubmit);
                addNotification('success', 'Pick Updated', `Successfully updated "${formState.songTitle}".`);
            } else {
                // FIX: Replaced non-existent 'createTopPick' with 'createPublicSoundtrack'.
                await api.createPublicSoundtrack(dataToSubmit);
                addNotification('success', 'Pick Created', `Successfully created "${formState.songTitle}".`);
            }
            closeModal();
            fetchPicks();
        } catch (error) {
            addNotification('error', 'Save Failed', 'Could not save the top pick.');
            console.error('Top Pick Save Error:', error);
        }
    };

    const handleDelete = async (pick: TopPick) => {
        // FIX: Updated confirmation message to use the correct 'songTitle' property.
        const isConfirmed = await confirm({
            title: 'Confirm Deletion',
            message: `Are you sure you want to delete "${pick.songTitle}" from the Top 10 list?`,
            confirmStyle: 'destructive',
        });
        if (isConfirmed) {
            try {
                // FIX: Replaced non-existent 'deleteTopPick' with 'deletePublicSoundtrack'.
                await api.deletePublicSoundtrack(pick.$id);
                addNotification('info', 'Pick Deleted', `The pick "${pick.songTitle}" has been deleted.`);
                fetchPicks();
            } catch (error) {
                addNotification('error', 'Delete Failed', 'Could not delete the top pick.');
            }
        }
    };

    return (
        <>
            <div className="bg-[var(--bg-primary)] p-6 rounded-lg shadow-lg border border-[var(--border-color)]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-[var(--primary-color)] flex items-center">
                        <i className="fas fa-star mr-3"></i>Top 10 Editor's Picks
                    </h2>
                    <button onClick={() => openModal(null)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors flex items-center space-x-2 text-sm">
                        <i className="fas fa-plus"></i><span>Add New Pick</span>
                    </button>
                </div>
                
                {isLoading ? (
                    <div className="flex justify-center items-center py-10"><LoadingSpinner /></div>
                ) : picks.length > 0 ? (
                    <div className="space-y-3">
                        {picks.map(pick => (
                            <div key={pick.$id} className="bg-[var(--bg-secondary)] p-3 rounded-md flex justify-between items-center border border-[var(--border-color)]">
                                <div className="flex items-center gap-4">
                                    {/* FIX: Use 'topPickOrder' property */}
                                    <span className="font-black text-2xl text-[var(--primary-color)] w-8 text-center">{pick.topPickOrder}</span>
                                    {/* FIX: Use 'albumArtUrl' property */}
                                    {pick.albumArtUrl ? (
                                        <img src={pick.albumArtUrl} alt="Cover art" className="w-12 h-12 object-cover rounded-md" />
                                    ) : (
                                        <div className="w-12 h-12 bg-[var(--bg-primary)] flex items-center justify-center rounded-md text-[var(--text-secondary)]"><i className="fas fa-music text-2xl"></i></div>
                                    )}
                                    <div>
                                        {/* FIX: Use 'songTitle' property */}
                                        <h3 className="font-bold text-lg text-[var(--text-primary)]">{pick.songTitle}</h3>
                                        <p className="text-sm text-[var(--text-secondary)]">
                                            {/* FIX: Use 'artistName' property */}
                                            {pick.artistName} &bull; <span className="font-semibold">{pick.movieTitle}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <button onClick={() => openModal(pick)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded text-sm"><i className="fas fa-pencil-alt"></i></button>
                                    <button onClick={() => handleDelete(pick)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded text-sm"><i className="fas fa-trash"></i></button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-[var(--text-secondary)] py-10">No top picks yet. Click "Add New Pick" to get started.</p>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-lg shadow-2xl w-full max-w-2xl relative text-[var(--text-primary)] max-h-[90vh] overflow-y-auto">
                        <button onClick={closeModal} className="absolute top-4 right-4 text-[var(--text-secondary)] text-2xl">&times;</button>
                        <h2 className="text-2xl font-bold mb-6">{editingPick ? 'Edit' : 'Create'} Top Pick</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Soundtrack Title</label>
                                    {/* FIX: Rename 'soundtrackTitle' to 'songTitle' */}
                                    <input type="text" name="songTitle" value={formState.songTitle} onChange={handleChange} required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Artist</label>
                                    {/* FIX: Rename 'artist' to 'artistName' */}
                                    <input type="text" name="artistName" value={formState.artistName} onChange={handleChange} required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Order</label>
                                    {/* FIX: Rename 'order' to 'topPickOrder' */}
                                    <input type="number" name="topPickOrder" value={formState.topPickOrder} onChange={handleChange} required min="1" className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Movie Title</label>
                                <input type="text" name="movieTitle" value={formState.movieTitle} onChange={handleChange} required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Cover Image URL</label>
                                <div className="flex items-center space-x-2">
                                    {/* FIX: Rename 'coverImageUrl' to 'albumArtUrl' */}
                                    <input type="text" name="albumArtUrl" value={formState.albumArtUrl} onChange={handleChange} placeholder="Enter URL or select from media" className="flex-grow bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" />
                                    <button type="button" onClick={() => setIsMediaModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded text-sm"><i className="fas fa-photo-video"></i></button>
                                </div>
                            </div>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">IMDb URL (Optional)</label>
                                    <input type="url" name="imdbUrl" value={formState.imdbUrl} onChange={handleChange} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">YouTube URL (Optional)</label>
                                    <input type="url" name="youtubeUrl" value={formState.youtubeUrl} onChange={handleChange} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-4 pt-4">
                                <button type="button" onClick={closeModal} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">Cancel</button>
                                <button type="submit" className="bg-[var(--primary-color)] hover:brightness-110 text-gray-900 font-bold py-2 px-4 rounded">Save Pick</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {isMediaModalOpen && (
                <MediaLibraryModal
                    onSelect={(url) => {
                        // FIX: Rename 'coverImageUrl' to 'albumArtUrl'
                        setFormState(prev => ({ ...prev, albumArtUrl: url }));
                        setIsMediaModalOpen(false);
                    }}
                    onClose={() => setIsMediaModalOpen(false)}
                    fileUsageMap={fileUsageMap}
                />
            )}
        </>
    );
};

export default TopPicksPanel;
