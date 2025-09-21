import React, { useState, useEffect, useCallback } from 'react';
import type { MediaFile } from '../types';
import { listFiles, deleteFile, getFilePreviewUrl } from '../services/appwrite';
import LoadingSpinner from './LoadingSpinner';
import UploadMediaModal from './UploadMediaModal';

interface MediaPanelProps {
    fileUsageMap: Map<string, string[]>;
}

const MediaPanel: React.FC<MediaPanelProps> = ({ fileUsageMap }) => {
    const [files, setFiles] = useState<MediaFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
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

    const handleDeleteFile = async (fileId: string) => {
        const usage = fileUsageMap.get(fileId);
        const confirmMessage = usage && usage.length > 0
            ? `This file appears to be in use:\n- ${usage.join('\n- ')}\n\nDeleting it may cause broken images on your site. Are you sure you want to delete it?`
            : 'Are you sure you want to delete this file? This action cannot be undone.';

        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            await deleteFile(fileId);
            setFiles(prevFiles => prevFiles.filter(f => f.$id !== fileId));
        } catch (err) {
            setError('Failed to delete file.');
            console.error(err);
        }
    };
    
    const copyToClipboard = (fileId: string) => {
        const url = getFilePreviewUrl(fileId);
        navigator.clipboard.writeText(url).then(() => {
            alert('URL copied to clipboard!');
        }, () => {
            alert('Failed to copy URL.');
        });
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
            
            {error && <div className="bg-red-500 text-white p-3 rounded-md mb-4">{error}</div>}

            {isLoading ? (
                <div className="flex justify-center items-center py-10">
                    <LoadingSpinner />
                </div>
            ) : files.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {files.map(file => {
                        const fileUsage = fileUsageMap.get(file.$id) || [];
                        return (
                        <div key={file.$id} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg overflow-hidden group relative">
                            <div className="absolute top-2 left-2 z-10">
                                <span className="bg-black/70 text-[var(--primary-color)] text-xs font-bold px-2 py-1 rounded">
                                    {file.category}
                                </span>
                            </div>
                            <img src={getFilePreviewUrl(file.$id, 200)} alt={file.name} className="w-full h-40 object-cover" loading="lazy" />
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
                                    <button onClick={() => copyToClipboard(file.$id)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded">Copy URL</button>
                                    <button onClick={() => handleDeleteFile(file.$id)} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded">Delete</button>
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
        </div>
    );
};

export default MediaPanel;