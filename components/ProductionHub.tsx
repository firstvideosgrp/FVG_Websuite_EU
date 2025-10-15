import React, { useMemo } from 'react';
import type { Project, ProductionPhase, ProductionTask, CastMember, CrewMember, TaskPriority } from '../types';

// Props interface
interface ProductionHubProps {
    projects: Project[];
    tasks: ProductionTask[];
    allPhases: ProductionPhase[];
    allCast: CastMember[];
    allCrew: CrewMember[];
    onTaskUpdate: () => void;
}

// Stat Card component
const StatCard: React.FC<{ icon: string; value: string | number; label: string; color: string; }> = ({ icon, value, label, color }) => (
    <div className="bg-[var(--bg-secondary)] p-5 rounded-lg shadow border border-[var(--border-color)] flex items-center space-x-4">
        <div className={`text-3xl w-12 h-12 flex items-center justify-center rounded-lg ${color}`}>
            <i className={icon}></i>
        </div>
        <div>
            <p className="text-3xl font-bold text-[var(--text-primary)]">{value}</p>
            <p className="text-sm text-[var(--text-secondary)]">{label}</p>
        </div>
    </div>
);

// Production Overview Card component
const ProductionOverviewCard: React.FC<{ project: Project, phases: ProductionPhase[] }> = ({ project, phases }) => {
    const { progress, currentPhase } = useMemo(() => {
        const projectPhases = phases.filter(p => p.projectId === project.$id);
        if (projectPhases.length === 0) {
            return { progress: 0, currentPhase: 'Planning' };
        }
        const completedPhases = projectPhases.filter(p => p.status === 'Completed').length;
        const progress = Math.round((completedPhases / projectPhases.length) * 100);
        const current = projectPhases.find(p => p.status !== 'Completed')?.phaseName || 'Finishing Up';
        return { progress, currentPhase: current };
    }, [project, phases]);

    return (
        <div className="bg-[var(--bg-secondary)] p-4 rounded-lg shadow border border-[var(--border-color)]">
            <h4 className="font-bold text-lg truncate text-[var(--text-primary)]" title={project.title}>{project.title}</h4>
            {project.dueDate && <p className="text-xs text-yellow-400 font-semibold mt-1"><i className="far fa-calendar-alt mr-2"></i>Due: {new Date(project.dueDate).toLocaleDateString()}</p>}
            <div className="mt-3">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-[var(--text-secondary)]">Progress</span>
                    <span className="text-xs font-semibold text-[var(--primary-color)]">{progress}%</span>
                </div>
                <div className="w-full bg-[var(--bg-primary)] rounded-full h-2"><div className="bg-[var(--primary-color)] h-2 rounded-full" style={{ width: `${progress}%` }}></div></div>
                <p className="text-xs text-[var(--text-secondary)] mt-1.5">Current Phase: {currentPhase}</p>
            </div>
        </div>
    );
};

// Task Card component
const TaskCard: React.FC<{ task: ProductionTask, projectName: string, assigneeName?: string }> = ({ task, projectName, assigneeName }) => {
    const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'Completed';
    const priorityColors: Record<TaskPriority, string> = { 'Low': 'bg-gray-500', 'Medium': 'bg-blue-500', 'High': 'bg-yellow-500', 'Critical': 'bg-red-500' };

    return (
        <div className="bg-[var(--bg-primary)] p-3 rounded-lg shadow border border-[var(--border-color)]">
            <div className="flex justify-between items-start">
                <p className="font-bold text-sm text-[var(--text-primary)] leading-tight">{task.taskName}</p>
                <span className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${priorityColors[task.priority]}`} title={`Priority: ${task.priority}`}></span>
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-2 space-y-1">
                <p title={`Project: ${projectName}`}><i className="fas fa-film w-4 text-center mr-1"></i>{projectName}</p>
                <p title={`Assignee: ${assigneeName || 'Unassigned'}`}><i className="fas fa-user w-4 text-center mr-1"></i>{assigneeName || 'Unassigned'}</p>
                <p className={isOverdue ? 'text-red-400 font-semibold' : ''}><i className="far fa-calendar-alt w-4 text-center mr-1"></i>Due: {new Date(task.dueDate).toLocaleDateString()}</p>
            </div>
        </div>
    );
};

// Main ProductionHub component
const ProductionHub: React.FC<ProductionHubProps> = ({ projects, tasks, allPhases, allCast, allCrew, onTaskUpdate }) => {
    
    const activeProductions = useMemo(() => projects.filter(p => p.status === 'In Production' || p.status === 'Upcoming'), [projects]);
    const overdueTasks = useMemo(() => tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'Completed'), [tasks]);
    
    const { pendingTasks, inProgressTasks, recentlyCompletedTasks } = useMemo(() => ({
        pendingTasks: tasks.filter(t => t.status === 'Pending').sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
        inProgressTasks: tasks.filter(t => t.status === 'In Progress').sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
        recentlyCompletedTasks: tasks.filter(t => t.status === 'Completed').sort((a, b) => new Date(b.$updatedAt).getTime() - new Date(a.$updatedAt).getTime()).slice(0, 10),
    }), [tasks]);

    const membersMap = useMemo(() => {
        const map = new Map<string, {name: string}>();
        [...allCast, ...allCrew].forEach(m => map.set(m.$id, { name: m.name }));
        return map;
    }, [allCast, allCrew]);
    
    const projectsMap = useMemo(() => new Map(projects.map(p => [p.$id, p.title])), [projects]);

    return (
        <div className="space-y-8">
            {/* Stats Section */}
            <section>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard icon="fas fa-video" value={activeProductions.length} label="Active Productions" color="bg-blue-500/20 text-blue-300" />
                    <StatCard icon="fas fa-inbox" value={pendingTasks.length} label="Pending Tasks" color="bg-gray-500/20 text-gray-300" />
                    <StatCard icon="fas fa-exclamation-triangle" value={overdueTasks.length} label="Overdue Tasks" color="bg-red-500/20 text-red-300" />
                    <StatCard icon="fas fa-check-double" value={tasks.filter(t => t.status === 'Completed').length} label="Total Completed Tasks" color="bg-green-500/20 text-green-300" />
                </div>
            </section>

            {/* Main Dashboard Grid */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Active Productions Column */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-xl font-bold text-[var(--primary-color)] border-b border-[var(--border-color)] pb-2">Active Productions</h3>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 -mr-2">
                        {activeProductions.length > 0 ? activeProductions.map(p => (
                            <ProductionOverviewCard key={p.$id} project={p} phases={allPhases} />
                        )) : (
                             <div className="bg-[var(--bg-secondary)] p-6 rounded-lg border border-[var(--border-color)] text-center text-[var(--text-secondary)]">
                                <i className="fas fa-couch text-3xl mb-3"></i>
                                <p>No active productions.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Task Board */}
                <div className="lg:col-span-2">
                    <h3 className="text-xl font-bold text-[var(--primary-color)] border-b border-[var(--border-color)] pb-2 mb-4">Task Board</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Pending */}
                        <div>
                            <h4 className="font-bold mb-3 text-center text-gray-400">PENDING ({pendingTasks.length})</h4>
                            <div className="space-y-3 bg-[var(--bg-primary)] p-3 rounded-lg h-[60vh] overflow-y-auto">
                                {pendingTasks.map(task => <TaskCard key={task.$id} task={task} projectName={projectsMap.get(task.projectId) || 'N/A'} assigneeName={membersMap.get(task.assigneeId)?.name} />)}
                            </div>
                        </div>
                         {/* In Progress */}
                        <div>
                            <h4 className="font-bold mb-3 text-center text-blue-400">IN PROGRESS ({inProgressTasks.length})</h4>
                            <div className="space-y-3 bg-[var(--bg-primary)] p-3 rounded-lg h-[60vh] overflow-y-auto">
                                 {inProgressTasks.map(task => <TaskCard key={task.$id} task={task} projectName={projectsMap.get(task.projectId) || 'N/A'} assigneeName={membersMap.get(task.assigneeId)?.name} />)}
                            </div>
                        </div>
                         {/* Recently Completed */}
                        <div>
                            <h4 className="font-bold mb-3 text-center text-green-400">RECENTLY COMPLETED</h4>
                             <div className="space-y-3 bg-[var(--bg-primary)] p-3 rounded-lg h-[60vh] overflow-y-auto">
                                {recentlyCompletedTasks.map(task => <TaskCard key={task.$id} task={task} projectName={projectsMap.get(task.projectId) || 'N/A'} assigneeName={membersMap.get(task.assigneeId)?.name} />)}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ProductionHub;
