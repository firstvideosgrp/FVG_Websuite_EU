
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LoadingSpinner from './components/LoadingSpinner';
import { NotificationProvider } from './contexts/NotificationContext';
import { ConfirmationDialogProvider } from './contexts/ConfirmationDialogContext';
import NotificationContainer from './components/NotificationContainer';
import ConfirmationDialog from './components/ConfirmationDialog';

function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <NotificationProvider>
          <ConfirmationDialogProvider>
            <AppContent />
          </ConfirmationDialogProvider>
        </NotificationProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const { loading: settingsLoading } = useSettings();

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg-primary)]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </HashRouter>
      <NotificationContainer />
      <ConfirmationDialog />
    </>
  );
}

export default App;