
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import AdminLogin from '../components/AdminLogin';
import ProductionStagesDashboard from '../components/ProductionStagesDashboard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useTheme } from '../contexts/ThemeContext';
import { Link } from 'react-router-dom';

const ProductionStagesPage: React.FC = () => {
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
                    {user ? (
                        <ProductionStagesDashboard user={user} onLogout={() => setUser(null)} />
                    ) : (
                        <div className="flex flex-col items-center justify-center min-h-screen">
                            <AdminLogin onLoginSuccess={setUser} />
                            <Link to="/" className="mt-8 text-sm text-[var(--text-secondary)] hover:text-[var(--primary-color)]">
                                &larr; Back to Home
                            </Link>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ProductionStagesPage;
