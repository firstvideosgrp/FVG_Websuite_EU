import React, { useState, useEffect, useCallback } from 'react';
import type { Models } from 'appwrite';
import { listFiles, getFilePreviewUrl } from '../services/appwrite';
import LoadingSpinner from './LoadingSpinner';

interface MediaLibraryModalProps {
    onSelect: (url: string) => void;
    onClose: () => void;
    fileUsageMap: Map<string, string[]>;
}

const MediaLibraryModal: React.FC<MediaLibraryModalProps> = ({ onSelect, onClose, fileUsageMap }) => {
    const [files, setFiles] = useState<Models.File[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    const handleSelectFile = (fileId: string) => {
        const url = getFilePreviewUrl(fileId);
        onSelect(url);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4" role="dialog" aria-modal="true">
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col relative text-[var(--text-primary)]">
                <div className="flex justify-between items-center mb-4 border-b border-[var(--border-color)] pb-4">
                    <h2 className="text-xl font-bold text-[var(--primary-color)]">Select an Image</h2>
                    <button onClick={onClose} aria-label="Close modal" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-2xl">&times;</button>
                </div>

                <div className="flex-grow overflow-y-auto">
                    {error && <div className="bg-red-500 text-white p-3 rounded-md mb-4">{error}</div>}
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <LoadingSpinner />
                        </div>
                    ) : files.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {files.map(file => {
                                const fileUsage = fileUsageMap.get(file.$id) || [];
                                return (
                                <button key={file.$id} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg overflow-hidden group relative cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" onClick={() => handleSelectFile(file.$id)}>
                                    <img src={getFilePreviewUrl(file.$id, 200)} alt={file.name} className="w-full h-32 object-cover" loading="lazy" />
                                    <div className="p-2 text-center">
                                        <p className="text-xs text-[var(--text-secondary)] truncate" title={file.name}>{file.name}</p>
                                        {fileUsage.length > 0 ? (
                                            <div className="flex items-center justify-center mt-1" title={`In use: ${fileUsage.join(', ')}`}>
                                                <i className="fas fa-check-circle text-green-500 text-[11px] mr-1"></i>
                                                <p className="text-[10px] text-green-400 font-medium">In use</p>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center mt-1">
                                                <i className="fas fa-info-circle text-gray-500 text-[11px] mr-1"></i>
                                                <p className="text-[10px] text-gray-500">Not in use</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-[var(--primary-color)] bg-opacity-80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-gray-900 font-bold">Select</span>
                                    </div>
                                </button>
                            )})}
                        </div>
                    ) : (
                        <p className="text-center text-[var(--text-secondary)] py-10">No media files found.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MediaLibraryModal;