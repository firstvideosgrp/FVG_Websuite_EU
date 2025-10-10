import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { UnifiedMediaFile } from '../types';
import { listAllMediaFiles, getUnifiedFilePreviewUrl } from '../services/appwrite';
import LoadingSpinner from './LoadingSpinner';
import { useNotification } from '../contexts/NotificationContext';

interface MediaLibraryModalProps {
    onSelect: (url: string) => void;
    onClose: () => void;
    fileUsageMap: Map<string, string[]>;
}

const MediaLibraryModal: React.FC<MediaLibraryModalProps> = ({ onSelect, onClose, fileUsageMap }) => {
    const [files, setFiles] = useState<UnifiedMediaFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [libraryFilter, setLibraryFilter] = useState<'all' | 'media' | 'elements'>('all');
    const { addNotification } = useNotification();

    const fetchFiles = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fileList = await listAllMediaFiles();
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
    
    const filteredFiles = useMemo(() => {
        if (libraryFilter === 'all') return files;
        return files.filter(f => f.library === libraryFilter);
    }, [files, libraryFilter]);

    const handleSelectFile = (file: UnifiedMediaFile) => {
        const url = getUnifiedFilePreviewUrl(file);
        try {
            navigator.clipboard.writeText(url);
            addNotification('info', 'URL Copied', 'The file URL has also been copied to your clipboard.');
        } catch (e) {
            console.warn('Could not copy URL to clipboard');
        }
        onSelect(url);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4" role="dialog" aria-modal="true">
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col relative text-[var(--text-primary)]">
                <div className="flex justify-between items-center mb-4 border-b border-[var(--border-color)] pb-4">
                    <h2 className="text-xl font-bold text-[var(--primary-color)]">Select Media</h2>
                    <button onClick={onClose} aria-label="Close modal" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-2xl">&times;</button>
                </div>
                
                <div className="flex items-center space-x-2 mb-4">
                    <span className="text-sm font-semibold text-[var(--text-secondary)]">Filter:</span>
                    <button onClick={() => setLibraryFilter('all')} className={`px-3 py-1 text-xs rounded-full transition-colors ${libraryFilter === 'all' ? 'bg-[var(--primary-color)] text-gray-900 font-bold' : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-card)]'}`}>All</button>
                    <button onClick={() => setLibraryFilter('media')} className={`px-3 py-1 text-xs rounded-full transition-colors ${libraryFilter === 'media' ? 'bg-[var(--primary-color)] text-gray-900 font-bold' : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-card)]'}`}>Media Library</button>
                    <button onClick={() => setLibraryFilter('elements')} className={`px-3 py-1 text-xs rounded-full transition-colors ${libraryFilter === 'elements' ? 'bg-[var(--primary-color)] text-gray-900 font-bold' : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-card)]'}`}>Production Elements</button>
                </div>

                <div className="flex-grow overflow-y-auto">
                    {error && <div className="bg-red-500 text-white p-3 rounded-md mb-4">{error}</div>}
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <LoadingSpinner />
                        </div>
                    ) : filteredFiles.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {filteredFiles.map(file => {
                                const fileUsage = fileUsageMap.get(file.$id) || [];
                                const isAudio = (typeof file.mimeType === 'string' && file.mimeType.startsWith('audio/')) || file.category === 'Audio Clip' || file.category === 'Soundtrack';
                                return (
                                <button key={file.$id} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg overflow-hidden group relative cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" onClick={() => handleSelectFile(file)}>
                                    {isAudio ? (
                                        <div className="w-full h-32 bg-[var(--bg-primary)] flex items-center justify-center">
                                            <i className="fas fa-music text-4xl text-[var(--text-secondary)]"></i>
                                        </div>
                                    ) : (
                                        <img src={getUnifiedFilePreviewUrl(file)} alt={file.displayName} className="w-full h-32 object-cover" loading="lazy" />
                                    )}
                                    <div className="p-2 text-center">
                                        <p className="text-xs text-[var(--text-secondary)] truncate" title={file.displayName}>{file.displayName}</p>
                                        
                                        <div className="mt-1 space-y-1">
                                            <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${file.library === 'media' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'}`}>
                                                {file.library === 'media' ? 'Media Lib' : 'Elements Lib'}
                                            </div>
                                            {fileUsage.length > 0 ? (
                                                <div className="flex items-center justify-center" title={`In use: ${fileUsage.join(', ')}`}>
                                                    <i className="fas fa-check-circle text-green-500 text-[11px] mr-1"></i>
                                                    <p className="text-[10px] text-green-400 font-medium">In use</p>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center">
                                                    <i className="fas fa-info-circle text-gray-500 text-[11px] mr-1"></i>
                                                    <p className="text-[10px] text-gray-500">Not in use</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="absolute inset-0 bg-[var(--primary-color)] bg-opacity-80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-gray-900 font-bold">Select</span>
                                    </div>
                                </button>
                            )})}
                        </div>
                    ) : (
                        <p className="text-center text-[var(--text-secondary)] py-10">No media files match the current filter.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MediaLibraryModal;