import React, { useState } from 'react';
import { uploadFile } from '../services/appwrite';
import type { MediaCategory } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface UploadModalProps {
  onClose: () => void;
  onUploadSuccess: () => void;
}

const categories: MediaCategory[] = ['Image', 'Poster', 'Soundtrack', 'Document', 'Video', 'Logo', 'Behind-the-Scenes', 'Hero Background', 'Project Poster'];

const UploadMediaModal: React.FC<UploadModalProps> = ({ onClose, onUploadSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [category, setCategory] = useState<MediaCategory>('Image');
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError('Please select a file.');
            return;
        }
        setIsUploading(true);
        setError('');
        try {
            await uploadFile(file, category);
            alert('File uploaded successfully!');
            onUploadSuccess();
        } catch (err) {
            setError('Upload failed. Please try again.');
            console.error(err);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4" role="dialog" aria-modal="true">
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-lg shadow-2xl w-full max-w-md relative text-[var(--text-primary)]">
                <button onClick={onClose} aria-label="Close modal" className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-2xl">&times;</button>
                <h2 className="text-2xl font-bold mb-6 text-center">Add New Media</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="file-input" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">File</label>
                        <input id="file-input" type="file" onChange={handleFileChange} className="w-full text-sm text-[var(--text-secondary)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--primary-color)] file:text-gray-900 hover:file:brightness-110" required />
                    </div>
                    <div>
                        <label htmlFor="category-select" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Category</label>
                        <select id="category-select" value={category} onChange={e => setCategory(e.target.value as MediaCategory)} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]" required>
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} disabled={isUploading} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50">Cancel</button>
                        <button type="submit" disabled={isUploading || !file} className="bg-[var(--primary-color)] hover:brightness-110 text-gray-900 font-bold py-2 px-4 rounded disabled:opacity-50 flex items-center justify-center w-28">
                            {isUploading ? <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-gray-900"></div> : 'Upload'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UploadMediaModal;