
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import ProductionHubPage from './pages/ProductionHubPage';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LoadingSpinner from './components/LoadingSpinner';
import { NotificationProvider } from './contexts/NotificationContext';
import { ConfirmationDialogProvider } from './contexts/ConfirmationDialogContext';
import NotificationContainer from './components/NotificationContainer';
import ConfirmationDialog from './components/ConfirmationDialog';
import ProductionStagesPage from './pages/ProductionStagesPage';
import SoundtrackSearcherPage from './pages/SoundtrackSearcherPage';

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
          <Route path="/production-hub" element={<ProductionHubPage />} />
          <Route path="/production-stages" element={<ProductionStagesPage />} />
          <Route path="/tools/soundtrack-searcher" element={<SoundtrackSearcherPage />} />
        </Routes>
      </HashRouter>
      <NotificationContainer />
      <ConfirmationDialog />
    </>
  );
}

export default App;