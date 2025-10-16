
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Models } from 'appwrite';
import * as api from '../services/appwrite';
import { Project, ProductionStageName, CrewMember, Department, ProjectStatus } from '../types';
import LoadingSpinner from './LoadingSpinner';
import StageDetailsModal from './StageDetailsModal';
import { useNotification } from '../contexts/NotificationContext';

interface ProductionStagesDashboardProps {
    user: Models.User<Models.Preferences>;
    onLogout: () => void;
}

const STAGES: ProductionStageName[] = ['Development', 'Pre-Production', 'Shooting', 'Post-Production', 'Released'];

const stageColors: Record<ProductionStageName, { bg: string, text: string, border: string, ring: string }> = {
    'Development': { bg: 'bg-purple-500/10', text: 'text-purple-300', border: 'border-purple-500', ring: 'ring-purple-500' },
    'Pre-Production': { bg: 'bg-yellow-500/10', text: 'text-yellow-300', border: 'border-yellow-500', ring: 'ring-yellow-500' },
    'Shooting': { bg: 'bg-red-500/10', text: 'text-red-300', border: 'border-red-500', ring: 'ring-red-500' },
    'Post-Production': { bg: 'bg-blue-500/10', text: 'text-blue-300', border: 'border-blue-500', ring: 'ring-blue-500' },
    'Released': { bg: 'bg-green-500/10', text: 'text-green-300', border: 'border-green-500', ring: 'ring-green-500' },
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

const timeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)} years ago`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)} months ago`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)} days ago`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)} hours ago`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)} minutes ago`;
    return `${Math.floor(seconds)} seconds ago`;
};

const ProductionStagesDashboard: React.FC<ProductionStagesDashboardProps> = ({ user, onLogout }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [allCrew, setAllCrew] = useState<CrewMember[]>([]);
    const [allDepartments, setAllDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const { addNotification } = useNotification();

    const [filters, setFilters] = useState({ departmentId: '', status: '' });
    const [sort, setSort] = useState({ key: 'updatedAt', order: 'desc' });

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

    const crewMap = useMemo(() => new Map(allCrew.map(c => [c.$id, c])), [allCrew]);
    const departmentsMap = useMemo(() => new Map(allDepartments.map(d => [d.$id, d])), [allDepartments]);

    const filteredAndSortedProjects = useMemo(() => {
        let filtered = projects;
        if (filters.status) {
            filtered = filtered.filter(p => p.status === filters.status);
        }
        if (filters.departmentId) {
            filtered = filtered.filter(p => p.stageAssignedDeptIds?.includes(filters.departmentId));
        }

        return filtered.sort((a, b) => {
            const order = sort.order === 'asc' ? 1 : -1;
            switch (sort.key) {
                case 'title':
                    return a.title.localeCompare(b.title) * order;
                case 'progress':
                    return ((a.stageProgress || 0) - (b.stageProgress || 0)) * order;
                case 'updatedAt':
                    return (new Date(b.$updatedAt).getTime() - new Date(a.$updatedAt).getTime()) * order;
                default:
                    return 0;
            }
        });
    }, [projects, filters, sort]);

    const handleQuickStageChange = async (project: Project, newStage: ProductionStageName) => {
        const originalProjects = projects;
        const updatedProjects = projects.map(p => 
            p.$id === project.$id ? { ...p, productionStage: newStage } : p
        );
        setProjects(updatedProjects);

        try {
            await api.updateProject(project.$id, { productionStage: newStage });
            addNotification('success', 'Stage Updated', `Moved "${project.title}" to ${newStage}.`);
        } catch (error) {
            addNotification('error', 'Update Failed', 'Could not update project stage.');
            setProjects(originalProjects);
        }
    };
    
    const handleProjectUpdate = (updatedProject: Project) => {
        setProjects(prev => prev.map(p => p.$id === updatedProject.$id ? { ...p, ...updatedProject } : p));
        // No full fetchData to avoid jarring refresh
    };

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen"><LoadingSpinner /></div>;
    }

    const projectsByStage = new Map<ProductionStageName, Project[]>();
    STAGES.forEach(stage => projectsByStage.set(stage, []));
    projects.forEach(project => {
        const stage = project.productionStage || 'Development';
        projectsByStage.get(stage)?.push(project);
    });

    const SortableHeader: React.FC<{ label: string; sortKey: string; className?: string; }> = ({ label, sortKey, className }) => {
        const isActive = sort.key === sortKey;
        const isAsc = sort.order === 'asc';

        const handleClick = () => {
            if (isActive) {
                setSort({ key: sortKey, order: isAsc ? 'desc' : 'asc' });
            } else {
                setSort({ key: sortKey, order: 'desc' }); // Default to desc for date/progress
            }
        };

        return (
            <th scope="col" className={`px-4 py-3 ${className || ''}`}>
                <button onClick={handleClick} className="flex items-center gap-1.5 group font-semibold">
                    <span>{label}</span>
                    <i className={`fas fa-arrow-up text-xs transition-all ${isActive && isAsc ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}></i>
                    <i className={`fas fa-arrow-down text-xs transition-all ${isActive && !isAsc ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}></i>
                </button>
            </th>
        );
    };

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
            
            <section className="mb-6 p-4 bg-[var(--bg-card)] rounded-lg shadow-lg border border-[var(--border-color)] flex items-center gap-4 flex-wrap">
                <div className="flex-grow">
                    <label htmlFor="status-filter" className="text-xs font-medium text-[var(--text-secondary)]">Status</label>
                    <select id="status-filter" value={filters.status} onChange={e => setFilters(f => ({...f, status: e.target.value}))} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-sm mt-1">
                        <option value="">All Statuses</option>
                        {(['Upcoming', 'In Production', 'Released'] as ProjectStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                 <div className="flex-grow">
                    <label htmlFor="dept-filter" className="text-xs font-medium text-[var(--text-secondary)]">Department</label>
                    <select id="dept-filter" value={filters.departmentId} onChange={e => setFilters(f => ({...f, departmentId: e.target.value}))} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-sm mt-1">
                        <option value="">All Departments</option>
                        {allDepartments.map(d => <option key={d.$id} value={d.$id}>{d.name}</option>)}
                    </select>
                </div>
                <div className="pt-5">
                    <button onClick={() => setFilters({ departmentId: '', status: '' })} className="bg-gray-500/20 text-gray-300 hover:bg-gray-500/40 font-bold py-2 px-4 rounded transition-colors text-sm">
                        Clear Filters
                    </button>
                </div>
            </section>

            <section className="bg-[var(--bg-card)] rounded-lg shadow-lg border border-[var(--border-color)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-[var(--text-secondary)]">
                        <thead className="text-xs uppercase bg-[var(--bg-secondary)]">
                            <tr>
                                <SortableHeader label="Project" sortKey="title" className="min-w-[250px]" />
                                <th scope="col" className="px-4 py-3 min-w-[180px]">Stage</th>
                                <SortableHeader label="Progress" sortKey="progress" className="min-w-[150px]" />
                                <th scope="col" className="px-4 py-3 min-w-[200px]">Dates</th>
                                <th scope="col" className="px-4 py-3 min-w-[150px]">Stage Lead</th>
                                <th scope="col" className="px-4 py-3 min-w-[200px]">Departments</th>
                                <SortableHeader label="Last Updated" sortKey="updatedAt" className="min-w-[150px]" />
                                <th scope="col" className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSortedProjects.map(project => {
                                const stage = project.productionStage || 'Development';
                                const lead = project.stageLeadCrewId ? crewMap.get(project.stageLeadCrewId) : null;
                                const depts = project.stageAssignedDeptIds?.map(id => departmentsMap.get(id)?.name).filter(Boolean) || [];

                                return (
                                    <tr key={project.$id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)]">
                                        <td className="px-4 py-3 font-medium text-[var(--text-primary)] whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                {project.posterUrl ? <img src={project.posterUrl} alt={project.title} className="w-14 h-9 object-cover rounded" /> : <div className="w-14 h-9 bg-[var(--bg-primary)] rounded flex items-center justify-center"><i className="fas fa-film"></i></div>}
                                                <span>{project.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <select 
                                                value={stage}
                                                onChange={(e) => handleQuickStageChange(project, e.target.value as ProductionStageName)}
                                                className={`text-xs font-bold p-2 rounded-md border-2 bg-transparent focus:outline-none focus:ring-2 ${stageColors[stage].bg} ${stageColors[stage].text} ${stageColors[stage].border} ${stageColors[stage].ring}`}
                                            >
                                                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-full bg-[var(--bg-primary)] rounded-full h-2"><div className="bg-[var(--primary-color)] h-2 rounded-full" style={{ width: `${project.stageProgress || 0}%` }}></div></div>
                                                <span className="font-semibold w-10 text-right">{project.stageProgress || 0}%</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs">
                                            {project.stageStartDate ? <div>Start: {new Date(project.stageStartDate).toLocaleDateString()}</div> : <div className="opacity-50">Start: N/A</div>}
                                            {project.stageEndDate ? <div>End: {new Date(project.stageEndDate).toLocaleDateString()}</div> : <div className="opacity-50">End: N/A</div>}
                                        </td>
                                        <td className="px-4 py-3">{lead?.name || <span className="opacity-50">Not set</span>}</td>
                                        <td className="px-4 py-3" title={depts.join(', ')}>
                                            {depts.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {depts.slice(0, 2).map(d => <span key={d} className="bg-gray-500/20 text-gray-300 text-xs font-medium px-2 py-0.5 rounded-full">{d}</span>)}
                                                    {depts.length > 2 && <span className="bg-gray-500/20 text-gray-300 text-xs font-medium px-2 py-0.5 rounded-full">+{depts.length - 2} more</span>}
                                                </div>
                                            ) : <span className="opacity-50">None</span>}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">{timeAgo(project.$updatedAt)}</td>
                                        <td className="px-4 py-3">
                                            <button onClick={() => setEditingProject(project)} className="text-blue-400 hover:text-blue-300 font-bold py-2 px-3 rounded text-sm hover:bg-blue-500/10">
                                                <i className="fas fa-pencil-alt mr-1"></i> Edit
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                     {filteredAndSortedProjects.length === 0 && (
                        <div className="text-center py-10 text-[var(--text-secondary)]">
                            <i className="fas fa-search text-3xl mb-3"></i>
                            <p>No projects match the current filters.</p>
                        </div>
                    )}
                </div>
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
