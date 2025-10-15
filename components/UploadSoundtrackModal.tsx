import React, { useState } from 'react';
import { uploadSoundtrackFile } from '../services/appwrite';
import type { SoundtrackType, Project } from '../types';
import { useNotification } from '../contexts/NotificationContext';

interface UploadModalProps {
  onClose: () => void;
  onUploadSuccess: () => void;
  projects: Project[];
}

const soundtrackTypes: SoundtrackType[] = ['Background Music', 'Licensed Track', 'Score Cue', 'Sound Design Element', 'Foley'];

const UploadSoundtrackModal: React.FC<UploadModalProps> = ({ onClose, onUploadSuccess, projects }) => {
    const [file, setFile] = useState<File | null>(null);
    const [formState, setFormState] = useState({
        title: '',
        type: 'Background Music' as SoundtrackType,
        composer: '',
        licenseInfo: '',
        productionIds: [] as string[],
    });
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const { addNotification } = useNotification();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            if (!formState.title) {
                setFormState(prev => ({ ...prev, title: e.target.files![0].name.replace(/\.[^/.]+$/, "") }));
            }
        }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'productionIds') {
            const options = (e.target as HTMLSelectElement).options;
            const selectedValues: string[] = [];
            for (let i = 0, l = options.length; i < l; i++) {
                if (options[i].selected) {
                    selectedValues.push(options[i].value);
                }
            }
            setFormState(prev => ({ ...prev, productionIds: selectedValues }));
        } else {
            setFormState(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !formState.title) {
            setError('Please select a file and provide a title.');
            return;
        }
        setIsUploading(true);
        setError('');
        try {
            await uploadSoundtrackFile(file, formState);
            addNotification('success', 'Upload Successful', `Soundtrack "${formState.title}" uploaded!`);
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
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-lg shadow-2xl w-full max-w-2xl relative text-[var(--text-primary)]">
                <button onClick={onClose} aria-label="Close modal" className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-2xl">&times;</button>
                <h2 className="text-2xl font-bold mb-6 text-center">Add New Soundtrack</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="file-input" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Audio File</label>
                        <input id="file-input" type="file" onChange={handleFileChange} accept="audio/*" className="w-full text-sm text-[var(--text-secondary)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--primary-color)] file:text-gray-900 hover:file:brightness-110" required />
                    </div>
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Title</label>
                        <input id="title" name="title" type="text" value={formState.title} onChange={handleChange} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]" required />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="composer" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Composer / Artist</label>
                            <input id="composer" name="composer" type="text" value={formState.composer} onChange={handleChange} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]" required />
                        </div>
                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Type</label>
                            <select id="type" name="type" value={formState.type} onChange={handleChange} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]" required>
                                {soundtrackTypes.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="licenseInfo" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">License Information</label>
                        <textarea id="licenseInfo" name="licenseInfo" value={formState.licenseInfo} onChange={handleChange} rows={3} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]" required />
                    </div>
                    <div>
                        <label htmlFor="productionIds" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Associated Production(s)</label>
                        <select multiple id="productionIds" name="productionIds" value={formState.productionIds} onChange={handleChange} className="w-full h-32 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]" required>
                            {projects.map(p => <option key={p.$id} value={p.$id}>{p.title}</option>)}
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

export default UploadSoundtrackModal;
