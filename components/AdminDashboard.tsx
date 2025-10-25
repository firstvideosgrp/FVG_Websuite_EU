import React, { useState, useEffect, useCallback } from 'react';
import { logout, getProjects, getCast, getCrew, getTasks, getProductionPhasesForProject, getDepartments } from '../services/appwrite';
import type { Models } from 'appwrite';
import type { Project, CastMember, CrewMember, ProductionTask, ProductionPhase } from '../types';
import LoadingSpinner from './LoadingSpinner';
import AdminSidebar from './AdminSidebar';
// FIX: Changed import to a named import. The error indicates that SiteSettingsPanel is not a default export.
import { SiteSettingsPanel } from './SiteSettingsPanel';
import MediaPanel from './MediaPanel';
import { useSettings } from '../contexts/SettingsContext';
import AdminHome from './AdminHome';

interface AdminDashboardProps {
    user: Models.User<Models.Preferences>;
    onLogout: () => void;
}

const getFileIdFromUrl = (url: string): string | null => {
    if (!url) return null;
    const match = url.match(/\/files\/([a-zA-Z0-9_.-]+)\/view/);
    return match ? match[1] : null;
};

const viewTitles: { [key: string]: string } = {
    home: 'Dashboard',
    media: 'Media Library',
    settings: 'Site Settings',
};

const viewDescriptions: { [key: string]: string } = {
    home: 'An overview of your active productions and site status.',
    media: 'Manage all public-facing images, logos, and other media assets.',
    settings: 'Configure global site settings, appearance, and integrations.',
};


const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
    const { settings } = useSettings();
    const [activeView, setActiveView] = useState('home');
    // Page Content State
    const [projects, setProjects] = useState<Project[]>([]);
    const [allCast, setAllCast] = useState<CastMember[]>([]);
    const [allCrew, setAllCrew] = useState<CrewMember[]>([]);
    const [tasks, setTasks] = useState<ProductionTask[]>([]);
    const [allPhases, setAllPhases] = useState<ProductionPhase[]>([]);
    // Loading State
    const [isLoading, setIsLoading] = useState(true);
    const [fileUsageMap, setFileUsageMap] = useState<Map<string, string[]>>(new Map());

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
            const [projectsData, castData, crewData, tasksData] = await Promise.all([
                getProjects(),
                getCast(),
                getCrew(),
                getTasks(),
            ]);
            const phasesData = await Promise.all(projectsData.map(p => getProductionPhasesForProject(p.$id))).then(res => res.flat());
            setProjects(projectsData);
            setAllCast(castData);
            setAllCrew(crewData);
            setTasks(tasksData);
            setAllPhases(phasesData);
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen bg-[var(--bg-secondary)]"><LoadingSpinner /></div>;
    }

    const currentTitle = viewTitles[activeView] || `${activeView.charAt(0).toUpperCase() + activeView.slice(1)} Management`;
    const currentDescription = viewDescriptions[activeView] || 'Manage your website content efficiently.';

    return (
        <div className="flex min-h-screen bg-[var(--bg-secondary)] text-[var(--text-primary)]">
            <AdminSidebar user={user} onLogout={handleLogout} activeView={activeView} setActiveView={setActiveView} />
            <div className="flex-grow ml-64"> {/* Offset for fixed sidebar */}
                <div className="p-4 md:p-8">
                     <header className="mb-8">
                        <div>
                            <h1 className="text-3xl font-bold">{currentTitle}</h1>
                            <p className="text-[var(--text-secondary)]">{currentDescription}</p>
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

                        {activeView === 'media' && <MediaPanel fileUsageMap={fileUsageMap} />}
                        {activeView === 'settings' && <SiteSettingsPanel fileUsageMap={fileUsageMap} />}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;