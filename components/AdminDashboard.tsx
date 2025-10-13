import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { logout, getProjects, createProject, updateProject, deleteProject, getCast, createCastMember, updateCastMember, deleteCastMember, getCrew, createCrewMember, updateCrewMember, deleteCrewMember, getTasks, getProductionPhasesForProject, getDepartments, getDepartmentRoles, getProjectDepartmentCrew, assignCrewToProjectDepartment, unassignCrewFromProjectDepartment } from '../services/appwrite';
import type { Models } from 'appwrite';
import type { Project, ProjectStatus, ProjectType, CastMember, CrewMember, ProductionTask, ProductionPhase, Department, ProjectDepartmentCrew, DepartmentRole } from '../types';
import LoadingSpinner from './LoadingSpinner';
import AdminSidebar from './AdminSidebar';
import SiteSettingsPanel from './SiteSettingsPanel';
import MediaPanel from './MediaPanel';
import ProductionPhasesPanel from './ProductionPhasesPanel';
import SlatePanel from './SlatePanel';
import TasksPanel from './TasksPanel';
import DepartmentsPanel from './DepartmentsPanel';
import ProductionElementsPanel from './ProductionElementsPanel';
import MediaLibraryModal from './MediaLibraryModal';
import { useSettings } from '../contexts/SettingsContext';
import AdminHome from './AdminHome';
import { useNotification } from '../contexts/NotificationContext';
import { useConfirmation } from '../contexts/ConfirmationDialogContext';

interface AdminDashboardProps {
    user: Models.User<Models.Preferences>;
    onLogout: () => void;
}

const statusColors: Record<ProjectStatus, string> = {
    'Released': 'bg-green-500/20 text-green-300',
    'In Production': 'bg-yellow-500/20 text-yellow-300',
    'Upcoming': 'bg-blue-500/20 text-blue-300',
};

const GENRE_OPTIONS = ['Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery', 'Romance', 'Science Fiction', 'Thriller', 'TV Movie', 'War', 'Western'];

const getFileIdFromUrl = (url: string): string | null => {
    if (!url) return null;
    const match = url.match(/\/files\/([a-zA-Z0-9_.-]+)\/view/);
    return match ? match[1] : null;
};

const viewTitles: { [key: string]: string } = {
    home: 'Dashboard',
    projects: 'Projects Overview',
    phases: 'Production Phases',
    tasks: 'Task Manager',
    slate: 'Timecode Slate',
    departments: 'Departments & Crew',
    cast: 'Cast Members',
    media: 'Media Library',
    elements: 'Elements Library',
    settings: 'Site Settings',
};


const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
    const { settings } = useSettings();
    const { addNotification } = useNotification();
    const { confirm } = useConfirmation();
    const [activeView, setActiveView] = useState('home');
    // Page Content State
    const [projects, setProjects] = useState<Project[]>([]);
    const [allCast, setAllCast] = useState<CastMember[]>([]);
    const [allCrew, setAllCrew] = useState<CrewMember[]>([]);
    const [tasks, setTasks] = useState<ProductionTask[]>([]);
    const [allPhases, setAllPhases] = useState<ProductionPhase[]>([]);
    const [allDepartments, setAllDepartments] = useState<Department[]>([]);
    // Loading & Modal State
    const [isLoading, setIsLoading] = useState(true);
    const [isEditingProject, setIsEditingProject] = useState<Project | null>(null);
    const [isCreatingProject, setIsCreatingProject] = useState(false);
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    const [mediaModalCallback, setMediaModalCallback] = useState<(url: string) => void>(() => () => {});
    const [fileUsageMap, setFileUsageMap] = useState<Map<string, string[]>>(new Map());

    // Member (Cast/Crew) CRUD Modal State
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<CastMember | null>(null);
    const [memberForm, setMemberForm] = useState({ name: '', role: '', bio: '' });

    // Project Cast/Crew Assignment Modal State
    const [projectToAssign, setProjectToAssign] = useState<Project | null>(null);
    const [selectedCastIds, setSelectedCastIds] = useState<Set<string>>(new Set());
    const [selectedCrewIds, setSelectedCrewIds] = useState<Set<string>>(new Set());

    // Production Crew Assignment Modal State
    const [isProdCrewModalOpen, setIsProdCrewModalOpen] = useState(false);
    const [projectForProdCrew, setProjectForProdCrew] = useState<Project | null>(null);
    const [modalData, setModalData] = useState<{
        roles: DepartmentRole[];
        assignments: ProjectDepartmentCrew[];
        selectedDeptIds: string[];
        isLoading: boolean;
    }>({ roles: [], assignments: [], selectedDeptIds: [], isLoading: true });
    
    const [projectForm, setProjectForm] = useState({
        title: '',
        description: '',
        posterUrl: '',
        synopsis: '',
        releaseYear: new Date().getFullYear().toString(),
        projectType: 'Movie' as ProjectType,
        status: 'Upcoming' as ProjectStatus,
        dueDate: '',
        language: '',
        runtime: '',
        hasSubtitles: false,
        isRework: false,
        mainSubtitleLanguage: '',
        directors: [] as string[],
        producers: [] as string[],
        rating: '',
        genres: [] as string[],
        departments: [] as string[],
    });

    useEffect(() => {
        if (!projects || !settings) return;
    
        const newUsageMap = new Map<string, string[]>();
    
        const addUsage = (fileId: string, usageDescription: string) => {
            const existingUsages = newUsageMap.get(fileId) || [];
            newUsageMap.set(fileId, [...existingUsages, usageDescription]);
        };
    
        // Check hero background
        if (settings.heroBackgroundImageUrl) {
            const fileId = getFileIdFromUrl(settings.heroBackgroundImageUrl);
            if (fileId) addUsage(fileId, 'Hero Background');
        }
        
        // Check logos
        if (settings.logoLightUrl) {
            const fileId = getFileIdFromUrl(settings.logoLightUrl);
            if (fileId) addUsage(fileId, 'Logo (Light Theme)');
        }
        if (settings.logoDarkUrl) {
            const fileId = getFileIdFromUrl(settings.logoDarkUrl);
            if (fileId) addUsage(fileId, 'Logo (Dark Theme)');
        }
    
        // Check project posters
        projects.forEach(project => {
            if (project.posterUrl) {
                const fileId = getFileIdFromUrl(project.posterUrl);
                if (fileId) {
                    const title = project.title.length > 20 ? `${project.title.substring(0, 20)}...` : project.title;
                    addUsage(fileId, `Poster: "${title}"`);
                }
            }
        });
        
        setFileUsageMap(newUsageMap);
    }, [projects, settings]);

    const handleLogout = async () => {
        try {
            await logout();
            onLogout();
        } catch (error) {
            console.error('Failed to log out:', error);
        }
    };

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [projectsData, castData, crewData, tasksData, departmentsData] = await Promise.all([
                getProjects(),
                getCast(),
                getCrew(),
                getTasks(),
                getDepartments()
            ]);
            const phasesData = await Promise.all(projectsData.map(p => getProductionPhasesForProject(p.$id))).then(res => res.flat());
            setProjects(projectsData);
            setAllCast(castData);
            setAllCrew(crewData);
            setTasks(tasksData);
            setAllPhases(phasesData);
            setAllDepartments(departmentsData);
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleProjectFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'select-multiple') {
            const options = (e.target as HTMLSelectElement).options;
            const selectedValues: string[] = [];
            for (let i = 0, l = options.length; i < l; i++) {
                if (options[i].selected) {
                    selectedValues.push(options[i].value);
                }
            }
            setProjectForm(prev => ({ ...prev, [name]: selectedValues }));
        } else if (type === 'checkbox') {
            setProjectForm(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setProjectForm(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleProjectSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (['Upcoming', 'In Production'].includes(projectForm.status) && !projectForm.dueDate) {
            addNotification('warning', 'Missing Field', 'Due Date is required for projects that are "Upcoming" or "In Production".');
            return;
        }

        try {
            const dataToSubmit = {
                ...projectForm,
                posterUrl: projectForm.posterUrl || undefined,
                dueDate: ['Upcoming', 'In Production'].includes(projectForm.status) ? projectForm.dueDate : undefined,
                releaseYear: Number(projectForm.releaseYear),
                runtime: projectForm.runtime ? Number(projectForm.runtime) : undefined,
                mainSubtitleLanguage: projectForm.hasSubtitles ? projectForm.mainSubtitleLanguage : undefined,
            };

            if (isEditingProject) {
                await updateProject(isEditingProject.$id, dataToSubmit);
                addNotification('success', 'Project Updated', `Successfully updated "${projectForm.title}".`);
            } else {
                await createProject({ ...dataToSubmit, cast: [], crew: [] });
                addNotification('success', 'Project Created', `Successfully created "${projectForm.title}".`);
            }
            closeModal();
            fetchData();
        } catch (error) {
            console.error("Failed to save project", error);
            addNotification('error', 'Save Failed', 'Failed to save project.');
        }
    };
    
    const handleProjectDelete = async (projectId: string, projectTitle: string) => {
        const isConfirmed = await confirm({
            title: 'Confirm Deletion',
            message: `Are you sure you want to delete the project "${projectTitle}"? This action cannot be undone.`,
            confirmText: 'Delete Project',
            confirmStyle: 'destructive',
        });
        if(isConfirmed) {
            try {
                await deleteProject(projectId);
                addNotification('info', 'Project Deleted', `"${projectTitle}" has been deleted.`);
                fetchData();
            } catch (error) {
                console.error('Failed to delete project', error);
                addNotification('error', 'Delete Failed', 'Failed to delete project.');
            }
        }
    };

    const openEditModal = (project: Project) => {
        setIsEditingProject(project);
        setProjectForm({
            title: project.title,
            description: project.description,
            posterUrl: project.posterUrl || '',
            synopsis: project.synopsis || '',
            releaseYear: project.releaseYear.toString(),
            projectType: project.projectType || 'Movie',
            status: project.status || 'Released',
            dueDate: project.dueDate ? new Date(project.dueDate).toISOString().split('T')[0] : '',
            language: project.language || '',
            runtime: project.runtime?.toString() || '',
            hasSubtitles: project.hasSubtitles || false,
            isRework: project.isRework || false,
            mainSubtitleLanguage: project.mainSubtitleLanguage || '',
            directors: project.directors || [],
            producers: project.producers || [],
            rating: project.rating || '',
            genres: project.genres || [],
            departments: project.departments || [],
        });
    };
    
    const openCreateModal = () => {
        setIsCreatingProject(true);
        setProjectForm({ 
            title: '', 
            description: '', 
            posterUrl: '', 
            synopsis: '',
            releaseYear: new Date().getFullYear().toString(),
            projectType: 'Movie',
            status: 'Upcoming',
            dueDate: '',
            language: '',
            runtime: '',
            hasSubtitles: false,
            isRework: false,
            mainSubtitleLanguage: '',
            directors: [],
            producers: [],
            rating: '',
            genres: [],
            departments: [],
        });
    };

    const closeModal = () => {
        setIsEditingProject(null);
        setIsCreatingProject(false);
    };

    // --- New Member (Cast/Crew) CRUD Handlers ---

    const openMediaModalFor = (callback: (url: string) => void) => {
        setMediaModalCallback(() => callback);
        setIsMediaModalOpen(true);
    };

    const handleMemberFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setMemberForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const openMemberModal = (member: CastMember | null) => {
        setEditingMember(member);
        setMemberForm({
            name: member?.name || '',
            role: member?.role || '',
            bio: member?.bio || '',
        });
        setIsMemberModalOpen(true);
    };

    const closeMemberModal = () => {
        setIsMemberModalOpen(false);
        setEditingMember(null);
    };

    const handleMemberSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const payload = {
            ...memberForm,
            bio: memberForm.bio || undefined,
        };

        try {
            if (editingMember) {
                await updateCastMember(editingMember.$id, payload);
            } else {
                await createCastMember(payload);
            }
            addNotification('success', 'Member Saved', `Cast member "${payload.name}" saved successfully.`);
            closeMemberModal();
            fetchData();
        } catch (error) {
            console.error(`Failed to save cast member`, error);
            addNotification('error', 'Save Failed', 'Failed to save cast member.');
        }
    };

    const handleMemberDelete = async (member: CastMember) => {
        const isConfirmed = await confirm({
            title: 'Confirm Deletion',
            message: `Are you sure you want to delete "${member.name}"? This action won't remove them from projects they are already assigned to.`,
            confirmStyle: 'destructive',
            confirmText: 'Delete Member',
        });

        if (isConfirmed) {
            try {
                await deleteCastMember(member.$id);
                addNotification('info', 'Member Deleted', `Cast member "${member.name}" deleted.`);
                fetchData();
            } catch (error) {
                console.error(`Failed to delete cast member`, error);
                addNotification('error', 'Delete Failed', 'Failed to delete cast member.');
            }
        }
    };

    // --- New Project Assignment Handlers ---

    const openAssignmentModal = (project: Project) => {
        setProjectToAssign(project);
        setSelectedCastIds(new Set(project.cast || []));
        setSelectedCrewIds(new Set(project.crew || []));
    };

    const closeAssignmentModal = () => {
        setProjectToAssign(null);
    };

    const handleAssignmentToggle = (id: string, type: 'cast' | 'crew') => {
        if (type === 'cast') {
            const newSet = new Set(selectedCastIds);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            setSelectedCastIds(newSet);
        } else {
            const newSet = new Set(selectedCrewIds);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            setSelectedCrewIds(newSet);
        }
    };

    const handleAssignmentSave = async () => {
        if (!projectToAssign) return;
        try {
            await updateProject(projectToAssign.$id, {
                cast: Array.from(selectedCastIds),
                crew: Array.from(selectedCrewIds),
            });
            addNotification('success', 'Assignments Saved', `Member assignments for "${projectToAssign.title}" have been updated.`);
            closeAssignmentModal();
            fetchData();
        } catch (error) {
            console.error("Failed to update project members", error);
            addNotification('error', 'Save Failed', 'Could not update project members.');
        }
    };

    // --- New Production Crew Modal Handlers ---

    const openProdCrewModal = async (project: Project) => {
        setProjectForProdCrew(project);
        setIsProdCrewModalOpen(true);
        setModalData({ roles: [], assignments: [], selectedDeptIds: project.departments || [], isLoading: true });

        try {
            const assignmentsData = await getProjectDepartmentCrew(project.$id);
            const rolesData = await Promise.all((project.departments || []).map(deptId => getDepartmentRoles(deptId))).then(res => res.flat());

            setModalData({
                assignments: assignmentsData,
                roles: rolesData,
                selectedDeptIds: project.departments || [],
                isLoading: false
            });
        } catch (error) {
            addNotification('error', 'Load Failed', 'Could not load production crew data.');
            setModalData(prev => ({ ...prev, isLoading: false }));
        }
    };

    const closeProdCrewModal = () => setIsProdCrewModalOpen(false);

    const handleDeptSelectionChangeInModal = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
        setModalData(prev => ({ ...prev, selectedDeptIds: selectedIds, isLoading: true }));
        try {
            const rolesData = await Promise.all(selectedIds.map(deptId => getDepartmentRoles(deptId))).then(res => res.flat());
            setModalData(prev => ({ ...prev, roles: rolesData, isLoading: false }));
        } catch (error) {
            addNotification('error', 'Load Failed', 'Could not load roles for selected departments.');
            setModalData(prev => ({ ...prev, isLoading: false }));
        }
    };

    const handleSaveProjectDepartments = async () => {
        if (!projectForProdCrew) return;
        try {
            await updateProject(projectForProdCrew.$id, { departments: modalData.selectedDeptIds });
            const updatedProject = { ...projectForProdCrew, departments: modalData.selectedDeptIds };
            setProjectForProdCrew(updatedProject);
            setProjects(prev => prev.map(p => p.$id === updatedProject.$id ? updatedProject : p));
            addNotification('success', 'Departments Updated', 'Project departments saved successfully.');
        } catch (error) {
            addNotification('error', 'Update Failed', 'Failed to update departments.');
            console.error(error);
        }
    };
    
    const handleAssignCrew = async (roleId: string, crewId: string) => {
        if (!projectForProdCrew || !crewId) return;
        const isAlreadyAssigned = modalData.assignments.some(a => a.roleId === roleId && a.crewId === crewId);
        if (isAlreadyAssigned) {
            addNotification('warning', 'Already Assigned', 'This member is already assigned to this role for this project.');
            return;
        }
        try {
            const newAssignment = await assignCrewToProjectDepartment({ projectId: projectForProdCrew.$id, roleId, crewId });
            setModalData(prev => ({ ...prev, assignments: [...prev.assignments, newAssignment] }));
        } catch (error) {
            addNotification('error', 'Assignment Failed', 'Could not assign crew member.');
            console.error(error);
        }
    };

    const handleUnassignCrew = async (assignmentId: string) => {
        try {
            await unassignCrewFromProjectDepartment(assignmentId);
            setModalData(prev => ({ ...prev, assignments: prev.assignments.filter(a => a.$id !== assignmentId) }));
        } catch (error) {
            addNotification('error', 'Unassignment Failed', 'Could not unassign crew member.');
            console.error(error);
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen bg-[var(--bg-secondary)]"><LoadingSpinner /></div>;
    }

    const currentTitle = viewTitles[activeView] || `${activeView.charAt(0).toUpperCase() + activeView.slice(1)} Management`;

    return (
        <div className="flex min-h-screen bg-[var(--bg-secondary)] text-[var(--text-primary)]">
            <AdminSidebar user={user} onLogout={handleLogout} activeView={activeView} setActiveView={setActiveView} />
            <div className="flex-grow ml-64"> {/* Offset for fixed sidebar */}
                <div className="p-4 md:p-8">
                     <header className="mb-8">
                        <div>
                            <h1 className="text-3xl font-bold">{currentTitle}</h1>
                            <p className="text-[var(--text-secondary)]">{activeView === 'home' ? 'An overview of your active productions and site status.' : 'Manage your website content efficiently.'}</p>
                        </div>
                    </header>

                    <main className="space-y-12">
                        {activeView === 'home' && (
                            <AdminHome 
                                user={user} 
                                projects={projects} 
                                tasks={tasks}
                                allPhases={allPhases}
                                allCast={allCast}
                                allCrew={allCrew}
                                onTaskUpdate={fetchData}
                            />
                        )}

                        {activeView === 'projects' && (
                            <div className="bg-[var(--bg-primary)] p-6 rounded-lg shadow-lg border border-[var(--border-color)]">
                                <div className="flex justify-between items-center mb-4">
                                     <h2 className="text-2xl font-bold text-[var(--primary-color)] flex items-center"><i className="fas fa-film mr-3"></i>Projects</h2>
                                     <button onClick={openCreateModal} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors flex items-center space-x-2">
                                         <i className="fas fa-plus"></i>
                                         <span>Add New Project</span>
                                     </button>
                                </div>
                                <div className="space-y-4">
                                    {projects.length > 0 ? projects.map(project => (
                                        <div key={project.$id} className="bg-[var(--bg-secondary)] p-4 rounded-md flex justify-between items-center border border-[var(--border-color)]">
                                            <div className="flex items-center gap-4">
                                                {project.posterUrl ? (
                                                    <img src={project.posterUrl} alt={project.title} className="w-16 h-10 object-cover rounded-md hidden sm:block" />
                                                ) : (
                                                    <div className="w-16 h-10 bg-[var(--bg-primary)] rounded-md hidden sm:flex items-center justify-center">
                                                        <i className="fas fa-image text-2xl text-[var(--text-secondary)]"></i>
                                                    </div>
                                                )}
                                                <div>
                                                    <h3 className="font-bold text-lg flex items-center gap-2">{project.title} 
                                                        {project.status && <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[project.status]}`}>{project.status}</span>}
                                                    </h3>
                                                    <p className="text-sm text-[var(--text-secondary)]">{project.releaseYear} &bull; {project.projectType}</p>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button onClick={() => openAssignmentModal(project)} aria-label="Manage Cast & Crew" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded text-sm"><i className="fas fa-users"></i></button>
                                                <button onClick={() => openProdCrewModal(project)} aria-label="Manage Production Crew" className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-3 rounded text-sm"><i className="fas fa-sitemap"></i></button>
                                                <button onClick={() => openEditModal(project)} aria-label="Edit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded text-sm"><i className="fas fa-pencil-alt"></i></button>
                                                <button onClick={() => handleProjectDelete(project.$id, project.title)} aria-label="Delete" className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded text-sm"><i className="fas fa-trash"></i></button>
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-center text-[var(--text-secondary)] py-4">No projects found. Click "Add New Project" to get started.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeView === 'phases' && <ProductionPhasesPanel projects={projects} />}

                        {activeView === 'tasks' && <TasksPanel projects={projects} allCast={allCast} allCrew={allCrew} tasks={tasks} allPhases={allPhases} onTaskUpdate={fetchData} />}

                        {activeView === 'slate' && <SlatePanel />}

                        {activeView === 'departments' && <DepartmentsPanel allCrew={allCrew} onCrewUpdate={fetchData} />}

                        {activeView === 'cast' && (
                             <div className="bg-[var(--bg-primary)] p-6 rounded-lg shadow-lg border border-[var(--border-color)]">
                                <div className="flex justify-between items-center mb-4">
                                     <h2 className="text-2xl font-bold text-[var(--primary-color)] flex items-center"><i className="fas fa-user-friends mr-3"></i>Cast Members</h2>
                                     <button onClick={() => openMemberModal(null)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors flex items-center space-x-2">
                                         <i className="fas fa-plus"></i><span>Add New Member</span>
                                     </button>
                                </div>
                                <div className="space-y-4">
                                    {allCast.map(member => (
                                        <div key={member.$id} className="bg-[var(--bg-secondary)] p-4 rounded-md flex justify-between items-center border border-[var(--border-color)]">
                                            <div>
                                                <h3 className="font-bold text-lg">{member.name}</h3>
                                                <p className="text-sm text-[var(--text-secondary)]">{member.role}</p>
                                            </div>
                                            <div className="flex space-x-2"><button onClick={() => openMemberModal(member)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded text-sm"><i className="fas fa-pencil-alt"></i></button><button onClick={() => handleMemberDelete(member)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded text-sm"><i className="fas fa-trash"></i></button></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeView === 'media' && <MediaPanel fileUsageMap={fileUsageMap} />}
                        {activeView === 'elements' && <ProductionElementsPanel projects={projects} />}
                        {activeView === 'settings' && <SiteSettingsPanel fileUsageMap={fileUsageMap} />}
                    </main>
                    
                    {(isEditingProject || isCreatingProject) && (
                         <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                             <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-lg shadow-2xl w-full max-w-2xl relative text-[var(--text-primary)] max-h-[90vh] overflow-y-auto">
                                 <button onClick={closeModal} aria-label="Close modal" className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-2xl">&times;</button>
                                 <h2 className="text-2xl font-bold mb-6">{isEditingProject ? 'Edit Project' : 'Create Project'}</h2>
                                 <form onSubmit={handleProjectSubmit} className="space-y-4">
                                     <input type="text" name="title" value={projectForm.title} onChange={handleProjectFormChange} placeholder="Title" required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]" />
                                     <textarea name="description" value={projectForm.description} onChange={handleProjectFormChange} placeholder="Short Description (for card)" required rows={3} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]" />
                                     <textarea name="synopsis" value={projectForm.synopsis} onChange={handleProjectFormChange} placeholder="Full Synopsis (for modal)" rows={5} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]" />
                                     <div>
                                        <label htmlFor="posterUrl" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Poster Image URL</label>
                                        <div className="flex items-center space-x-2">
                                            <input id="posterUrl" type="text" name="posterUrl" value={projectForm.posterUrl} onChange={handleProjectFormChange} placeholder="Enter URL or select from media" className="flex-grow bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]" />
                                            <button type="button" onClick={() => openMediaModalFor(url => setProjectForm(prev => ({...prev, posterUrl: url})))} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded text-sm whitespace-nowrap" aria-label="Select from Media Library">
                                                <i className="fas fa-photo-video"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label htmlFor="language" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Language</label>
                                            <input type="text" name="language" value={projectForm.language} onChange={handleProjectFormChange} placeholder="e.g., English" className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]" />
                                        </div>
                                        <div>
                                            <label htmlFor="runtime" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Runtime (minutes)</label>
                                            <input type="number" name="runtime" value={projectForm.runtime} onChange={handleProjectFormChange} placeholder="e.g., 120" className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]" />
                                        </div>
                                        <div>
                                            <label htmlFor="rating" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Rating</label>
                                            <input type="text" name="rating" value={projectForm.rating} onChange={handleProjectFormChange} placeholder="e.g., PG-13" className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]" />
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-2 bg-[var(--bg-secondary)] rounded-md">
                                        <label htmlFor="hasSubtitles" className="flex items-center space-x-2 text-sm font-medium text-[var(--text-secondary)] cursor-pointer">
                                            <input type="checkbox" id="hasSubtitles" name="hasSubtitles" checked={projectForm.hasSubtitles} onChange={handleProjectFormChange} className="h-4 w-4 rounded bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--primary-color)] focus:ring-[var(--primary-color)]" />
                                            <span>Has Subtitles?</span>
                                        </label>
                                        <label htmlFor="isRework" className="flex items-center space-x-2 text-sm font-medium text-[var(--text-secondary)] cursor-pointer">
                                            <input type="checkbox" id="isRework" name="isRework" checked={projectForm.isRework} onChange={handleProjectFormChange} className="h-4 w-4 rounded bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--primary-color)] focus:ring-[var(--primary-color)]" />
                                            <span>Is a Rework?</span>
                                        </label>
                                        {projectForm.hasSubtitles && (
                                            <div className="flex-grow min-w-[200px]">
                                                <label htmlFor="mainSubtitleLanguage" className="sr-only">Main Subtitle Language</label>
                                                <input type="text" name="mainSubtitleLanguage" value={projectForm.mainSubtitleLanguage} onChange={handleProjectFormChange} placeholder="Main Subtitle Language" className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]" />
                                            </div>
                                        )}
                                    </div>
                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="directors" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Director(s)</label>
                                            <select multiple id="directors" name="directors" value={projectForm.directors} onChange={handleProjectFormChange} className="w-full h-32 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]">
                                                {allCrew.map(member => <option key={member.$id} value={member.$id}>{member.name} ({member.role})</option>)}
                                            </select>
                                        </div>
                                         <div>
                                            <label htmlFor="producers" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Producer(s)</label>
                                            <select multiple id="producers" name="producers" value={projectForm.producers} onChange={handleProjectFormChange} className="w-full h-32 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]">
                                                {allCrew.map(member => <option key={member.$id} value={member.$id}>{member.name} ({member.role})</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="genres" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Genre(s)</label>
                                        <select multiple id="genres" name="genres" value={projectForm.genres} onChange={handleProjectFormChange} className="w-full h-32 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]">
                                            {GENRE_OPTIONS.map(genre => <option key={genre} value={genre}>{genre}</option>)}
                                        </select>
                                    </div>
                                     <div>
                                        <label htmlFor="departments" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Departments</label>
                                        <select multiple id="departments" name="departments" value={projectForm.departments} onChange={handleProjectFormChange} className="w-full h-32 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]">
                                            {allDepartments.map(dept => <option key={dept.$id} value={dept.$id}>{dept.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="projectType" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Project Type</label>
                                            <select id="projectType" name="projectType" value={projectForm.projectType} onChange={handleProjectFormChange} required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]">
                                                <option>Movie</option>
                                                <option>Short</option>
                                                <option>Series</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="releaseYear" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Release Year</label>
                                            <input type="number" name="releaseYear" value={projectForm.releaseYear} onChange={handleProjectFormChange} placeholder="Release Year" required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="status" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Status</label>
                                            <select id="status" name="status" value={projectForm.status} onChange={handleProjectFormChange} required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]">
                                                <option>Upcoming</option>
                                                <option>In Production</option>
                                                <option>Released</option>
                                            </select>
                                        </div>
                                        {['Upcoming', 'In Production'].includes(projectForm.status) && (
                                            <div>
                                                <label htmlFor="dueDate" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Due Date</label>
                                                <input type="date" id="dueDate" name="dueDate" value={projectForm.dueDate} onChange={handleProjectFormChange} required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]" />
                                            </div>
                                        )}
                                    </div>
                                     <div className="flex justify-end space-x-4 pt-4">
                                         <button type="button" onClick={closeModal} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors flex items-center space-x-2">
                                            <i className="fas fa-times"></i><span>Cancel</span>
                                         </button>
                                         <button type="submit" className="bg-[var(--primary-color)] hover:brightness-110 text-gray-900 font-bold py-2 px-4 rounded transition-colors flex items-center space-x-2">
                                            <i className="fas fa-save"></i><span>Save Project</span>
                                         </button>
                                     </div>
                                 </form>
                             </div>
                         </div>
                    )}
                    
                    {isMemberModalOpen && (
                        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-lg shadow-2xl w-full max-w-lg relative text-[var(--text-primary)] max-h-[90vh] overflow-y-auto">
                                <button onClick={closeMemberModal} aria-label="Close modal" className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-2xl">&times;</button>
                                <h2 className="text-2xl font-bold mb-6">{editingMember ? 'Edit' : 'Create'} Cast Member</h2>
                                <form onSubmit={handleMemberSubmit} className="space-y-4">
                                    <input type="text" name="name" value={memberForm.name} onChange={handleMemberFormChange} placeholder="Name" required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" />
                                    <input type="text" name="role" value={memberForm.role} onChange={handleMemberFormChange} placeholder="Role (e.g., Actor)" required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" />
                                    <textarea name="bio" value={memberForm.bio} onChange={handleMemberFormChange} placeholder="Biography" rows={4} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" />
                                    <div className="flex justify-end space-x-4 pt-4"><button type="button" onClick={closeMemberModal} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">Cancel</button><button type="submit" className="bg-[var(--primary-color)] hover:brightness-110 text-gray-900 font-bold py-2 px-4 rounded">Save</button></div>
                                </form>
                            </div>
                        </div>
                    )}
                    
                    {projectToAssign && (
                        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-lg shadow-2xl w-full max-w-4xl relative text-[var(--text-primary)] h-[80vh] flex flex-col">
                                <button onClick={closeAssignmentModal} aria-label="Close modal" className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-2xl">&times;</button>
                                <h2 className="text-2xl font-bold mb-1">Assign Members (General)</h2>
                                <p className="text-[var(--text-secondary)] mb-6 border-b border-[var(--border-color)] pb-4">For: <span className="font-semibold text-[var(--text-primary)]">{projectToAssign.title}</span></p>
                                <div className="grid grid-cols-2 gap-8 flex-grow overflow-hidden">
                                    <div className="flex flex-col">
                                        <h3 className="text-lg font-semibold mb-3">Cast Members</h3>
                                        <div className="flex-grow overflow-y-auto pr-4 space-y-2">
                                            {allCast.map(member => (
                                                <label key={member.$id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-[var(--bg-secondary)] cursor-pointer">
                                                    <input type="checkbox" checked={selectedCastIds.has(member.$id)} onChange={() => handleAssignmentToggle(member.$id, 'cast')} className="h-5 w-5 rounded bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--primary-color)] focus:ring-[var(--primary-color)]" />
                                                    <span>{member.name} <span className="text-sm text-[var(--text-secondary)]">({member.role})</span></span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-lg font-semibold mb-3">Crew Members (General)</h3>
                                        <div className="flex-grow overflow-y-auto pr-4 space-y-2">
                                             {allCrew.map(member => (
                                                <label key={member.$id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-[var(--bg-secondary)] cursor-pointer">
                                                    <input type="checkbox" checked={selectedCrewIds.has(member.$id)} onChange={() => handleAssignmentToggle(member.$id, 'crew')} className="h-5 w-5 rounded bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--primary-color)] focus:ring-[var(--primary-color)]" />
                                                    <span>{member.name} <span className="text-sm text-[var(--text-secondary)]">({member.role})</span></span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-6 mt-6 border-t border-[var(--border-color)] flex justify-end space-x-4">
                                    <button type="button" onClick={closeAssignmentModal} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">Cancel</button>
                                    <button type="button" onClick={handleAssignmentSave} className="bg-[var(--primary-color)] hover:brightness-110 text-gray-900 font-bold py-2 px-4 rounded">Save Assignments</button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {isProdCrewModalOpen && projectForProdCrew && (
                        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-lg shadow-2xl w-full max-w-6xl relative text-[var(--text-primary)] h-[90vh] flex flex-col">
                                <button onClick={closeProdCrewModal} aria-label="Close modal" className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-2xl">&times;</button>
                                <h2 className="text-2xl font-bold mb-1">Production Crew Management</h2>
                                <p className="text-[var(--text-secondary)] mb-4">For: <span className="font-semibold text-[var(--text-primary)]">{projectForProdCrew.title}</span></p>
                                
                                <div className="flex flex-col md:flex-row gap-4 items-start border-b border-[var(--border-color)] pb-4 mb-4">
                                    <div className="flex-grow">
                                        <label htmlFor="prodCrewDepts" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Assigned Departments</label>
                                        <select multiple id="prodCrewDepts" value={modalData.selectedDeptIds} onChange={handleDeptSelectionChangeInModal} className="w-full h-24 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2">
                                            {allDepartments.map(dept => <option key={dept.$id} value={dept.$id}>{dept.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="self-end">
                                        <button onClick={handleSaveProjectDepartments} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded h-10">Save Departments</button>
                                    </div>
                                </div>

                                <div className="flex-grow overflow-y-auto">
                                    {modalData.isLoading ? <div className="flex justify-center items-center h-full"><LoadingSpinner /></div> : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {allDepartments.filter(d => modalData.selectedDeptIds.includes(d.$id)).map(dept => {
                                                const deptRoles = modalData.roles.filter(r => r.departmentId === dept.$id);
                                                return (
                                                    <div key={dept.$id} className="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-color)]">
                                                        <h4 className="font-bold text-lg mb-3">{dept.name}</h4>
                                                        <div className="space-y-4">
                                                            {deptRoles.map(role => {
                                                                const assignmentsForRole = modalData.assignments.filter(a => a.roleId === role.$id);
                                                                return (
                                                                    <div key={role.$id}>
                                                                        <h5 className="font-semibold text-sm text-[var(--primary-color)] mb-2">{role.roleName}</h5>
                                                                        <div className="space-y-2 mb-2">
                                                                            {assignmentsForRole.map(asg => (
                                                                                <div key={asg.$id} className="flex items-center justify-between bg-[var(--bg-primary)] p-2 rounded text-sm">
                                                                                    <span>{allCrew.find(c => c.$id === asg.crewId)?.name || 'Unknown Crew'}</span>
                                                                                    <button onClick={() => handleUnassignCrew(asg.$id)} className="text-red-400 hover:text-red-300 w-6 h-6 rounded flex items-center justify-center"><i className="fas fa-times"></i></button>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                        {/* FIX: Safely access form field value using FormData to resolve TypeScript error on `e.currentTarget.elements`. */}
                                                                        <form
                                                                            onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                                                                                e.preventDefault();
                                                                                const formData = new FormData(e.currentTarget);
                                                                                const crewId = formData.get('crewId');
                                                                                if (typeof crewId === 'string' && crewId) {
                                                                                    handleAssignCrew(role.$id, crewId);
                                                                                    e.currentTarget.reset();
                                                                                }
                                                                            }}
                                                                            className="flex gap-2"
                                                                        >
                                                                            <select name="crewId" defaultValue="" required className="flex-grow bg-[var(--input-bg)] border border-[var(--border-color)] rounded p-1 text-sm">
                                                                                <option value="" disabled>Select Crew...</option>
                                                                                {allCrew.map(c => <option key={c.$id} value={c.$id}>{c.name}</option>)}
                                                                            </select>
                                                                            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-2 rounded">Assign</button>
                                                                        </form>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {isMediaModalOpen && <MediaLibraryModal onSelect={(url) => { mediaModalCallback(url); setIsMediaModalOpen(false); }} onClose={() => setIsMediaModalOpen(false)} fileUsageMap={fileUsageMap} />}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;