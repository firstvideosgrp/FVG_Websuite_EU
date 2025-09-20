import React from 'react';
import { Link } from 'react-router-dom';
import type { Models } from 'appwrite';
import { useSettings } from '../contexts/SettingsContext';

interface AdminSidebarProps {
    user: Models.User<Models.Preferences>;
    onLogout: () => void;
    activeView: string;
    setActiveView: (view: string) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ user, onLogout, activeView, setActiveView }) => {
    const { settings } = useSettings();
    const adminTitle = settings?.adminTitle || 'FirstVideos Admin';
    const adminTitleParts = adminTitle.split(' ');
    const coloredPart = adminTitleParts.pop() || 'Admin';
    const mainPart = adminTitleParts.join(' ');


    const navItems = [
        { id: 'about', label: 'About Section', icon: 'fas fa-info-circle' },
        { id: 'projects', label: 'Projects', icon: 'fas fa-film' },
        { id: 'media', label: 'Media Library', icon: 'fas fa-photo-video' },
        { id: 'settings', label: 'Site Settings', icon: 'fas fa-cogs' },
    ];

    return (
        <div className="w-64 bg-gray-900 text-white flex flex-col h-screen fixed top-0 left-0">
            <div className="p-6 text-center border-b border-gray-700">
                <h2 className="text-2xl font-black tracking-wider uppercase">{mainPart} <span className="text-[var(--primary-color)]">{coloredPart}</span></h2>
            </div>
            <nav className="flex-grow p-4">
                <ul>
                    {navItems.map(item => (
                        <li key={item.id}>
                            <button
                                onClick={() => setActiveView(item.id)}
                                className={`w-full text-left flex items-center p-3 my-1 rounded-lg transition-colors duration-200 ${
                                    activeView === item.id ? 'bg-[var(--primary-color)] text-gray-900 font-bold' : 'hover:bg-gray-700 text-white'
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
            <div className="p-4 border-t border-gray-700">
                <div className="mb-4">
                    <p className="text-xs text-gray-400">Logged in as</p>
                    <p className="text-sm font-semibold truncate" title={user.email}>{user.name || user.email}</p>
                </div>
                <Link
                    to="/"
                    className="w-full mb-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors flex items-center justify-center space-x-2"
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