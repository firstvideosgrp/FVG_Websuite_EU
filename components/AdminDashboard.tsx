import React, { useState, useEffect, useCallback } from 'react';
import { logout, getAboutContent, updateAboutContent, getProjects, createProject, updateProject, deleteProject } from '../services/appwrite';
import type { Models } from 'appwrite';
import type { AboutContent, Project, ProjectStatus, ProjectType, CastMember } from '../types';
import LoadingSpinner from './LoadingSpinner';
import AdminSidebar from './AdminSidebar';
import SiteSettingsPanel from './SiteSettingsPanel';
import MediaPanel from './MediaPanel';
import MediaLibraryModal from './MediaLibraryModal';

interface AdminDashboardProps {
    user: Models.User<Models.Preferences>;
    onLogout: () => void;
}

const statusColors: Record<ProjectStatus, string> = {
    'Released': 'bg-green-500/20 text-green-300',
    'In Production': 'bg-yellow-500/20 text-yellow-300',
    'Upcoming': 'bg-blue-500/20 text-blue-300',
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
    const [activeView, setActiveView] = useState('projects');
    const [about, setAbout] = useState<AboutContent | null>(null);
    const [aboutText, setAboutText] = useState('');
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditingProject, setIsEditingProject] = useState<Project | null>(null);
    const [isCreatingProject, setIsCreatingProject] = useState(false);
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    const [managingCastProject, setManagingCastProject] = useState<Project | null>(null);
    const [currentCast, setCurrentCast] = useState<CastMember[]>([]);
    
    const [projectForm, setProjectForm] = useState({
        title: '',
        description: '',
        posterUrl: '',
        synopsis: '',
        releaseYear: new Date().getFullYear(),
        projectType: 'Movie' as ProjectType,
        status: 'Upcoming' as ProjectStatus,
        dueDate: ''
    });

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
            const [aboutData, projectsData] = await Promise.all([getAboutContent(), getProjects()]);
            setAbout(aboutData);
            setAboutText(aboutData?.content || '');
            setProjects(projectsData);
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
        const { name, value } = e.target;
        setProjectForm(prev => ({ ...prev, [name]: name === 'releaseYear' ? parseInt(value) : value }));
    };
    
    const handleImageSelect = (url: string) => {
        setProjectForm(prev => ({ ...prev, posterUrl: url }));
        setIsMediaModalOpen(false);
    };

    const handleProjectSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (['Upcoming', 'In Production'].includes(projectForm.status) && !projectForm.dueDate) {
            alert('Due Date is required for projects that are "Upcoming" or "In Production".');
            return;
        }

        try {
            // Ensure dueDate is null if not applicable
            const dataToSubmit = {
                ...projectForm,
                dueDate: ['Upcoming', 'In Production'].includes(projectForm.status) ? projectForm.dueDate : null,
            };

            if (isEditingProject) {
                // The Appwrite SDK expects null for optional fields that should be cleared, not empty strings
                await updateProject(isEditingProject.$id, dataToSubmit);
                alert('Project updated!');
            } else {
                await createProject({ ...dataToSubmit, castAndCrew: '[]'});
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
            releaseYear: project.releaseYear,
            projectType: project.projectType || 'Movie',
            status: project.status || 'Released',
            dueDate: project.dueDate ? new Date(project.dueDate).toISOString().split('T')[0] : ''
        });
    };
    
    const openCreateModal = () => {
        setIsCreatingProject(true);
        setProjectForm({ 
            title: '', 
            description: '', 
            posterUrl: '', 
            synopsis: '',
            releaseYear: new Date().getFullYear(),
            projectType: 'Movie',
            status: 'Upcoming',
            dueDate: ''
        });
    };

    const closeModal = () => {
        setIsEditingProject(null);
        setIsCreatingProject(false);
    };

    const openCastModal = (project: Project) => {
        setManagingCastProject(project);
        try {
            const cast = project.castAndCrew ? JSON.parse(project.castAndCrew) : [];
            setCurrentCast(cast.map((c: Omit<CastMember, 'id'>) => ({...c, id: crypto.randomUUID()})));
        } catch {
            setCurrentCast([]);
        }
    };

    const closeCastModal = () => {
        setManagingCastProject(null);
        setCurrentCast([]);
    };

    const handleCastChange = (id: string, field: 'name' | 'role', value: string) => {
        setCurrentCast(prev => prev.map(member => member.id === id ? {...member, [field]: value} : member));
    };

    const addCastMember = () => {
        setCurrentCast(prev => [...prev, { id: crypto.randomUUID(), name: '', role: '' }]);
    };
    
    const removeCastMember = (id: string) => {
        setCurrentCast(prev => prev.filter(m => m.id !== id));
    };

    const handleCastSubmit = async () => {
        if (!managingCastProject) return;
        try {
            const castToSave = currentCast.map(({ id, ...rest }) => rest);
            await updateProject(managingCastProject.$id, { castAndCrew: JSON.stringify(castToSave) });
            alert('Cast & Crew updated!');
            closeCastModal();
            fetchData();
        } catch (error) {
            console.error("Failed to update cast & crew", error);
            alert("Failed to update cast & crew.");
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
                                                <button onClick={() => openCastModal(project)} aria-label="Manage Cast & Crew" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded text-sm"><i className="fas fa-users"></i></button>
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

                        {activeView === 'media' && <MediaPanel />}

                        {activeView === 'settings' && <SiteSettingsPanel />}
                    </main>
                    
                    {(isEditingProject || isCreatingProject) && (
                         <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                             <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-lg shadow-2xl w-full max-w-lg relative text-[var(--text-primary)] max-h-[90vh] overflow-y-auto">
                                 <button onClick={closeModal} aria-label="Close modal" className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-2xl">&times;</button>
                                 <h2 className="text-2xl font-bold mb-6">{isEditingProject ? 'Edit Project' : 'Create Project'}</h2>
                                 <form onSubmit={handleProjectSubmit} className="space-y-4">
                                     <input type="text" name="title" value={projectForm.title} onChange={handleProjectFormChange} placeholder="Title" required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]" />
                                     <textarea name="description" value={projectForm.description} onChange={handleProjectFormChange} placeholder="Short Description" required rows={3} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]" />
                                     <textarea name="synopsis" value={projectForm.synopsis} onChange={handleProjectFormChange} placeholder="Movie Synopsis" rows={5} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]" />
                                     <div>
                                        <label htmlFor="posterUrl" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Poster Image URL</label>
                                        <div className="flex items-center space-x-2">
                                            <input id="posterUrl" type="text" name="posterUrl" value={projectForm.posterUrl} onChange={handleProjectFormChange} placeholder="Enter URL or select from media" required className="flex-grow bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]" />
                                            <button type="button" onClick={() => setIsMediaModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded text-sm whitespace-nowrap" aria-label="Select from Media Library">
                                                <i className="fas fa-photo-video"></i>
                                            </button>
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
                                            <i className="fas fa-times"></i>
                                            <span>Cancel</span>
                                         </button>
                                         <button type="submit" className="bg-[var(--primary-color)] hover:brightness-110 text-gray-900 font-bold py-2 px-4 rounded transition-colors flex items-center space-x-2">
                                            <i className="fas fa-save"></i>
                                            <span>Save Project</span>
                                         </button>
                                     </div>
                                 </form>
                             </div>
                         </div>
                    )}

                    {managingCastProject && (
                         <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                             <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-lg shadow-2xl w-full max-w-2xl relative text-[var(--text-primary)] max-h-[90vh] flex flex-col">
                                 <button onClick={closeCastModal} aria-label="Close modal" className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-2xl">&times;</button>
                                 <h2 className="text-2xl font-bold mb-1">Manage Cast & Crew</h2>
                                 <p className="text-[var(--text-secondary)] mb-6 border-b border-[var(--border-color)] pb-4">For: <span className="font-semibold text-[var(--text-primary)]">{managingCastProject.title}</span></p>
                                 
                                 <div className="space-y-3 flex-grow overflow-y-auto pr-2">
                                    {currentCast.map((member) => (
                                        <div key={member.id} className="flex items-center space-x-2 p-2 bg-[var(--bg-secondary)] rounded-md">
                                            <input type="text" value={member.name} onChange={(e) => handleCastChange(member.id, 'name', e.target.value)} placeholder="Name (e.g., John Doe)" className="w-1/2 bg-[var(--input-bg)] border border-[var(--border-color)] rounded p-2" />
                                            <input type="text" value={member.role} onChange={(e) => handleCastChange(member.id, 'role', e.target.value)} placeholder="Role (e.g., Director)" className="flex-grow bg-[var(--input-bg)] border border-[var(--border-color)] rounded p-2" />
                                            <button type="button" onClick={() => removeCastMember(member.id)} className="bg-red-600 hover:bg-red-700 text-white font-bold p-2 rounded w-10 h-10 flex items-center justify-center"><i className="fas fa-trash"></i></button>
                                        </div>
                                    ))}
                                    {currentCast.length === 0 && <p className="text-[var(--text-secondary)] text-center py-4">No cast or crew members added yet.</p>}
                                 </div>
                                 
                                 <div className="pt-4 mt-4 border-t border-[var(--border-color)] flex justify-between items-center">
                                    <button type="button" onClick={addCastMember} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm flex items-center space-x-2"><i className="fas fa-plus"></i><span>Add Member</span></button>
                                    <div className="flex space-x-4">
                                        <button type="button" onClick={closeCastModal} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors">Cancel</button>
                                        <button type="button" onClick={handleCastSubmit} className="bg-[var(--primary-color)] hover:brightness-110 text-gray-900 font-bold py-2 px-4 rounded transition-colors">Save Changes</button>
                                    </div>
                                 </div>
                             </div>
                         </div>
                    )}

                    {isMediaModalOpen && <MediaLibraryModal onSelect={handleImageSelect} onClose={() => setIsMediaModalOpen(false)} />}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;