import React, { useState, useEffect, useCallback } from 'react';
import { logout, getAboutContent, updateAboutContent, getProjects, createProject, updateProject, deleteProject, getCast, createCastMember, updateCastMember, deleteCastMember, getCrew, createCrewMember, updateCrewMember, deleteCrewMember } from '../services/appwrite';
import type { Models } from 'appwrite';
import type { AboutContent, Project, ProjectStatus, ProjectType, CastMember, CrewMember } from '../types';
import LoadingSpinner from './LoadingSpinner';
import AdminSidebar from './AdminSidebar';
import SiteSettingsPanel from './SiteSettingsPanel';
import MediaPanel from './MediaPanel';
import MediaLibraryModal from './MediaLibraryModal';
import { useSettings } from '../contexts/SettingsContext';

interface AdminDashboardProps {
    user: Models.User<Models.Preferences>;
    onLogout: () => void;
}

const statusColors: Record<ProjectStatus, string> = {
    'Released': 'bg-green-500/20 text-green-300',
    'In Production': 'bg-yellow-500/20 text-yellow-300',
    'Upcoming': 'bg-blue-500/20 text-blue-300',
};

const getFileIdFromUrl = (url: string): string | null => {
    if (!url) return null;
    const match = url.match(/\/files\/([a-zA-Z0-9_.-]+)\/view/);
    return match ? match[1] : null;
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
    const { settings } = useSettings();
    const [activeView, setActiveView] = useState('projects');
    // Page Content State
    const [about, setAbout] = useState<AboutContent | null>(null);
    const [aboutText, setAboutText] = useState('');
    const [projects, setProjects] = useState<Project[]>([]);
    const [allCast, setAllCast] = useState<CastMember[]>([]);
    const [allCrew, setAllCrew] = useState<CrewMember[]>([]);
    // Loading & Modal State
    const [isLoading, setIsLoading] = useState(true);
    const [isEditingProject, setIsEditingProject] = useState<Project | null>(null);
    const [isCreatingProject, setIsCreatingProject] = useState(false);
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    const [mediaModalCallback, setMediaModalCallback] = useState<(url: string) => void>(() => () => {});
    const [fileUsageMap, setFileUsageMap] = useState<Map<string, string[]>>(new Map());

    // Member (Cast/Crew) CRUD Modal State
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<CastMember | CrewMember | null>(null);
    const [memberType, setMemberType] = useState<'cast' | 'crew' | null>(null);
    const [memberForm, setMemberForm] = useState({ name: '', role: '', bio: '' });

    // Project Cast/Crew Assignment Modal State
    const [projectToAssign, setProjectToAssign] = useState<Project | null>(null);
    const [selectedCastIds, setSelectedCastIds] = useState<Set<string>>(new Set());
    const [selectedCrewIds, setSelectedCrewIds] = useState<Set<string>>(new Set());
    
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
    });

    useEffect(() => {
        if (!projects || !settings) return;

        const newUsageMap = new Map<string, string[]>();

        // Check hero background
        if (settings.heroBackgroundImageUrl) {
            const fileId = getFileIdFromUrl(settings.heroBackgroundImageUrl);
            if (fileId) {
                newUsageMap.set(fileId, ['Hero Background']);
            }
        }

        // Check project posters
        projects.forEach(project => {
            if (project.posterUrl) {
                const fileId = getFileIdFromUrl(project.posterUrl);
                if (fileId) {
                    const usages = newUsageMap.get(fileId) || [];
                    const title = project.title.length > 20 ? `${project.title.substring(0, 20)}...` : project.title;
                    usages.push(`Poster: "${title}"`);
                    newUsageMap.set(fileId, usages);
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
            const [aboutData, projectsData, castData, crewData] = await Promise.all([
                getAboutContent(), 
                getProjects(),
                getCast(),
                getCrew()
            ]);
            setAbout(aboutData);
            setAboutText(aboutData?.content || '');
            setProjects(projectsData);
            setAllCast(castData);
            setAllCrew(crewData);
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAboutSave = async () => {
        if (about) {
            try {
                await updateAboutContent(about.$id, aboutText);
                alert('About section updated!');
                fetchData();
            } catch(e) {
                alert('Failed to update about section.');
                console.error(e);
            }
        }
    };

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
            alert('Due Date is required for projects that are "Upcoming" or "In Production".');
            return;
        }

        try {
            const dataToSubmit = {
                ...projectForm,
                dueDate: ['Upcoming', 'In Production'].includes(projectForm.status) ? projectForm.dueDate : null,
                releaseYear: Number(projectForm.releaseYear),
                runtime: projectForm.runtime ? Number(projectForm.runtime) : null,
                mainSubtitleLanguage: projectForm.hasSubtitles ? projectForm.mainSubtitleLanguage : null,
            };

            if (isEditingProject) {
                await updateProject(isEditingProject.$id, dataToSubmit);
                alert('Project updated!');
            } else {
                await createProject({ ...dataToSubmit, cast: [], crew: [] });
                alert('Project created!');
            }
            closeModal();
            fetchData();
        } catch (error) {
            console.error("Failed to save project", error);
            alert("Failed to save project.");
        }
    };
    
    const handleProjectDelete = async (projectId: string) => {
        if(window.confirm('Are you sure you want to delete this project?')) {
            try {
                await deleteProject(projectId);
                alert('Project deleted.');
                fetchData();
            } catch (error) {
                console.error('Failed to delete project', error);
                alert('Failed to delete project.');
            }
        }
    };

    const openEditModal = (project: Project) => {
        setIsEditingProject(project);
        setProjectForm({
            title: project.title,
            description: project.description,
            posterUrl: project.posterUrl,
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

    const openMemberModal = (member: CastMember | CrewMember | null, type: 'cast' | 'crew') => {
        setMemberType(type);
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
        setMemberType(null);
    };

    const handleMemberSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!memberType) return;

        const api = {
            create: { cast: createCastMember, crew: createCrewMember },
            update: { cast: updateCastMember, crew: updateCrewMember },
        };
        
        // FIX: Convert empty strings for optional fields to null to prevent Appwrite validation errors.
        // Appwrite's URL attribute type requires a valid URL or null, not an empty string.
        const payload = {
            ...memberForm,
            bio: memberForm.bio || null,
        };

        try {
            if (editingMember) {
                await api.update[memberType](editingMember.$id, payload);
            } else {
                await api.create[memberType](payload);
            }
            alert(`${memberType.charAt(0).toUpperCase() + memberType.slice(1)} member saved!`);
            closeMemberModal();
            fetchData();
        } catch (error) {
            console.error(`Failed to save ${memberType} member`, error);
            alert(`Failed to save ${memberType} member.`);
        }
    };

    const handleMemberDelete = async (memberId: string, type: 'cast' | 'crew') => {
        if (window.confirm(`Are you sure you want to delete this ${type} member? This will not remove them from existing projects.`)) {
            try {
                if (type === 'cast') await deleteCastMember(memberId);
                else await deleteCrewMember(memberId);
                alert(`${type.charAt(0).toUpperCase() + type.slice(1)} member deleted.`);
                fetchData();
            } catch (error) {
                console.error(`Failed to delete ${type} member`, error);
                alert(`Failed to delete ${type} member.`);
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
            alert("Project members updated!");
            closeAssignmentModal();
            fetchData();
        } catch (error) {
            console.error("Failed to update project members", error);
            alert("Failed to update project members.");
        }
    };


    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen bg-[var(--bg-secondary)]"><LoadingSpinner /></div>;
    }

    return (
        <div className="flex min-h-screen bg-[var(--bg-secondary)] text-[var(--text-primary)]">
            <AdminSidebar user={user} onLogout={handleLogout} activeView={activeView} setActiveView={setActiveView} />
            <div className="flex-grow ml-64"> {/* Offset for fixed sidebar */}
                <div className="p-4 md:p-8">
                     <header className="mb-8">
                        <div>
                            <h1 className="text-3xl font-bold capitalize">{activeView} Management</h1>
                            <p className="text-[var(--text-secondary)]">Manage your website content efficiently.</p>
                        </div>
                    </header>

                    <main className="space-y-12">
                        {activeView === 'about' && (
                            <div className="bg-[var(--bg-primary)] p-6 rounded-lg shadow-lg border border-[var(--border-color)]">
                                <h2 className="text-2xl font-bold mb-4 text-[var(--primary-color)] flex items-center"><i className="fas fa-info-circle mr-3"></i>About Section</h2>
                                <textarea 
                                    value={aboutText} 
                                    onChange={e => setAboutText(e.target.value)}
                                    rows={10}
                                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-all"
                                    placeholder="Enter the content for the 'About Us' section..."
                                />
                                <button onClick={handleAboutSave} className="mt-4 bg-[var(--primary-color)] hover:brightness-110 text-gray-900 font-bold py-2 px-6 rounded transition-colors flex items-center space-x-2">
                                    <i className="fas fa-save"></i>
                                    <span>Save About Content</span>
                                </button>
                            </div>
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
                                                <img src={project.posterUrl} alt={project.title} className="w-16 h-10 object-cover rounded-md hidden sm:block" />
                                                <div>
                                                    <h3 className="font-bold text-lg flex items-center gap-2">{project.title} 
                                                        {project.status && <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[project.status]}`}>{project.status}</span>}
                                                    </h3>
                                                    <p className="text-sm text-[var(--text-secondary)]">{project.releaseYear} &bull; {project.projectType}</p>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button onClick={() => openAssignmentModal(project)} aria-label="Manage Cast & Crew" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded text-sm"><i className="fas fa-users"></i></button>
                                                <button onClick={() => openEditModal(project)} aria-label="Edit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded text-sm"><i className="fas fa-pencil-alt"></i></button>
                                                <button onClick={() => handleProjectDelete(project.$id)} aria-label="Delete" className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded text-sm"><i className="fas fa-trash"></i></button>
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-center text-[var(--text-secondary)] py-4">No projects found. Click "Add New Project" to get started.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeView === 'cast' && (
                             <div className="bg-[var(--bg-primary)] p-6 rounded-lg shadow-lg border border-[var(--border-color)]">
                                <div className="flex justify-between items-center mb-4">
                                     <h2 className="text-2xl font-bold text-[var(--primary-color)] flex items-center"><i className="fas fa-user-friends mr-3"></i>Cast Members</h2>
                                     <button onClick={() => openMemberModal(null, 'cast')} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors flex items-center space-x-2">
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
                                            <div className="flex space-x-2"><button onClick={() => openMemberModal(member, 'cast')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded text-sm"><i className="fas fa-pencil-alt"></i></button><button onClick={() => handleMemberDelete(member.$id, 'cast')} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded text-sm"><i className="fas fa-trash"></i></button></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeView === 'crew' && (
                             <div className="bg-[var(--bg-primary)] p-6 rounded-lg shadow-lg border border-[var(--border-color)]">
                                <div className="flex justify-between items-center mb-4">
                                     <h2 className="text-2xl font-bold text-[var(--primary-color)] flex items-center"><i className="fas fa-users-cog mr-3"></i>Crew Members</h2>
                                     <button onClick={() => openMemberModal(null, 'crew')} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors flex items-center space-x-2">
                                         <i className="fas fa-plus"></i><span>Add New Member</span>
                                     </button>
                                </div>
                                <div className="space-y-4">
                                    {allCrew.map(member => (
                                        <div key={member.$id} className="bg-[var(--bg-secondary)] p-4 rounded-md flex justify-between items-center border border-[var(--border-color)]">
                                            <div>
                                                <h3 className="font-bold text-lg">{member.name}</h3>
                                                <p className="text-sm text-[var(--text-secondary)]">{member.role}</p>
                                            </div>
                                            <div className="flex space-x-2"><button onClick={() => openMemberModal(member, 'crew')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded text-sm"><i className="fas fa-pencil-alt"></i></button><button onClick={() => handleMemberDelete(member.$id, 'crew')} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded text-sm"><i className="fas fa-trash"></i></button></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeView === 'media' && <MediaPanel fileUsageMap={fileUsageMap} />}
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
                                            <input id="posterUrl" type="text" name="posterUrl" value={projectForm.posterUrl} onChange={handleProjectFormChange} placeholder="Enter URL or select from media" required className="flex-grow bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]" />
                                            <button type="button" onClick={() => openMediaModalFor(url => setProjectForm(prev => ({...prev, posterUrl: url})))} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded text-sm whitespace-nowrap" aria-label="Select from Media Library">
                                                <i className="fas fa-photo-video"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="language" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Language</label>
                                            <input type="text" name="language" value={projectForm.language} onChange={handleProjectFormChange} placeholder="e.g., English" className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]" />
                                        </div>
                                        <div>
                                            <label htmlFor="runtime" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Runtime (minutes)</label>
                                            <input type="number" name="runtime" value={projectForm.runtime} onChange={handleProjectFormChange} placeholder="e.g., 120" className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]" />
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
                                <h2 className="text-2xl font-bold mb-6">{editingMember ? 'Edit' : 'Create'} {memberType} Member</h2>
                                <form onSubmit={handleMemberSubmit} className="space-y-4">
                                    <input type="text" name="name" value={memberForm.name} onChange={handleMemberFormChange} placeholder="Name" required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" />
                                    <input type="text" name="role" value={memberForm.role} onChange={handleMemberFormChange} placeholder="Role (e.g., Director, Actor)" required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" />
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

                    {isMediaModalOpen && <MediaLibraryModal onSelect={(url) => { mediaModalCallback(url); setIsMediaModalOpen(false); }} onClose={() => setIsMediaModalOpen(false)} fileUsageMap={fileUsageMap} />}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;