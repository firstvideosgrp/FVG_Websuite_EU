import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { ProductionElementFile, ProductionElementType, Project } from '../types';
import * as api from '../services/appwrite';
import LoadingSpinner from './LoadingSpinner';
import UploadProductionElementModal from './UploadProductionElementModal';
import { useNotification } from '../contexts/NotificationContext';
import { useConfirmation } from '../contexts/ConfirmationDialogContext';

interface ProductionElementsPanelProps {
    projects: Project[];
}

const elementTypes: ProductionElementType[] = ['Production Image', 'Soundtrack', 'Logo', 'Document', 'Behind-the-Scenes'];

const ProductionElementsPanel: React.FC<ProductionElementsPanelProps> = ({ projects }) => {
    const [elements, setElements] = useState<ProductionElementFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { addNotification } = useNotification();
    const { confirm } = useConfirmation();

    const [editingElement, setEditingElement] = useState<ProductionElementFile | null>(null);
    const [editForm, setEditForm] = useState({ elementName: '', elementType: 'Document' as ProductionElementType, projectId: '' });
    const [isUpdating, setIsUpdating] = useState(false);

    // New state for filtering
    const [filterProjectId, setFilterProjectId] = useState<string>('');
    const [showUnlinked, setShowUnlinked] = useState<boolean>(false);

    const projectsMap = useMemo(() => new Map(projects.map(p => [p.$id, p.title])), [projects]);

    const fetchElements = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const elementList = await api.listProductionElementFiles();
            setElements(elementList);
        } catch (err) {
            setError('Failed to load production elements.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchElements();
    }, [fetchElements]);

    // Set default project filter
    useEffect(() => {
        if (projects.length > 0 && !filterProjectId) {
            setFilterProjectId(projects[0].$id);
        }
    }, [projects, filterProjectId]);
    
    useEffect(() => {
        if (editingElement) {
            setEditForm({ 
                elementName: editingElement.elementName, 
                elementType: editingElement.elementType,
                projectId: editingElement.projectId || ''
            });
        }
    }, [editingElement]);

    const filteredElements = useMemo(() => {
        return elements.filter(element => {
            const projectMatch = filterProjectId && element.projectId === filterProjectId;
            const unlinkedMatch = showUnlinked && !element.projectId;
            return projectMatch || unlinkedMatch;
        });
    }, [elements, filterProjectId, showUnlinked]);

    const handleDeleteElement = async (element: ProductionElementFile) => {
        const isConfirmed = await confirm({
            title: 'Confirm Deletion',
            message: `Are you sure you want to permanently delete the element "${element.elementName}"? This action cannot be undone.`,
            confirmText: 'Delete Element',
            confirmStyle: 'destructive'
        });

        if (!isConfirmed) return;

        try {
            await api.deleteProductionElementFile(element.$id);
            setElements(prev => prev.filter(f => f.$id !== element.$id));
            addNotification('info', 'Element Deleted', `"${element.elementName}" has been deleted.`);
        } catch (err) {
            addNotification('error', 'Delete Failed', 'Failed to delete element.');
            console.error(err);
        }
    };
    
    const copyToClipboard = (fileId: string) => {
        const url = api.getProductionElementFilePreviewUrl(fileId);
        navigator.clipboard.writeText(url).then(() => {
            addNotification('success', 'Copied!', 'URL copied to clipboard.');
        }, () => {
            addNotification('error', 'Copy Failed', 'Could not copy URL to clipboard.');
        });
    };
    
    const openEditModal = (element: ProductionElementFile) => {
        setEditingElement(element);
        setError(null);
    };

    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingElement) return;

        setIsUpdating(true);
        setError(null);
        try {
            const dataToSubmit = { ...editForm, projectId: editForm.projectId || undefined };
            await api.updateProductionElement(editingElement.$id, dataToSubmit);
            addNotification('success', 'Element Updated', `Details for "${editForm.elementName}" updated successfully.`);
            setEditingElement(null);
            await fetchElements();
        } catch (err) {
            setError('Failed to update element details.');
            console.error(err);
        } finally {
            setIsUpdating(false);
        }
    };

    const getIconForType = (type: ProductionElementType) => {
        switch(type) {
            case 'Soundtrack': return 'fas fa-music';
            case 'Logo': return 'fas fa-gem';
            case 'Document': return 'fas fa-file-alt';
            case 'Behind-the-Scenes': return 'fas fa-video';
            case 'Production Image':
            default:
                return 'fas fa-image';
        }
    };

    return (
        <div className="bg-[var(--bg-primary)] p-6 rounded-lg shadow-lg border border-[var(--border-color)]">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[var(--primary-color)] flex items-center">
                    <i className="fas fa-archive mr-3"></i>Production Elements Library
                </h2>
                <div>
                     <button onClick={() => setIsUploadModalOpen(true)} className="cursor-pointer bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors flex items-center space-x-2">
                        <i className="fas fa-plus"></i><span>Add New Element</span>
                    </button>
                </div>
            </div>

            <div className="mb-6 p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] flex flex-col md:flex-row items-center gap-4">
                <div className="flex-grow w-full md:w-auto">
                    <label htmlFor="project-filter" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Filter by Production</label>
                    <select
                        id="project-filter"
                        value={filterProjectId}
                        onChange={(e) => setFilterProjectId(e.target.value)}
                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]"
                    >
                        {projects.length === 0 ? <option>No projects available</option> : projects.map(p => (
                            <option key={p.$id} value={p.$id}>{p.title}</option>
                        ))}
                    </select>
                </div>
                <div className="self-center md:self-end pt-4 md:pt-0">
                    <label htmlFor="show-unlinked" className="flex items-center space-x-2 text-sm font-medium text-[var(--text-secondary)] cursor-pointer">
                        <input
                            type="checkbox"
                            id="show-unlinked"
                            checked={showUnlinked}
                            onChange={(e) => setShowUnlinked(e.target.checked)}
                            className="h-4 w-4 rounded bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--primary-color)] focus:ring-[var(--primary-color)]"
                        />
                        <span>Show Unlinked Elements</span>
                    </label>
                </div>
            </div>
            
            {error && !editingElement && <div className="bg-red-500 text-white p-3 rounded-md mb-4">{error}</div>}

            {isLoading ? (
                <div className="flex justify-center items-center py-10">
                    <LoadingSpinner />
                </div>
            ) : filteredElements.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredElements.map(element => {
                        const isImage = element.elementType === 'Production Image' || element.elementType === 'Logo' || element.elementType === 'Behind-the-Scenes';
                        return (
                        <div key={element.$id} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg overflow-hidden group relative flex flex-col">
                            <div className="w-full h-40 bg-[var(--bg-primary)] flex items-center justify-center">
                                {isImage ? (
                                     <img src={api.getProductionElementFilePreviewUrl(element.$id)} alt={element.elementName} className="w-full h-full object-cover" loading="lazy" />
                                ) : (
                                     <i className={`${getIconForType(element.elementType)} text-6xl text-[var(--text-secondary)]`}></i>
                                )}
                            </div>
                            <div className="p-3 text-left flex-grow flex flex-col">
                                <p className="font-bold text-sm text-[var(--text-primary)] truncate" title={element.elementName}>{element.elementName}</p>
                                <p className="text-xs text-[var(--text-secondary)] mt-1">{element.elementType}</p>
                                <p className="text-xs text-[var(--primary-color)] mt-1 truncate" title={projectsMap.get(element.projectId || '')}>
                                    <i className="fas fa-film mr-1.5"></i>
                                    {element.projectId ? projectsMap.get(element.projectId) : 'Unlinked'}
                                </p>
                            </div>
                             <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-4">
                                <div className="w-full space-y-2">
                                    <button onClick={() => openEditModal(element)} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-2 rounded text-sm">Edit Details</button>
                                    <button onClick={() => copyToClipboard(element.$id)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded text-sm">Copy URL</button>
                                    <button onClick={() => handleDeleteElement(element)} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-2 rounded text-sm">Delete</button>
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
            ) : (
                <p className="text-center text-[var(--text-secondary)] py-10">No production elements found for the selected filter. Try another production or show unlinked elements.</p>
            )}

            {isUploadModalOpen && (
                <UploadProductionElementModal 
                    onClose={() => setIsUploadModalOpen(false)} 
                    onUploadSuccess={() => {
                        setIsUploadModalOpen(false);
                        fetchElements();
                    }}
                    projects={projects}
                />
            )}
            
            {editingElement && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4" role="dialog" aria-modal="true">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-lg shadow-2xl w-full max-w-md relative text-[var(--text-primary)]">
                        <button onClick={() => setEditingElement(null)} aria-label="Close modal" className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-2xl">&times;</button>
                        <h2 className="text-2xl font-bold mb-6 text-center">Edit Element</h2>
                        <form onSubmit={handleUpdateSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="edit-name" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Element Name</label>
                                <input id="edit-name" type="text" value={editForm.elementName} onChange={e => setEditForm(prev => ({ ...prev, elementName: e.target.value }))} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]" required />
                            </div>
                            <div>
                                <label htmlFor="edit-type" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Element Type</label>
                                <select id="edit-type" value={editForm.elementType} onChange={e => setEditForm(prev => ({ ...prev, elementType: e.target.value as ProductionElementType }))} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]" required>
                                    {elementTypes.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="edit-project" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Linked Project (Optional)</label>
                                <select id="edit-project" value={editForm.projectId} onChange={e => setEditForm(prev => ({ ...prev, projectId: e.target.value }))} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]">
                                    <option value="">None (Unlinked)</option>
                                    {projects.map(p => <option key={p.$id} value={p.$id}>{p.title}</option>)}
                                </select>
                            </div>
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                            <div className="flex justify-end space-x-4 pt-4">
                                <button type="button" onClick={() => setEditingElement(null)} disabled={isUpdating} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50">Cancel</button>
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

export default ProductionElementsPanel;