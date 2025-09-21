
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import AdminLogin from '../components/AdminLogin';
import AdminDashboard from '../components/AdminDashboard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useTheme } from '../contexts/ThemeContext';

const AdminPage: React.FC = () => {
    const { user, setUser, loading } = useAuth();
    const { adminTheme } = useTheme();

    return (
        <div className={`min-h-screen bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-colors duration-300 ${adminTheme}`}>
            {loading ? (
                 <div className="flex items-center justify-center min-h-screen">
                    <LoadingSpinner />
                </div>
            ) : (
                <>
                    {user ? <AdminDashboard user={user} onLogout={() => setUser(null)} /> : <AdminLogin onLoginSuccess={setUser} />}
                </>
            )}
        </div>
    );
};

export default AdminPage;