import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Project, ProductionTask, CastMember, CrewMember, ProductionPhase, TaskPriority, TaskStatus } from '../types';
import { createTask, updateTask, deleteTask } from '../services/appwrite';
import LoadingSpinner from './LoadingSpinner';

interface TasksPanelProps {
    projects: Project[];
    allCast: CastMember[];
    allCrew: CrewMember[];
    tasks: ProductionTask[];
    allPhases: ProductionPhase[];
    onTaskUpdate: () => void;
}

const priorityColors: Record<TaskPriority, string> = {
    'Low': 'bg-gray-500',
    'Medium': 'bg-blue-500',
    'High': 'bg-yellow-500',
    'Critical': 'bg-red-500',
};

const statusColors: Record<TaskStatus, string> = {
    'Pending': 'bg-gray-500/20 text-gray-300',
    'In Progress': 'bg-blue-500/20 text-blue-300',
    'Completed': 'bg-green-500/20 text-green-300',
};

const TasksPanel: React.FC<TasksPanelProps> = ({ projects, allCast, allCrew, tasks, allPhases, onTaskUpdate }) => {
    const [isLoading, setIsLoading] = useState(false); // Used for form submissions
    const [filters, setFilters] = useState({
        projectId: 'all',
        phaseId: 'all',
        assigneeId: 'all',
        priority: 'all' as TaskPriority | 'all',
        status: 'all' as TaskStatus | 'all',
        sortBy: 'dueDate_desc',
    });
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<ProductionTask | null>(null);
    const [taskForm, setTaskForm] = useState({
        taskName: '',
        priority: 'Medium' as TaskPriority,
        dueDate: new Date().toISOString().split('T')[0],
        assigneeId: '',
        projectId: '',
        phaseId: '',
        status: 'Pending' as TaskStatus,
    });
    
    const allMembers = useMemo(() => [...allCast, ...allCrew].sort((a, b) => a.name.localeCompare(b.name)), [allCast, allCrew]);
    const membersMap = useMemo(() => {
        const map = new Map<string, {name: string, role: string}>();
        allMembers.forEach(m => map.set(m.$id, { name: m.name, role: m.role }));
        return map;
    }, [allMembers]);
    const projectsMap = useMemo(() => new Map(projects.map(p => [p.$id, p.title])), [projects]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => {
            const newFilters = { ...prev, [name]: value };
            if (name === 'projectId') {
                newFilters.phaseId = 'all'; // Reset phase if project changes
            }
            return newFilters;
        });
    };

    const filteredAndSortedTasks = useMemo(() => {
        let filtered = [...tasks];
        if (filters.projectId !== 'all') filtered = filtered.filter(t => t.projectId === filters.projectId);
        if (filters.phaseId !== 'all') filtered = filtered.filter(t => t.phaseId === filters.phaseId);
        if (filters.assigneeId !== 'all') filtered = filtered.filter(t => t.assigneeId === filters.assigneeId);
        if (filters.priority !== 'all') filtered = filtered.filter(t => t.priority === filters.priority);
        if (filters.status !== 'all') filtered = filtered.filter(t => t.status === filters.status);

        return filtered.sort((a, b) => {
            switch (filters.sortBy) {
                case 'dueDate_asc': return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                case 'priority':
                    const priorityOrder: Record<TaskPriority, number> = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                case 'dueDate_desc':
                default:
                    return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
            }
        });
    }, [tasks, filters]);

    const openModal = (task: ProductionTask | null) => {
        setEditingTask(task);
        setTaskForm({
            taskName: task?.taskName || '',
            priority: task?.priority || 'Medium',
            dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            assigneeId: task?.assigneeId || '',
            projectId: task?.projectId || (projects.length > 0 ? projects[0].$id : ''),
            phaseId: task?.phaseId || '',
            status: task?.status || 'Pending',
        });
        setIsModalOpen(true);
    };
    const closeModal = () => setIsModalOpen(false);
    
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setTaskForm(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const dataToSubmit = { ...taskForm, phaseId: taskForm.phaseId || undefined };
            if (editingTask) {
                await updateTask(editingTask.$id, dataToSubmit);
            } else {
                await createTask(dataToSubmit);
            }
            alert('Task saved successfully!');
            closeModal();
            onTaskUpdate();
        } catch (error) {
            console.error('Failed to save task', error);
            alert('Failed to save task.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (taskId: string) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            setIsLoading(true);
            try {
                await deleteTask(taskId);
                alert('Task deleted.');
                onTaskUpdate();
            } catch (error) {
                console.error('Failed to delete task', error);
                alert('Failed to delete task.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const phasesForSelectedProject = useMemo(() => {
        if (taskForm.projectId) {
            return allPhases.filter(p => p.projectId === taskForm.projectId);
        }
        return [];
    }, [taskForm.projectId, allPhases]);

    return (
        <div className="bg-[var(--bg-primary)] p-6 rounded-lg shadow-lg border border-[var(--border-color)]">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[var(--primary-color)] flex items-center"><i className="fas fa-check-square mr-3"></i>Task Manager</h2>
                <button onClick={() => openModal(null)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center space-x-2">
                    <i className="fas fa-plus"></i><span>Add Task</span>
                </button>
            </div>
            
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6 p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
                {/* Project Filter */}
                <div>
                    <label className="text-xs text-[var(--text-secondary)]">Project</label>
                    <select name="projectId" value={filters.projectId} onChange={handleFilterChange} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-sm">
                        <option value="all">All Projects</option>
                        {projects.map(p => <option key={p.$id} value={p.$id}>{p.title}</option>)}
                    </select>
                </div>
                {/* Phase Filter */}
                <div>
                    <label className="text-xs text-[var(--text-secondary)]">Phase</label>
                    <select name="phaseId" value={filters.phaseId} onChange={handleFilterChange} disabled={filters.projectId === 'all'} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-sm disabled:opacity-50">
                        <option value="all">All Phases</option>
                        {filters.projectId !== 'all' && allPhases.filter(p => p.projectId === filters.projectId).map(ph => <option key={ph.$id} value={ph.$id}>{ph.phaseName}</option>)}
                    </select>
                </div>
                {/* Assignee Filter */}
                <div>
                    <label className="text-xs text-[var(--text-secondary)]">Assignee</label>
                    <select name="assigneeId" value={filters.assigneeId} onChange={handleFilterChange} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-sm">
                        <option value="all">All Members</option>
                        {allMembers.map(m => <option key={m.$id} value={m.$id}>{m.name}</option>)}
                    </select>
                </div>
                {/* Priority Filter */}
                <div>
                    <label className="text-xs text-[var(--text-secondary)]">Priority</label>
                    <select name="priority" value={filters.priority} onChange={handleFilterChange} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-sm">
                        <option value="all">All Priorities</option>
                        {(['Low', 'Medium', 'High', 'Critical'] as TaskPriority[]).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                {/* Status Filter */}
                <div>
                    <label className="text-xs text-[var(--text-secondary)]">Status</label>
                    <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-sm">
                        <option value="all">All Statuses</option>
                        {(['Pending', 'In Progress', 'Completed'] as TaskStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                {/* Sort By */}
                <div>
                    <label className="text-xs text-[var(--text-secondary)]">Sort By</label>
                    <select name="sortBy" value={filters.sortBy} onChange={handleFilterChange} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-sm">
                        <option value="dueDate_desc">Due Date (Newest)</option>
                        <option value="dueDate_asc">Due Date (Oldest)</option>
                        <option value="priority">Priority</option>
                    </select>
                </div>
            </div>

            {isLoading ? <div className="flex justify-center py-8"><LoadingSpinner /></div> : (
                <div className="space-y-3">
                    {filteredAndSortedTasks.length > 0 ? filteredAndSortedTasks.map(task => {
                        const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'Completed';
                        const assignee = membersMap.get(task.assigneeId);
                        return (
                        <div key={task.$id} className="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-color)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex items-start gap-4 flex-grow">
                                <span className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${priorityColors[task.priority]}`} title={`Priority: ${task.priority}`}></span>
                                <div>
                                    <h4 className="font-bold text-lg text-[var(--text-primary)]">{task.taskName}</h4>
                                    <div className="flex items-center gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)] mt-1 flex-wrap">
                                        <span className={`font-semibold ${isOverdue ? 'text-red-400' : ''}`}><i className="far fa-calendar-alt mr-1.5"></i>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                                        {assignee ? (
                                            <span><i className="fas fa-user mr-1.5"></i>{`${assignee.name} as ${assignee.role}`}</span>
                                        ) : (
                                            <span><i className="fas fa-user mr-1.5"></i>{'Unknown'}</span>
                                        )}
                                        <span><i className="fas fa-film mr-1.5"></i>{projectsMap.get(task.projectId) || 'Unknown'}</span>
                                        <span className={`px-2 py-0.5 rounded-full ${statusColors[task.status]}`}>{task.status}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex space-x-2 flex-shrink-0 self-end sm:self-center">
                                <button onClick={() => openModal(task)} className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm"><i className="fas fa-pencil-alt"></i></button>
                                <button onClick={() => handleDelete(task.$id)} className="bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm"><i className="fas fa-trash"></i></button>
                            </div>
                        </div>
                    )}) : <p className="text-center text-[var(--text-secondary)] py-10">No tasks match the current filters.</p>}
                </div>
            )}
            
            {/* Task Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-lg shadow-2xl w-full max-w-lg relative">
                        <button onClick={closeModal} className="absolute top-4 right-4 text-[var(--text-secondary)] text-2xl">&times;</button>
                        <h2 className="text-2xl font-bold mb-6">{editingTask ? 'Edit Task' : 'Create New Task'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-[var(--text-secondary)]">Task Name</label>
                                <input name="taskName" value={taskForm.taskName} onChange={handleFormChange} required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-[var(--text-secondary)]">Project</label>
                                    <select name="projectId" value={taskForm.projectId} onChange={handleFormChange} required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2">
                                        <option value="" disabled>Select a project</option>
                                        {projects.map(p => <option key={p.$id} value={p.$id}>{p.title}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-[var(--text-secondary)]">Phase (Optional)</label>
                                    <select name="phaseId" value={taskForm.phaseId} onChange={handleFormChange} disabled={!taskForm.projectId} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 disabled:opacity-50">
                                        <option value="">None</option>
                                        {phasesForSelectedProject.map(ph => <option key={ph.$id} value={ph.$id}>{ph.phaseName}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-[var(--text-secondary)]">Assignee</label>
                                    <select name="assigneeId" value={taskForm.assigneeId} onChange={handleFormChange} required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2">
                                        <option value="" disabled>Select a member</option>
                                        {allMembers.map(m => <option key={m.$id} value={m.$id}>{m.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-[var(--text-secondary)]">Due Date</label>
                                    <input name="dueDate" type="date" value={taskForm.dueDate} onChange={handleFormChange} required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-[var(--text-secondary)]">Priority</label>
                                    <select name="priority" value={taskForm.priority} onChange={handleFormChange} required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2">
                                        {(['Low', 'Medium', 'High', 'Critical'] as TaskPriority[]).map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-[var(--text-secondary)]">Status</label>
                                    <select name="status" value={taskForm.status} onChange={handleFormChange} required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2">
                                        {(['Pending', 'In Progress', 'Completed'] as TaskStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-4 pt-4">
                                <button type="button" onClick={closeModal} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">Cancel</button>
                                <button type="submit" className="bg-[var(--primary-color)] hover:brightness-110 text-gray-900 font-bold py-2 px-4 rounded">Save Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TasksPanel;