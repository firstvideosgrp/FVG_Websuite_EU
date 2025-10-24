import React, { useState, useEffect, useCallback } from 'react';
import type { PublicSoundtrack } from '../types';
import * as api from '../services/appwrite';
import LoadingSpinner from './LoadingSpinner';
import MediaLibraryModal from './MediaLibraryModal';
import { useNotification } from '../contexts/NotificationContext';
import { useConfirmation } from '../contexts/ConfirmationDialogContext';

interface PublicSoundtrackPanelProps {
    fileUsageMap: Map<string, string[]>;
}

const PublicSoundtrackPanel: React.FC<PublicSoundtrackPanelProps> = ({ fileUsageMap }) => {
    const [tracks, setTracks] = useState<PublicSoundtrack[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTrack, setEditingTrack] = useState<PublicSoundtrack | null>(null);
    const [formState, setFormState] = useState({
        movieTitle: '',
        songTitle: '',
        artistName: '',
        imdbUrl: '',
        youtubeUrl: '',
        albumArtUrl: '',
        releaseYear: new Date().getFullYear(),
        genre: '',
        isRecommended: false,
    });
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    const { addNotification } = useNotification();
    const { confirm } = useConfirmation();

    const fetchTracks = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.getPublicSoundtracks();
            setTracks(data);
        } catch (error) {
            addNotification('error', 'Load Failed', 'Could not fetch public soundtracks.');
        } finally {
            setIsLoading(false);
        }
    }, [addNotification]);

    useEffect(() => {
        fetchTracks();
    }, [fetchTracks]);

    const openModal = (track: PublicSoundtrack | null) => {
        setEditingTrack(track);
        if (track) {
            setFormState({
                movieTitle: track.movieTitle,
                songTitle: track.songTitle,
                artistName: track.artistName,
                imdbUrl: track.imdbUrl || '',
                youtubeUrl: track.youtubeUrl || '',
                albumArtUrl: track.albumArtUrl || '',
                releaseYear: track.releaseYear || new Date().getFullYear(),
                genre: track.genre || '',
                isRecommended: track.isRecommended || false,
            });
        } else {
            setFormState({
                movieTitle: '',
                songTitle: '',
                artistName: '',
                imdbUrl: '',
                youtubeUrl: '',
                albumArtUrl: '',
                releaseYear: new Date().getFullYear(),
                genre: '',
                isRecommended: false,
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormState(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) || 0 : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const dataToSubmit = {
                ...formState,
                releaseYear: Number(formState.releaseYear) || undefined,
                imdbUrl: formState.imdbUrl || undefined,
                youtubeUrl: formState.youtubeUrl || undefined,
                albumArtUrl: formState.albumArtUrl || undefined,
                genre: formState.genre || undefined,
            };

            if (editingTrack) {
                await api.updatePublicSoundtrack(editingTrack.$id, dataToSubmit);
                addNotification('success', 'Track Updated', `Successfully updated "${formState.songTitle}".`);
            } else {
                await api.createPublicSoundtrack(dataToSubmit);
                addNotification('success', 'Track Created', `Successfully created "${formState.songTitle}".`);
            }
            closeModal();
            fetchTracks();
        } catch (error) {
            addNotification('error', 'Save Failed', 'Could not save the soundtrack.');
            console.error('Soundtrack Save Error:', error);
        }
    };

    const handleDelete = async (track: PublicSoundtrack) => {
        const isConfirmed = await confirm({
            title: 'Confirm Deletion',
            message: `Are you sure you want to delete "${track.songTitle}" from the public database?`,
            confirmStyle: 'destructive',
        });
        if (isConfirmed) {
            try {
                await api.deletePublicSoundtrack(track.$id);
                addNotification('info', 'Track Deleted', `The track "${track.songTitle}" has been deleted.`);
                fetchTracks();
            } catch (error) {
                addNotification('error', 'Delete Failed', 'Could not delete the soundtrack.');
            }
        }
    };

    const handleToggleRecommended = async (track: PublicSoundtrack) => {
        const newStatus = !track.isRecommended;
        
        setTracks(prevTracks => 
            prevTracks.map(t => t.$id === track.$id ? {...t, isRecommended: newStatus} : t)
        );

        try {
            await api.updatePublicSoundtrack(track.$id, { isRecommended: newStatus });
            addNotification('info', 'Status Updated', `"${track.songTitle}" recommendation status updated.`);
        } catch (error) {
            addNotification('error', 'Update Failed', 'Could not update recommendation status.');
            setTracks(prevTracks => 
                prevTracks.map(t => t.$id === track.$id ? {...t, isRecommended: track.isRecommended} : t)
            );
        }
    };

    return (
        <>
            <div className="bg-[var(--bg-primary)] p-6 rounded-lg shadow-lg border border-[var(--border-color)]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-[var(--primary-color)] flex items-center">
                        <i className="fas fa-search-dollar mr-3"></i>Soundtrack Searcher Database
                    </h2>
                    <button onClick={() => openModal(null)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors flex items-center space-x-2 text-sm">
                        <i className="fas fa-plus"></i><span>Add New Track</span>
                    </button>
                </div>
                
                {isLoading ? (
                    <div className="flex justify-center items-center py-10"><LoadingSpinner /></div>
                ) : tracks.length > 0 ? (
                    <div className="space-y-3">
                        {tracks.map(track => (
                            <div key={track.$id} className="bg-[var(--bg-secondary)] p-3 rounded-md flex justify-between items-center border border-[var(--border-color)]">
                                <div className="flex items-center gap-4">
                                    {track.albumArtUrl ? (
                                        <img src={track.albumArtUrl} alt="Album art" className="w-12 h-12 object-cover rounded-md" />
                                    ) : (
                                        <div className="w-12 h-12 bg-[var(--bg-primary)] flex items-center justify-center rounded-md text-[var(--text-secondary)]"><i className="fas fa-music text-2xl"></i></div>
                                    )}
                                    <div>
                                        <h3 className="font-bold text-lg text-[var(--text-primary)]">{track.songTitle}</h3>
                                        <p className="text-sm text-[var(--text-secondary)]">{track.artistName} &bull; <span className="font-semibold">{track.movieTitle} ({track.releaseYear})</span></p>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleToggleRecommended(track)}
                                        className={`font-bold py-2 px-3 rounded text-sm transition-colors ${track.isRecommended ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/40' : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/40'}`}
                                        title={track.isRecommended ? "Un-recommend" : "Recommend"}
                                    >
                                        <i className={`fas fa-star`}></i>
                                    </button>
                                    <button onClick={() => openModal(track)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded text-sm"><i className="fas fa-pencil-alt"></i></button>
                                    <button onClick={() => handleDelete(track)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded text-sm"><i className="fas fa-trash"></i></button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-[var(--text-secondary)] py-10">No soundtracks in the public database. Click "Add New Track" to get started.</p>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-lg shadow-2xl w-full max-w-2xl relative text-[var(--text-primary)] max-h-[90vh] overflow-y-auto">
                        <button onClick={closeModal} className="absolute top-4 right-4 text-[var(--text-secondary)] text-2xl">&times;</button>
                        <h2 className="text-2xl font-bold mb-6">{editingTrack ? 'Edit' : 'Create'} Soundtrack Entry</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Song Title</label>
                                    <input type="text" name="songTitle" value={formState.songTitle} onChange={handleChange} required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Artist Name</label>
                                    <input type="text" name="artistName" value={formState.artistName} onChange={handleChange} required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" />
                                </div>
                            </div>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Movie Title</label>
                                    <input type="text" name="movieTitle" value={formState.movieTitle} onChange={handleChange} required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" />
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Release Year</label>
                                    <input type="number" name="releaseYear" value={formState.releaseYear} onChange={handleChange} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Genre (Optional)</label>
                                <input type="text" name="genre" value={formState.genre} onChange={handleChange} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Album Art URL</label>
                                <div className="flex items-center space-x-2">
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
                            <div>
                                <label className="flex items-center space-x-2 text-sm font-medium text-[var(--text-secondary)] cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        name="isRecommended" 
                                        checked={formState.isRecommended} 
                                        onChange={handleChange} 
                                        className="h-4 w-4 rounded bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--primary-color)] focus:ring-[var(--primary-color)]" 
                                    />
                                    <span>Mark as Recommended</span>
                                </label>
                            </div>
                            <div className="flex justify-end space-x-4 pt-4">
                                <button type="button" onClick={closeModal} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">Cancel</button>
                                <button type="submit" className="bg-[var(--primary-color)] hover:brightness-110 text-gray-900 font-bold py-2 px-4 rounded">Save Track</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {isMediaModalOpen && (
                <MediaLibraryModal
                    onSelect={(url) => {
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

export default PublicSoundtrackPanel;
