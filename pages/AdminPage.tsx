
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import AdminLogin from '../components/AdminLogin';
import AdminDashboard from '../components/AdminDashboard';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminPage: React.FC = () => {
    const { user, setUser, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-800">
                <LoadingSpinner />
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-gray-800 text-gray-100">
            {user ? <AdminDashboard user={user} onLogout={() => setUser(null)} /> : <AdminLogin onLoginSuccess={setUser} />}
        </div>
    );
};

export default AdminPage;
