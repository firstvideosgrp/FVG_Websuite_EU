
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Models } from 'appwrite';
import * as api from '../services/appwrite';
import { Project, ProductionStageName, CrewMember, Department } from '../types';
import LoadingSpinner from './LoadingSpinner';
import StageDetailsModal from './StageDetailsModal';
import { useNotification } from '../contexts/NotificationContext';

interface ProductionStagesDashboardProps {
    user: Models.User<Models.Preferences>;
    onLogout: () => void;
}

const STAGES: ProductionStageName[] = ['Development', 'Pre-Production', 'Shooting', 'Post-Production', 'Released'];

const stageColors: Record<ProductionStageName, { bg: string, text: string, border: string }> = {
    'Development': { bg: 'bg-purple-500/10', text: 'text-purple-300', border: 'border-purple-500' },
    'Pre-Production': { bg: 'bg-yellow-500/10', text: 'text-yellow-300', border: 'border-yellow-500' },
    'Shooting': { bg: 'bg-red-500/10', text: 'text-red-300', border: 'border-red-500' },
    'Post-Production': { bg: 'bg-blue-500/10', text: 'text-blue-300', border: 'border-blue-500' },
    'Released': { bg: 'bg-green-500/10', text: 'text-green-300', border: 'border-green-500' },
};

const StatCard: React.FC<{ icon: string; value: string | number; label: string; color: string; }> = ({ icon, value, label, color }) => (
    <div className="bg-[var(--bg-card)] p-5 rounded-lg shadow-lg border border-[var(--border-color)] flex items-center space-x-4">
        <div className={`text-3xl w-14 h-14 flex items-center justify-center rounded-lg ${color}`}>
            <i className={icon}></i>
        </div>
        <div>
            <p className="text-3xl font-bold text-[var(--text-primary)]">{value}</p>
            <p className="text-sm text-[var(--text-secondary)]">{label}</p>
        </div>
    </div>
);

const ProductionStagesDashboard: React.FC<ProductionStagesDashboardProps> = ({ user, onLogout }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [allCrew, setAllCrew] = useState<CrewMember[]>([]);
    const [allDepartments, setAllDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);
    const { addNotification } = useNotification();

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [projectsData, crewData, departmentsData] = await Promise.all([
                api.getProjects(),
                api.getCrew(),
                api.getDepartments(),
            ]);
            setProjects(projectsData);
            setAllCrew(crewData);
            setAllDepartments(departmentsData);
        } catch (error) {
            console.error("Failed to load dashboard data", error);
            addNotification('error', 'Load Failed', 'Could not load production data.');
        } finally {
            setIsLoading(false);
        }
    }, [addNotification]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const projectsByStage = useMemo(() => {
        const grouped = new Map<ProductionStageName, Project[]>();
        STAGES.forEach(stage => grouped.set(stage, []));
        projects.forEach(project => {
            const stage = project.productionStage || 'Development';
            grouped.get(stage)?.push(project);
        });
        return grouped;
    }, [projects]);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, project: Project) => {
        setDraggedProjectId(project.$id);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', project.$id);
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, newStage: ProductionStageName) => {
        e.preventDefault();
        const projectId = e.dataTransfer.getData('text/plain');
        const project = projects.find(p => p.$id === projectId);
        
        if (project && project.productionStage !== newStage) {
            // Optimistic UI update
            const updatedProjects = projects.map(p => 
                p.$id === projectId ? { ...p, productionStage: newStage } : p
            );
            setProjects(updatedProjects);

            try {
                await api.updateProject(projectId, { productionStage: newStage });
                addNotification('success', 'Stage Updated', `Moved "${project.title}" to ${newStage}.`);
            } catch (error) {
                // Revert on failure
                addNotification('error', 'Update Failed', 'Could not update project stage.');
                setProjects(projects);
            }
        }
        setDraggedProjectId(null);
    };

    const handleProjectUpdate = (updatedProject: Project) => {
        setProjects(prev => prev.map(p => p.$id === updatedProject.$id ? updatedProject : p));
        fetchData(); // Full refresh to ensure consistency
    };

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen"><LoadingSpinner /></div>;
    }

    return (
        <div className="p-4 md:p-8">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Production Stages</h1>
                    <p className="text-[var(--text-secondary)]">Track and manage all productions at a glance.</p>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/production-hub" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--primary-color)] transition-colors">
                        <i className="fas fa-arrow-left mr-2"></i>Back to Hub
                    </Link>
                    <button onClick={onLogout} className="bg-red-600/20 text-red-300 hover:bg-red-600 hover:text-white font-bold py-2 px-4 rounded transition-colors text-sm">
                        Logout
                    </button>
                </div>
            </header>

            <section className="mb-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {STAGES.map(stage => (
                    <StatCard
                        key={stage}
                        icon="fas fa-film"
                        value={projectsByStage.get(stage)?.length || 0}
                        label={stage}
                        color={`${stageColors[stage].bg} ${stageColors[stage].text}`}
                    />
                ))}
            </section>
            
            <section className="flex gap-4 overflow-x-auto pb-4">
                {STAGES.map(stage => (
                    <div 
                        key={stage}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, stage)}
                        className={`min-w-[300px] w-1/5 bg-[var(--bg-primary)] rounded-lg border-2 border-dashed border-transparent transition-colors ${draggedProjectId ? 'border-[var(--border-color)]' : ''}`}
                    >
                        <h3 className={`font-bold text-lg p-3 border-b-4 ${stageColors[stage].border} ${stageColors[stage].text} sticky top-0 bg-[var(--bg-primary)] rounded-t-lg`}>
                            {stage} ({projectsByStage.get(stage)?.length || 0})
                        </h3>
                        <div className="p-3 space-y-3 h-[calc(100vh-350px)] overflow-y-auto">
                            {projectsByStage.get(stage)?.map(project => (
                                <div
                                    key={project.$id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, project)}
                                    onDragEnd={() => setDraggedProjectId(null)}
                                    onClick={() => setEditingProject(project)}
                                    className={`bg-[var(--bg-card)] p-3 rounded-md shadow-md border-l-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${stageColors[project.productionStage || 'Development'].border} ${draggedProjectId === project.$id ? 'opacity-50 scale-95' : 'opacity-100'}`}
                                >
                                    <p className="font-bold text-[var(--text-primary)]">{project.title}</p>
                                    <p className="text-xs text-[var(--text-secondary)] mt-1">{project.projectType} &bull; {project.releaseYear}</p>
                                    {project.dueDate && <p className="text-xs text-yellow-400 font-semibold mt-2"><i className="far fa-calendar-alt mr-1.5"></i>Due: {new Date(project.dueDate).toLocaleDateString()}</p>}
                                    <div className="w-full bg-[var(--bg-secondary)] rounded-full h-1.5 mt-3">
                                        <div className="bg-[var(--primary-color)] h-1.5 rounded-full" style={{ width: `${project.stageProgress || 0}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </section>

            {editingProject && (
                <StageDetailsModal
                    project={editingProject}
                    allCrew={allCrew}
                    allDepartments={allDepartments}
                    onClose={() => setEditingProject(null)}
                    onSave={handleProjectUpdate}
                />
            )}
        </div>
    );
};

export default ProductionStagesDashboard;
