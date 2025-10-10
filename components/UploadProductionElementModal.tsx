import React, { useState } from 'react';
import { uploadProductionElementFile } from '../services/appwrite';
import type { ProductionElementType, Project } from '../types';
import { useNotification } from '../contexts/NotificationContext';

interface UploadModalProps {
  onClose: () => void;
  onUploadSuccess: () => void;
  projects: Project[];
}

const elementTypes: ProductionElementType[] = ['Production Image', 'Soundtrack', 'Logo', 'Document', 'Behind-the-Scenes'];

const UploadProductionElementModal: React.FC<UploadModalProps> = ({ onClose, onUploadSuccess, projects }) => {
    const [file, setFile] = useState<File | null>(null);
    const [elementName, setElementName] = useState('');
    const [elementType, setElementType] = useState<ProductionElementType>('Production Image');
    const [projectId, setProjectId] = useState<string>('');
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const { addNotification } = useNotification();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            if (!elementName) {
                // Pre-fill name from filename, removing extension
                setElementName(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !elementName) {
            setError('Please select a file and provide an element name.');
            return;
        }
        setIsUploading(true);
        setError('');
        try {
            const data = {
                elementName,
                elementType,
                projectId: projectId || undefined,
            };
            await uploadProductionElementFile(file, data);
            addNotification('success', 'Upload Successful', `Element "${elementName}" uploaded successfully!`);
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
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-lg shadow-2xl w-full max-w-lg relative text-[var(--text-primary)]">
                <button onClick={onClose} aria-label="Close modal" className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-2xl">&times;</button>
                <h2 className="text-2xl font-bold mb-6 text-center">Add New Production Element</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="file-input" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">File</label>
                        <input id="file-input" type="file" onChange={handleFileChange} className="w-full text-sm text-[var(--text-secondary)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--primary-color)] file:text-gray-900 hover:file:brightness-110" required />
                    </div>
                    <div>
                        <label htmlFor="element-name" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Element Name</label>
                        <input id="element-name" type="text" value={elementName} onChange={e => setElementName(e.target.value)} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]" required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="element-type" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Element Type</label>
                            <select id="element-type" value={elementType} onChange={e => setElementType(e.target.value as ProductionElementType)} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]" required>
                                {elementTypes.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="project-id" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Linked Project (Optional)</label>
                            <select id="project-id" value={projectId} onChange={e => setProjectId(e.target.value)} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]">
                                <option value="">None</option>
                                {projects.map(p => <option key={p.$id} value={p.$id}>{p.title}</option>)}
                            </select>
                        </div>
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

export default UploadProductionElementModal;