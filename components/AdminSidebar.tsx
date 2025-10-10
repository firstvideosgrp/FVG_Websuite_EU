import React from 'react';
import { Link } from 'react-router-dom';
import type { Models } from 'appwrite';
import { useSettings } from '../contexts/SettingsContext';
import { useTheme } from '../contexts/ThemeContext';

interface AdminSidebarProps {
    user: Models.User<Models.Preferences>;
    onLogout: () => void;
    activeView: string;
    setActiveView: (view: string) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ user, onLogout, activeView, setActiveView }) => {
    const { settings } = useSettings();
    const { adminTheme, toggleAdminTheme } = useTheme();
    const adminTitle = settings?.adminTitle || 'FirstVideos Admin';
    const adminTitleParts = adminTitle.split(' ');
    const coloredPart = adminTitleParts.pop() || 'Admin';
    const mainPart = adminTitleParts.join(' ');


    const navItems = [
        { id: 'home', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
        { id: 'about', label: 'About Section', icon: 'fas fa-info-circle' },
        { id: 'projects', label: 'Projects', icon: 'fas fa-film' },
        { id: 'phases', label: 'Production Phases', icon: 'fas fa-tasks' },
        { id: 'tasks', label: 'Task Manager', icon: 'fas fa-check-square' },
        { id: 'slate', label: 'Timecode Slate', icon: 'fas fa-clipboard' },
        { id: 'departments', label: 'Departments & Crew', icon: 'fas fa-building' },
        { id: 'cast', label: 'Cast Members', icon: 'fas fa-user-friends' },
        { id: 'media', label: 'Media Library', icon: 'fas fa-photo-video' },
        { id: 'elements', label: 'Elements Library', icon: 'fas fa-archive' },
        { id: 'settings', label: 'Site Settings', icon: 'fas fa-cogs' },
    ];

    return (
        <div className="w-64 bg-[var(--bg-card)] text-[var(--text-primary)] flex flex-col h-screen fixed top-0 left-0 border-r border-[var(--border-color)]">
            <div className="p-6 text-center border-b border-[var(--border-color)]">
                <h2 className="text-2xl font-black tracking-wider uppercase">{mainPart} <span className="text-[var(--primary-color)]">{coloredPart}</span></h2>
            </div>
            <nav className="flex-grow p-4">
                <ul>
                    {navItems.map(item => (
                        <li key={item.id}>
                            <button
                                onClick={() => setActiveView(item.id)}
                                className={`w-full text-left flex items-center p-3 my-1 rounded-lg transition-colors duration-200 ${
                                    activeView === item.id ? 'bg-[var(--primary-color)] text-gray-900 font-bold' : 'hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                                }`}
                                aria-current={activeView === item.id ? 'page' : undefined}
                            >
                                <i className={`${item.icon} w-6 text-center text-lg`}></i>
                                <span className="ml-3 font-medium">{item.label}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="p-4 border-t border-[var(--border-color)]">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <p className="text-xs text-[var(--text-secondary)]">Logged in as</p>
                        <p className="text-sm font-semibold truncate" title={user.email}>{user.name || user.email}</p>
                    </div>
                     <button
                        onClick={toggleAdminTheme}
                        className="text-[var(--text-secondary)] hover:text-[var(--primary-color)] text-xl w-10 h-10 flex items-center justify-center rounded-lg transition-colors"
                        aria-label="Toggle admin panel theme"
                    >
                        <i className={`fas ${adminTheme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
                    </button>
                </div>
                <Link
                    to="/"
                    className="w-full mb-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors flex items-center justify-center space-x-2"
                >
                    <i className="fas fa-arrow-left"></i>
                    <span>Back to Site</span>
                </Link>
                <button
                    onClick={onLogout}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors flex items-center justify-center space-x-2"
                >
                    <i className="fas fa-sign-out-alt"></i>
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default AdminSidebar;