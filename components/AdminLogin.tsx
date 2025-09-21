
import React, { useState } from 'react';
import { login } from '../services/appwrite';
import type { Models } from 'appwrite';

interface AdminLoginProps {
  onLoginSuccess: (user: Models.User<Models.Preferences>) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      const user = await import('../services/appwrite').then(module => module.getCurrentUser());
      onLoginSuccess(user);
    } catch (err) {
      setError('Invalid credentials. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-8 bg-[var(--bg-card)] rounded-lg shadow-2xl border border-[var(--border-color)]">
        <div className="text-center">
          <h1 className="text-3xl font-black uppercase text-[var(--text-primary)]">Admin <span className="text-[var(--primary-color)]">Login</span></h1>
          <p className="mt-2 text-[var(--text-secondary)]">Manage FirstVideos Group Content</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] rounded-t-md focus:outline-none focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] rounded-b-md focus:outline-none focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-gray-900 bg-[var(--primary-color)] hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-[var(--primary-color)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;