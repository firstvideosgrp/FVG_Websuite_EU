import React, { useState, useEffect, useCallback } from 'react';
import type { MediaFile, MediaCategory } from '../types';
import { listFiles, deleteFile, getFilePreviewUrl, updateMediaMetadata } from '../services/appwrite';
import LoadingSpinner from './LoadingSpinner';
import UploadMediaModal from './UploadMediaModal';
import { useNotification } from '../contexts/NotificationContext';
import { useConfirmation } from '../contexts/ConfirmationDialogContext';

interface MediaPanelProps {
    fileUsageMap: Map<string, string[]>;
}

const categories: MediaCategory[] = ['Image', 'Poster', 'Soundtrack', 'Document', 'Video', 'Logo', 'Behind-the-Scenes', 'Hero Background', 'Project Poster', 'Audio Clip'];

const MediaPanel: React.FC<MediaPanelProps> = ({ fileUsageMap }) => {
    const [files, setFiles] = useState<MediaFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { addNotification } = useNotification();
    const { confirm } = useConfirmation();

    // State for the new edit modal
    const [editingFile, setEditingFile] = useState<MediaFile | null>(null);
    const [editForm, setEditForm] = useState({ name: '', category: 'Image' as MediaCategory });
    const [isUpdating, setIsUpdating] = useState(false);

    const fetchFiles = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fileList = await listFiles();
            setFiles(fileList);
        } catch (err) {
            setError('Failed to load media files.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);
    
    // Effect to populate edit form when a file is selected for editing
    useEffect(() => {
        if (editingFile) {
            setEditForm({ name: editingFile.name, category: editingFile.category });
        }
    }, [editingFile]);

    const handleDeleteFile = async (file: MediaFile) => {
        const usage = fileUsageMap.get(file.$id);
        const confirmMessage = usage && usage.length > 0
            ? `This file appears to be in use:\n- ${usage.join('\n- ')}\n\nDeleting it may cause broken images or assets on your site. Are you sure you want to proceed?`
            : `Are you sure you want to permanently delete the file "${file.name}"? This action cannot be undone.`;

        const isConfirmed = await confirm({
            title: 'Confirm Deletion',
            message: confirmMessage,
            confirmText: 'Delete File',
            confirmStyle: 'destructive',
        });
        
        if (!isConfirmed) return;

        try {
            await deleteFile(file.$id);
            setFiles(prevFiles => prevFiles.filter(f => f.$id !== file.$id));
            addNotification('info', 'File Deleted', `The file "${file.name}" has been deleted.`);
        } catch (err) {
            addNotification('error', 'Delete Failed', 'Failed to delete file.');
            console.error(err);
        }
    };
    
    const copyToClipboard = (fileId: string) => {
        const url = getFilePreviewUrl(fileId);
        navigator.clipboard.writeText(url).then(() => {
            addNotification('success', 'Copied!', 'URL copied to clipboard.');
        }, () => {
            addNotification('error', 'Copy Failed', 'Could not copy URL to clipboard.');
        });
    };
    
    const openEditModal = (file: MediaFile) => {
        setEditingFile(file);
        setError(null);
    };

    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingFile) return;

        setIsUpdating(true);
        setError(null);
        try {
            await updateMediaMetadata(editingFile.$id, editForm);
            addNotification('success', 'Media Updated', `Details for "${editForm.name}" updated successfully.`);
            setEditingFile(null);
            await fetchFiles(); // Refresh list
        } catch (err) {
            setError('Failed to update media details.');
            console.error(err);
        } finally {
            setIsUpdating(false);
        }
    };


    return (
        <div className="bg-[var(--bg-primary)] p-6 rounded-lg shadow-lg border border-[var(--border-color)]">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[var(--primary-color)] flex items-center">
                    <i className="fas fa-photo-video mr-3"></i>Media Library
                </h2>
                <div>
                     <button onClick={() => setIsUploadModalOpen(true)} className="cursor-pointer bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors flex items-center space-x-2">
                        <i className="fas fa-plus"></i><span>Add New</span>
                    </button>
                </div>
            </div>
            
            {error && !editingFile && <div className="bg-red-500 text-white p-3 rounded-md mb-4">{error}</div>}

            {isLoading ? (
                <div className="flex justify-center items-center py-10">
                    <LoadingSpinner />
                </div>
            ) : files.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {files.map(file => {
                        const fileUsage = fileUsageMap.get(file.$id) || [];
                        const isAudio = (typeof file.mimeType === 'string' && file.mimeType.startsWith('audio/')) || file.category === 'Audio Clip';
                        return (
                        <div key={file.$id} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg overflow-hidden group relative">
                            <div className="absolute top-2 left-2 z-10">
                                <span className="bg-black/70 text-[var(--primary-color)] text-xs font-bold px-2 py-1 rounded">
                                    {file.category}
                                </span>
                            </div>
                            {isAudio ? (
                                <div className="w-full h-40 bg-[var(--bg-primary)] flex items-center justify-center">
                                    <i className="fas fa-music text-6xl text-[var(--text-secondary)]"></i>
                                </div>
                            ) : (
                                <img src={getFilePreviewUrl(file.$id, 200)} alt={file.name} className="w-full h-40 object-cover" loading="lazy" />
                            )}
                            <div className="p-2 text-center">
                                <p className="text-sm text-[var(--text-secondary)] truncate" title={file.name}>{file.name}</p>
                            </div>
                             <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity p-2 text-white text-xs text-center">
                                <div className="w-full">
                                    <p className="font-bold border-b border-white/20 pb-1 mb-1">Usage</p>
                                    <div className="max-h-16 overflow-y-auto text-left px-1">
                                        {fileUsage.length > 0 ? (
                                            <ul className="list-none space-y-0.5">
                                               {fileUsage.map((use, index) => <li key={index} className="truncate" title={use}>{use}</li>)}
                                            </ul>
                                        ) : (
                                            <p className="text-gray-400 text-center italic mt-2">Not in use</p>
                                        )}
                                    </div>
                                </div>
                                <div className="w-full space-y-1 mt-auto pt-2">
                                    <button onClick={() => openEditModal(file)} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-2 rounded text-xs">Edit Details</button>
                                    <button onClick={() => copyToClipboard(file.$id)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-xs">Copy URL</button>
                                    <button onClick={() => handleDeleteFile(file)} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs">Delete</button>
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
            ) : (
                <p className="text-center text-[var(--text-secondary)] py-10">No media files found. Upload a file to get started.</p>
            )}

            {isUploadModalOpen && (
                <UploadMediaModal 
                    onClose={() => setIsUploadModalOpen(false)} 
                    onUploadSuccess={() => {
                        setIsUploadModalOpen(false);
                        fetchFiles();
                    }}
                />
            )}
            
            {editingFile && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4" role="dialog" aria-modal="true">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-lg shadow-2xl w-full max-w-md relative text-[var(--text-primary)]">
                        <button onClick={() => setEditingFile(null)} aria-label="Close modal" className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-2xl">&times;</button>
                        <h2 className="text-2xl font-bold mb-6 text-center">Edit Media</h2>
                        <form onSubmit={handleUpdateSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="edit-name" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Name</label>
                                <input
                                    id="edit-name"
                                    type="text"
                                    value={editForm.name}
                                    onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="edit-category" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Category</label>
                                <select
                                    id="edit-category"
                                    value={editForm.category}
                                    onChange={e => setEditForm(prev => ({ ...prev, category: e.target.value as MediaCategory }))}
                                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]"
                                    required
                                >
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                            <div className="flex justify-end space-x-4 pt-4">
                                <button type="button" onClick={() => setEditingFile(null)} disabled={isUpdating} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50">Cancel</button>
                                <button type="submit" disabled={isUpdating} className="bg-[var(--primary-color)] hover:brightness-110 text-gray-900 font-bold py-2 px-4 rounded disabled:opacity-50 flex items-center justify-center w-28">
                                    {isUpdating ? <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-gray-900"></div> : 'Update'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MediaPanel;