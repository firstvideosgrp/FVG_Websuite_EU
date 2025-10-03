import React, { useState, useEffect, useMemo } from 'react';
import type { Models } from 'appwrite';
import type { Project, ProductionPhase, ProductionTask, CastMember, CrewMember, TaskStatus } from '../types';
import { getProductionPhasesForProject, updateTask } from '../services/appwrite';
import LoadingSpinner from './LoadingSpinner';

interface AdminHomeProps {
    user: Models.User<Models.Preferences>;
    projects: Project[];
    tasks: ProductionTask[];
    allPhases: ProductionPhase[];
    allCast: CastMember[];
    allCrew: CrewMember[];
    onTaskUpdate: () => void;
}

const statusColors: Record<TaskStatus, { bg: string, text: string, icon: string }> = {
    'Pending': { bg: 'bg-gray-500/20', text: 'text-gray-300', icon: 'fas fa-inbox' },
    'In Progress': { bg: 'bg-blue-500/20', text: 'text-blue-300', icon: 'fas fa-spinner fa-spin' },
    'Completed': { bg: 'bg-green-500/20', text: 'text-green-300', icon: 'fas fa-check-circle' },
};

const AdminHome: React.FC<AdminHomeProps> = ({ user, projects, tasks, allPhases, allCast, allCrew, onTaskUpdate }) => {
    const [phasesByProject, setPhasesByProject] = useState<Map<string, ProductionPhase[]>>(new Map());
    const [isLoadingPhases, setIsLoadingPhases] = useState(true);
    const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

    const activeProductions = useMemo(() => {
        return projects.filter(p => p.status === 'In Production');
    }, [projects]);
    
    const { pendingTasks, inProgressTasks, recentlyCompletedTasks } = useMemo(() => ({
        pendingTasks: tasks.filter(t => t.status === 'Pending').sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
        inProgressTasks: tasks.filter(t => t.status === 'In Progress').sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
        recentlyCompletedTasks: tasks
            .filter(t => t.status === 'Completed')
            .sort((a, b) => new Date(b.$updatedAt).getTime() - new Date(a.$updatedAt).getTime())
            .slice(0, 15), // Limit to 15 most recent
    }), [tasks]);

    const membersMap = useMemo(() => {
        const map = new Map<string, {name: string, role: string}>();
        [...allCast, ...allCrew].forEach(m => map.set(m.$id, { name: m.name, role: m.role }));
        return map;
    }, [allCast, allCrew]);
    const projectsMap = useMemo(() => new Map(projects.map(p => [p.$id, p.title])), [projects]);
    const phasesMap = useMemo(() => new Map(allPhases.map(p => [p.$id, p.phaseName])), [allPhases]);

    useEffect(() => {
        const fetchAllPhasesForActiveProjects = async () => {
            if (activeProductions.length === 0) {
                setIsLoadingPhases(false);
                return;
            }
            setIsLoadingPhases(true);
            try {
                const phasePromises = activeProductions.map(p => getProductionPhasesForProject(p.$id));
                const results = await Promise.all(phasePromises);

                const newPhasesMap = new Map<string, ProductionPhase[]>();
                activeProductions.forEach((project, index) => {
                    newPhasesMap.set(project.$id, results[index]);
                });
                setPhasesByProject(newPhasesMap);
            } catch (error) {
                console.error("Failed to fetch production phases for dashboard", error);
            } finally {
                setIsLoadingPhases(false);
            }
        };

        fetchAllPhasesForActiveProjects();
    }, [activeProductions]);
    
    const handleStatusUpdate = async (taskId: string, newStatus: TaskStatus) => {
        setUpdatingTaskId(taskId);
        try {
            await updateTask(taskId, { status: newStatus });
            onTaskUpdate();
        } catch (error) {
            console.error("Failed to update task status", error);
            alert("Failed to update status.");
        } finally {
            setUpdatingTaskId(null);
        }
    };

    const getProductionProgress = (projectId: string) => {
        const phases = phasesByProject.get(projectId) || [];
        if (phases.length === 0) {
            return { progress: 0, currentPhase: 'Not started' };
        }
        const completedPhases = phases.filter(p => p.status === 'Completed').length;
        const progress = Math.round((completedPhases / phases.length) * 100);
        const currentPhase = phases.find(p => p.status !== 'Completed')?.phaseName || 'Finishing Up';
        return { progress, currentPhase };
    };
    
    const TaskCard: React.FC<{ task: ProductionTask }> = ({ task }) => {
        const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'Completed';
        const isUpdating = updatingTaskId === task.$id;
        const assignee = membersMap.get(task.assigneeId);
    
        const renderStatusAction = () => {
            if (isUpdating) {
                return (
                    <div className="flex items-center justify-center h-8">
                        <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-[var(--primary-color)]"></div>
                    </div>
                );
            }
    
            switch (task.status) {
                case 'Pending':
                    return (
                        <button
                            onClick={() => handleStatusUpdate(task.$id, 'In Progress')}
                            className="text-sm font-semibold px-3 py-1 rounded-full transition-colors whitespace-nowrap bg-blue-500/20 text-blue-300 hover:bg-blue-500/40"
                        >
                            Move to In Progress
                        </button>
                    );
                case 'In Progress':
                    return (
                        <button
                            onClick={() => handleStatusUpdate(task.$id, 'Completed')}
                            className="text-sm font-semibold px-3 py-1 rounded-full transition-colors whitespace-nowrap bg-green-500/20 text-green-300 hover:bg-green-500/40"
                        >
                            Mark as Completed
                        </button>
                    );
                case 'Completed':
                    return (
                        <div className={`flex items-center justify-center gap-2 text-sm font-semibold px-3 py-1 rounded-full ${statusColors[task.status].bg} ${statusColors[task.status].text}`}>
                            <i className={statusColors[task.status].icon}></i>
                            <span>{task.status}</span>
                        </div>
                    );
                default:
                    return null;
            }
        };
    
        return (
            <div className="bg-[var(--bg-primary)] p-3 rounded-lg shadow border border-[var(--border-color)]">
                <div className="flex justify-between items-start gap-2">
                    <div className="flex-grow">
                        <p className="font-bold text-[var(--text-primary)] leading-tight">{task.taskName}</p>
                        <div className="text-xs text-[var(--text-secondary)] mt-1 space-x-3">
                            <span title={`Project: ${projectsMap.get(task.projectId)}`}><i className="fas fa-film mr-1"></i>{projectsMap.get(task.projectId)}</span>
                            {assignee ? (
                                <span title={`Assignee: ${assignee.name} as ${assignee.role}`}>
                                    <i className="fas fa-user mr-1"></i>
                                    {`${assignee.name} as ${assignee.role}`}
                                </span>
                            ) : (
                                <span title="Assignee: Unknown"><i className="fas fa-user mr-1"></i>Unknown</span>
                            )}
                        </div>
                    </div>
                    <div className="flex-shrink-0">
                        {renderStatusAction()}
                    </div>
                </div>
                <div className={`text-xs font-semibold mt-2 ${isOverdue ? 'text-red-400' : 'text-[var(--text-secondary)]'}`}>
                    <i className="far fa-calendar-alt mr-1.5"></i>
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                </div>
            </div>
        );
    };


    return (
        <div className="space-y-8">
            <header className="bg-[var(--bg-primary)] p-6 rounded-lg shadow-lg border border-[var(--border-color)]">
                <h1 className="text-3xl font-bold">Welcome back, <span className="text-[var(--primary-color)]">{user.name || user.email}!</span></h1>
                <p className="text-[var(--text-secondary)] mt-1">Here's a quick overview of what's happening.</p>
            </header>
            
            <section>
                <h2 className="text-2xl font-bold text-[var(--primary-color)] mb-4 flex items-center"><i className="fas fa-video mr-3"></i>Active Productions</h2>
                {isLoadingPhases ? (
                    <div className="flex justify-center py-8"><LoadingSpinner /></div>
                ) : activeProductions.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {activeProductions.map(project => {
                            const { progress, currentPhase } = getProductionProgress(project.$id);
                            return (
                                <div key={project.$id} className="bg-[var(--bg-primary)] p-5 rounded-lg shadow-lg border border-[var(--border-color)] flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-bold text-xl truncate" title={project.title}>{project.title}</h3>
                                        {project.dueDate && (
                                            <p className="text-sm text-yellow-400 font-semibold mt-1">
                                                <i className="far fa-calendar-alt mr-2"></i>
                                                Due: {new Date(project.dueDate).toLocaleDateString()}
                                            </p>
                                        )}
                                        <div className="mt-4">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-semibold text-[var(--text-secondary)]">Overall Progress</span>
                                                <span className="text-xs font-semibold text-[var(--primary-color)]">{progress}%</span>
                                            </div>
                                            <div className="w-full bg-[var(--bg-secondary)] rounded-full h-2">
                                                <div 
                                                    className="bg-[var(--primary-color)] h-2 rounded-full transition-all duration-500" 
                                                    style={{ width: `${progress}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-sm text-[var(--text-secondary)] mt-2">
                                                <span className="font-semibold">Current Phase:</span> {currentPhase}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-[var(--bg-primary)] p-8 rounded-lg shadow-lg border border-[var(--border-color)] text-center">
                        <i className="fas fa-couch text-4xl text-[var(--text-secondary)] mb-4"></i>
                        <h3 className="text-xl font-bold">All Quiet on Set</h3>
                        <p className="text-[var(--text-secondary)] mt-1">There are currently no projects marked as 'In Production'.</p>
                    </div>
                )}
            </section>
            
            <section>
                <h2 className="text-2xl font-bold text-[var(--primary-color)] flex items-center"><i className="fas fa-clipboard-list mr-3"></i>Task Quick View</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                    {/* Pending Tasks Column */}
                    <div>
                        <h3 className="text-xl font-bold mb-3 flex items-center gap-2"><i className="fas fa-inbox text-gray-400"></i> Pending Tasks <span className="text-sm font-normal bg-gray-500/20 text-gray-300 rounded-full px-2">{pendingTasks.length}</span></h3>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 -mr-2">
                            {pendingTasks.length > 0 ? (
                                pendingTasks.map(task => <TaskCard key={task.$id} task={task} />)
                            ) : (
                                <div className="bg-[var(--bg-primary)] p-6 rounded-lg border border-[var(--border-color)] text-center text-[var(--text-secondary)]">
                                    <i className="fas fa-check-double text-2xl mb-2"></i>
                                    <p>No pending tasks. Great job!</p>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* In-Progress Tasks Column */}
                    <div>
                        <h3 className="text-xl font-bold mb-3 flex items-center gap-2"><i className="fas fa-spinner fa-spin text-blue-400"></i> In-Progress Tasks <span className="text-sm font-normal bg-blue-500/20 text-blue-300 rounded-full px-2">{inProgressTasks.length}</span></h3>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 -mr-2">
                            {inProgressTasks.length > 0 ? (
                                inProgressTasks.map(task => <TaskCard key={task.$id} task={task} />)
                            ) : (
                                 <div className="bg-[var(--bg-primary)] p-6 rounded-lg border border-[var(--border-color)] text-center text-[var(--text-secondary)]">
                                    <i className="fas fa-coffee text-2xl mb-2"></i>
                                    <p>No tasks currently in progress.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-[var(--primary-color)] mb-4 flex items-center">
                    <i className="fas fa-history mr-3"></i>Recently Completed Tasks
                </h2>
                <div className="bg-[var(--bg-primary)] p-4 rounded-lg shadow-lg border border-[var(--border-color)] max-h-[400px] overflow-y-auto">
                    {recentlyCompletedTasks.length > 0 ? (
                        <div className="space-y-3">
                            {recentlyCompletedTasks.map(task => {
                                const assignee = membersMap.get(task.assigneeId);
                                const project = projectsMap.get(task.projectId);
                                const phase = task.phaseId ? phasesMap.get(task.phaseId) : null;
                                return (
                                    <div key={task.$id} className="bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border-color)]">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex-grow">
                                                <p className="font-bold text-[var(--text-primary)] leading-tight">{task.taskName}</p>
                                                <div className="text-xs text-[var(--text-secondary)] mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                                    {assignee && (
                                                        <span title={`Assignee: ${assignee.name} as ${assignee.role}`}>
                                                            <i className="fas fa-user mr-1"></i>
                                                            {`${assignee.name} as ${assignee.role}`}
                                                        </span>
                                                    )}
                                                    {project && (
                                                        <span title={`Project: ${project}`}>
                                                            <i className="fas fa-film mr-1"></i>
                                                            {project}{phase ? ` / ${phase}` : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex-shrink-0 text-xs text-gray-400 font-semibold text-right">
                                                <p>Completed on</p>
                                                <p>{new Date(task.$updatedAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-[var(--text-secondary)]">
                            <i className="fas fa-wind text-3xl mb-3"></i>
                            <p>No tasks have been completed recently.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default AdminHome;
