
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

const navStructure = [
    { type: 'item', id: 'home', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
    { type: 'link', href: '/production-hub', label: 'Production Hub', icon: 'fas fa-tv' },
    { type: 'item', id: 'media', label: 'Media Library', icon: 'fas fa-photo-video' },
    { type: 'item', id: 'settings', label: 'Site Settings', icon: 'fas fa-cogs' },
];

const AdminSidebar: React.FC<AdminSidebarProps> = ({ user, onLogout, activeView, setActiveView }) => {
    const { settings } = useSettings();
    const { adminTheme, toggleAdminTheme } = useTheme();

    const adminTitle = settings?.adminTitle || 'FirstVideos Admin';
    const adminTitleParts = adminTitle.split(' ');
    const coloredPart = adminTitleParts.pop() || 'Admin';
    const mainPart = adminTitleParts.join(' ');

    return (
        <div className="w-64 bg-[var(--bg-card)] text-[var(--text-primary)] flex flex-col h-screen fixed top-0 left-0 border-r border-[var(--border-color)]">
            <div className="p-6 text-center border-b border-[var(--border-color)]">
                <h2 className="text-2xl font-black tracking-wider uppercase">{mainPart} <span className="text-[var(--primary-color)]">{coloredPart}</span></h2>
            </div>
            <nav className="flex-grow p-4 overflow-y-auto">
                <ul>
                    {navStructure.map(navItem => {
                        if (navItem.type === 'item') {
                            return (
                                <li key={navItem.id}>
                                    <button
                                        onClick={() => setActiveView(navItem.id)}
                                        className={`w-full text-left flex items-center p-3 my-1 rounded-lg transition-colors duration-200 ${
                                            activeView === navItem.id ? 'bg-[var(--primary-color)] text-gray-900 font-bold' : 'hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                                        }`}
                                        aria-current={activeView === navItem.id ? 'page' : undefined}
                                    >
                                        <i className={`${navItem.icon} w-6 text-center text-lg`}></i>
                                        <span className="ml-3 font-medium">{navItem.label}</span>
                                    </button>
                                </li>
                            );
                        }
                        if (navItem.type === 'link') {
                            return (
                                <li key={navItem.href}>
                                    <Link
                                        to={navItem.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full text-left flex items-center p-3 my-1 rounded-lg transition-colors duration-200 hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                                    >
                                        <i className={`${navItem.icon} w-6 text-center text-lg`}></i>
                                        <span className="ml-3 font-medium">{navItem.label}</span>
                                        <i className="fas fa-external-link-alt ml-auto text-xs text-[var(--text-secondary)]"></i>
                                    </Link>
                                </li>
                            );
                        }
                        return null;
                    })}
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
