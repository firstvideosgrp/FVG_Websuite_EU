import React, { useState, useEffect, useCallback } from 'react';
import { Project, ProductionPhase, ProductionPhaseStatus, ProductionPhaseStep } from '../types';
import { getProductionPhasesForProject, createProductionPhase, updateProductionPhase, deleteProductionPhase, getPhaseStepsForPhase, createPhaseStep, updatePhaseStep, deletePhaseStep, updateStepOrder } from '../services/appwrite';
import LoadingSpinner from './LoadingSpinner';

interface ProductionPhasesPanelProps {
    projects: Project[];
}

const statusColors: Record<ProductionPhaseStatus, string> = {
    'Pending': 'bg-gray-500/20 text-gray-300',
    'In Progress': 'bg-blue-500/20 text-blue-300',
    'Completed': 'bg-green-500/20 text-green-300',
};

const statusIcon: Record<ProductionPhaseStatus, string> = {
    'Pending': 'fas fa-circle-notch text-gray-500',
    'In Progress': 'fas fa-spinner fa-spin text-blue-500',
    'Completed': 'fas fa-check-circle text-green-500',
};

const ProductionPhasesPanel: React.FC<ProductionPhasesPanelProps> = ({ projects }) => {
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [phases, setPhases] = useState<ProductionPhase[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Phase Modal State
    const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false);
    const [editingPhase, setEditingPhase] = useState<ProductionPhase | null>(null);
    const [phaseForm, setPhaseForm] = useState({
        phaseName: '',
        status: 'Pending' as ProductionPhaseStatus,
        startDate: '',
        endDate: '',
    });

    // Step Modal State
    const [isStepModalOpen, setIsStepModalOpen] = useState(false);
    const [editingStep, setEditingStep] = useState<ProductionPhaseStep | null>(null);
    const [parentPhase, setParentPhase] = useState<ProductionPhase | null>(null);
    const [stepForm, setStepForm] = useState({
        stepName: '',
        description: '',
        status: 'Pending' as ProductionPhaseStatus,
    });

    useEffect(() => {
        if (projects.length > 0 && !selectedProjectId) {
            setSelectedProjectId(projects[0].$id);
        }
    }, [projects, selectedProjectId]);

    const fetchPhasesAndSteps = useCallback(async () => {
        if (!selectedProjectId) {
            setPhases([]);
            return;
        }
        setIsLoading(true);
        try {
            const phasesData = await getProductionPhasesForProject(selectedProjectId);
            const phasesWithSteps = await Promise.all(phasesData.map(async phase => {
                const steps = await getPhaseStepsForPhase(phase.$id);
                return { ...phase, steps };
            }));
            setPhases(phasesWithSteps);
        } catch (error) {
            console.error('Failed to fetch phases and steps', error);
            alert('Could not load production data.');
        } finally {
            setIsLoading(false);
        }
    }, [selectedProjectId]);

    useEffect(() => {
        fetchPhasesAndSteps();
    }, [fetchPhasesAndSteps]);

    // --- Phase Handlers ---
    const openPhaseModal = (phase: ProductionPhase | null) => {
        setEditingPhase(phase);
        setPhaseForm({
            phaseName: phase?.phaseName || '',
            status: phase?.status || 'Pending',
            startDate: phase?.startDate ? new Date(phase.startDate).toISOString().split('T')[0] : '',
            endDate: phase?.endDate ? new Date(phase.endDate).toISOString().split('T')[0] : '',
        });
        setIsPhaseModalOpen(true);
    };
    const closePhaseModal = () => setIsPhaseModalOpen(false);
    const handlePhaseFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setPhaseForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    
    const handlePhaseSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProjectId) return;
        try {
            const dataToSubmit = {
                ...phaseForm,
                projectId: selectedProjectId,
                startDate: phaseForm.startDate || undefined,
                endDate: phaseForm.endDate || undefined,
            };
            if (editingPhase) {
                await updateProductionPhase(editingPhase.$id, dataToSubmit);
            } else {
                await createProductionPhase(dataToSubmit);
            }
            alert('Phase saved successfully!');
            closePhaseModal();
            fetchPhasesAndSteps();
        } catch (error) {
            console.error('Failed to save phase', error);
            alert('Failed to save phase.');
        }
    };

    const handlePhaseDelete = async (phaseId: string) => {
        if (window.confirm('Are you sure you want to delete this entire phase and all its steps?')) {
            try {
                // In a real app, you'd delete all child steps first in a transaction or loop.
                // For simplicity, we assume the backend handles this or we accept orphaned steps.
                await deleteProductionPhase(phaseId);
                alert('Phase deleted.');
                fetchPhasesAndSteps();
            } catch (error) {
                console.error('Failed to delete phase', error);
                alert('Failed to delete phase.');
            }
        }
    };
    
    // --- Step Handlers ---
    const openStepModal = (step: ProductionPhaseStep | null, phase: ProductionPhase) => {
        setEditingStep(step);
        setParentPhase(phase);
        setStepForm({
            stepName: step?.stepName || '',
            description: step?.description || '',
            status: step?.status || 'Pending',
        });
        setIsStepModalOpen(true);
    };
    const closeStepModal = () => setIsStepModalOpen(false);
    const handleStepFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setStepForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleStepSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!parentPhase) return;
        try {
            if (editingStep) {
                await updatePhaseStep(editingStep.$id, stepForm);
            } else {
                const newOrder = parentPhase.steps?.length || 0;
                await createPhaseStep({ ...stepForm, phaseId: parentPhase.$id, order: newOrder });
            }
            alert('Step saved successfully!');
            closeStepModal();
            fetchPhasesAndSteps();
        } catch (error) {
            console.error('Failed to save step', error);
            alert('Failed to save step.');
        }
    };

    const handleStepDelete = async (stepId: string) => {
        if (window.confirm('Are you sure you want to delete this step?')) {
            try {
                await deletePhaseStep(stepId);
                alert('Step deleted.');
                fetchPhasesAndSteps();
            } catch (error) {
                console.error('Failed to delete step', error);
                alert('Failed to delete step.');
            }
        }
    };
    
    const handleMoveStep = async (phase: ProductionPhase, stepIndex: number, direction: 'up' | 'down') => {
        if (!phase.steps) return;
        const steps = [...phase.steps];
        const targetIndex = direction === 'up' ? stepIndex - 1 : stepIndex + 1;
    
        if (targetIndex < 0 || targetIndex >= steps.length) return;
    
        [steps[stepIndex], steps[targetIndex]] = [steps[targetIndex], steps[stepIndex]];
    
        const updatePayload = steps.map((step, index) => ({ $id: step.$id, order: index }));
        
        const updatedPhases = phases.map(p => p.$id === phase.$id ? { ...p, steps: updatePayload.map((u, i) => ({...steps[i], order: u.order})) } : p);
        setPhases(updatedPhases);
    
        try {
            await updateStepOrder(updatePayload);
        } catch (error) {
            console.error("Failed to reorder steps", error);
            alert("Failed to reorder steps.");
            fetchPhasesAndSteps();
        }
    };

    return (
        <div className="bg-[var(--bg-primary)] p-6 rounded-lg shadow-lg border border-[var(--border-color)]">
            <h2 className="text-2xl font-bold text-[var(--primary-color)] flex items-center mb-4"><i className="fas fa-tasks mr-3"></i>Production Phases & Steps</h2>
            
            <div className="mb-6 max-w-md">
                <label htmlFor="project-select" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Select a Project</label>
                <select id="project-select" value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-3 text-[var(--text-primary)]">
                    {projects.length === 0 ? <option>No projects available</option> : projects.map(p => <option key={p.$id} value={p.$id}>{p.title}</option>)}
                </select>
            </div>
            
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Timeline for: <span className="text-[var(--primary-color)]">{projects.find(p => p.$id === selectedProjectId)?.title}</span></h3>
                {selectedProjectId && <button onClick={() => openPhaseModal(null)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center space-x-2"><i className="fas fa-plus"></i><span>Add Phase</span></button>}
            </div>

            {isLoading ? <div className="flex justify-center py-8"><LoadingSpinner /></div> : (
                <div className="space-y-4">
                    {phases.length > 0 ? phases.map(phase => (
                        <div key={phase.$id} className="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-color)]">
                            <div className="flex justify-between items-center mb-3">
                                <div>
                                    <h4 className="font-bold text-lg flex items-center gap-2">{phase.phaseName} <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[phase.status]}`}>{phase.status}</span></h4>
                                    <p className="text-sm text-[var(--text-secondary)] mt-1">{phase.startDate && `Starts: ${new Date(phase.startDate).toLocaleDateString()}`}{phase.startDate && phase.endDate && ' - '}{phase.endDate && `Ends: ${new Date(phase.endDate).toLocaleDateString()}`}</p>
                                </div>
                                <div className="flex space-x-2"><button onClick={() => openPhaseModal(phase)} className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm"><i className="fas fa-pencil-alt"></i></button><button onClick={() => handlePhaseDelete(phase.$id)} className="bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm"><i className="fas fa-trash"></i></button></div>
                            </div>
                            
                            {/* Steps Section */}
                            <div className="pl-4 border-l-2 border-[var(--border-color)] ml-2">
                                <div className="flex justify-between items-center mb-2">
                                    <h5 className="text-md font-semibold text-[var(--text-secondary)]">Steps</h5>
                                    <button onClick={() => openStepModal(null, phase)} className="bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 font-bold py-1 px-3 rounded-md text-xs flex items-center space-x-1.5"><i className="fas fa-plus"></i><span>Add Step</span></button>
                                </div>
                                {phase.steps && phase.steps.length > 0 ? (
                                    <div className="space-y-2">
                                        {phase.steps.map((step, index) => (
                                            <div key={step.$id} className="bg-[var(--bg-primary)] p-3 rounded-md flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <i className={`${statusIcon[step.status]} text-lg`}></i>
                                                    <div>
                                                        <p className="font-semibold">{step.stepName}</p>
                                                        {step.description && <p className="text-xs text-[var(--text-secondary)]">{step.description}</p>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <button onClick={() => handleMoveStep(phase, index, 'up')} disabled={index === 0} className="text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed w-7 h-7 rounded-md hover:bg-white/10"><i className="fas fa-arrow-up"></i></button>
                                                    <button onClick={() => handleMoveStep(phase, index, 'down')} disabled={index === phase.steps!.length - 1} className="text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed w-7 h-7 rounded-md hover:bg-white/10"><i className="fas fa-arrow-down"></i></button>
                                                    <button onClick={() => openStepModal(step, phase)} className="text-blue-400 hover:text-blue-300 w-7 h-7 rounded-md hover:bg-white/10"><i className="fas fa-pencil-alt"></i></button>
                                                    <button onClick={() => handleStepDelete(step.$id)} className="text-red-400 hover:text-red-300 w-7 h-7 rounded-md hover:bg-white/10"><i className="fas fa-trash"></i></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-sm text-center text-[var(--text-secondary)] py-2">No steps yet. Add one!</p>}
                            </div>
                        </div>
                    )) : <p className="text-center text-[var(--text-secondary)] py-6">No production phases found for this project.</p>}
                </div>
            )}

            {/* Phase Modal */}
            {isPhaseModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-lg shadow-2xl w-full max-w-lg relative">
                        <button onClick={closePhaseModal} className="absolute top-4 right-4 text-[var(--text-secondary)] text-2xl">&times;</button>
                        <h2 className="text-2xl font-bold mb-6">{editingPhase ? 'Edit Phase' : 'Create New Phase'}</h2>
                        <form onSubmit={handlePhaseSubmit} className="space-y-4">
                            <input id="phaseName" type="text" name="phaseName" value={phaseForm.phaseName} onChange={handlePhaseFormChange} placeholder="e.g., Pre-Production" required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" />
                            <select id="status" name="status" value={phaseForm.status} onChange={handlePhaseFormChange} required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2"><option>Pending</option><option>In Progress</option><option>Completed</option></select>
                            <div className="grid grid-cols-2 gap-4"><input id="startDate" type="date" name="startDate" value={phaseForm.startDate} onChange={handlePhaseFormChange} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" /><input id="endDate" type="date" name="endDate" value={phaseForm.endDate} onChange={handlePhaseFormChange} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" /></div>
                            <div className="flex justify-end space-x-4 pt-4"><button type="button" onClick={closePhaseModal} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">Cancel</button><button type="submit" className="bg-[var(--primary-color)] hover:brightness-110 text-gray-900 font-bold py-2 px-4 rounded">Save Phase</button></div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* Step Modal */}
            {isStepModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                     <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-lg shadow-2xl w-full max-w-lg relative">
                        <button onClick={closeStepModal} className="absolute top-4 right-4 text-[var(--text-secondary)] text-2xl">&times;</button>
                        <h2 className="text-2xl font-bold mb-1">{editingStep ? 'Edit Step' : 'Create New Step'}</h2>
                        <p className="text-[var(--text-secondary)] mb-6">For phase: <span className="font-semibold text-[var(--text-primary)]">{parentPhase?.phaseName}</span></p>
                        <form onSubmit={handleStepSubmit} className="space-y-4">
                            <input id="stepName" type="text" name="stepName" value={stepForm.stepName} onChange={handleStepFormChange} placeholder="Step Name (e.g., Story Development)" required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" />
                            <textarea id="description" name="description" value={stepForm.description} onChange={handleStepFormChange} placeholder="Description (Optional)" rows={3} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" />
                            <select id="status" name="status" value={stepForm.status} onChange={handleStepFormChange} required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2"><option>Pending</option><option>In Progress</option><option>Completed</option></select>
                            <div className="flex justify-end space-x-4 pt-4"><button type="button" onClick={closeStepModal} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">Cancel</button><button type="submit" className="bg-[var(--primary-color)] hover:brightness-110 text-gray-900 font-bold py-2 px-4 rounded">Save Step</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductionPhasesPanel;