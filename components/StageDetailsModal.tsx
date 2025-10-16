
import React, { useState } from 'react';
import type { Project, CrewMember, Department } from '../types';
import * as api from '../services/appwrite';
import { useNotification } from '../contexts/NotificationContext';
import LoadingSpinner from './LoadingSpinner';

interface StageDetailsModalProps {
    project: Project;
    allCrew: CrewMember[];
    allDepartments: Department[];
    onClose: () => void;
    onSave: (updatedProject: Project) => void;
}

const StageDetailsModal: React.FC<StageDetailsModalProps> = ({ project, allCrew, allDepartments, onClose, onSave }) => {
    const { addNotification } = useNotification();
    const [isSaving, setIsSaving] = useState(false);
    const [formState, setFormState] = useState({
        stageProgress: project.stageProgress || 0,
        stageStartDate: project.stageStartDate ? new Date(project.stageStartDate).toISOString().split('T')[0] : '',
        stageEndDate: project.stageEndDate ? new Date(project.stageEndDate).toISOString().split('T')[0] : '',
        stageAssignedDeptIds: project.stageAssignedDeptIds || [],
        stageLeadCrewId: project.stageLeadCrewId || '',
        stageNotes: project.stageNotes || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'select-multiple') {
            const options = (e.target as HTMLSelectElement).options;
            const selectedValues: string[] = [];
            for (let i = 0, l = options.length; i < l; i++) {
                if (options[i].selected) {
                    selectedValues.push(options[i].value);
                }
            }
            setFormState(prev => ({ ...prev, [name]: selectedValues }));
        } else {
             setFormState(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const dataToSubmit = {
                ...formState,
                stageProgress: Number(formState.stageProgress),
                stageStartDate: formState.stageStartDate || undefined,
                stageEndDate: formState.stageEndDate || undefined,
                stageLeadCrewId: formState.stageLeadCrewId || undefined,
                stageNotes: formState.stageNotes || undefined,
            };
            const updatedDoc = await api.updateProject(project.$id, dataToSubmit);
            onSave({ ...project, ...updatedDoc });
            addNotification('success', 'Stage Details Saved', `Details for "${project.title}" have been updated.`);
            onClose();
        } catch (error) {
            addNotification('error', 'Save Failed', 'Could not save stage details.');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col relative text-[var(--text-primary)]" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} aria-label="Close modal" className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-3xl">&times;</button>
                <header className="mb-4">
                    <h2 className="text-2xl font-bold">Stage Details: <span className="text-[var(--primary-color)]">{project.title}</span></h2>
                    <p className="text-md text-[var(--text-secondary)]">Current Stage: {project.productionStage || 'Development'}</p>
                </header>
                
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto pr-2 -mr-4 space-y-4">
                    <div>
                        <label htmlFor="stageProgress" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Progress: {formState.stageProgress}%</label>
                        <input type="range" id="stageProgress" name="stageProgress" min="0" max="100" value={formState.stageProgress} onChange={handleChange} className="w-full h-2 bg-[var(--bg-secondary)] rounded-lg appearance-none cursor-pointer accent-[var(--primary-color)]" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="stageStartDate" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Start Date</label>
                            <input type="date" id="stageStartDate" name="stageStartDate" value={formState.stageStartDate} onChange={handleChange} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" />
                        </div>
                         <div>
                            <label htmlFor="stageEndDate" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">End Date</label>
                            <input type="date" id="stageEndDate" name="stageEndDate" value={formState.stageEndDate} onChange={handleChange} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" />
                        </div>
                    </div>
                    
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="stageLeadCrewId" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Stage Lead</label>
                            <select id="stageLeadCrewId" name="stageLeadCrewId" value={formState.stageLeadCrewId} onChange={handleChange} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2">
                                <option value="">Select a Lead...</option>
                                {allCrew.map(c => <option key={c.$id} value={c.$id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="stageAssignedDeptIds" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Assigned Departments</label>
                        <select multiple id="stageAssignedDeptIds" name="stageAssignedDeptIds" value={formState.stageAssignedDeptIds} onChange={handleChange} className="w-full h-32 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2">
                            {allDepartments.map(d => <option key={d.$id} value={d.$id}>{d.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="stageNotes" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Notes / Status Update</label>
                        <textarea id="stageNotes" name="stageNotes" value={formState.stageNotes} onChange={handleChange} rows={4} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" placeholder="Add any relevant notes for this stage..."></textarea>
                    </div>
                </form>

                <div className="pt-6 border-t border-[var(--border-color)] mt-4 flex justify-end gap-4">
                    <button type="button" onClick={onClose} disabled={isSaving} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors">Cancel</button>
                    <button type="submit" onClick={handleSubmit} disabled={isSaving} className="bg-[var(--primary-color)] hover:brightness-110 text-gray-900 font-bold py-2 px-4 rounded transition-colors w-32 flex justify-center">
                        {isSaving ? <LoadingSpinner /> : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StageDetailsModal;
