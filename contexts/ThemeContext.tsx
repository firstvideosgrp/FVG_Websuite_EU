import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  siteTheme: Theme;
  adminTheme: Theme;
  toggleSiteTheme: () => void;
  toggleAdminTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getInitialTheme = (key: string): Theme => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const storedPrefs = window.localStorage.getItem(key);
    if (typeof storedPrefs === 'string' && (storedPrefs === 'light' || storedPrefs === 'dark')) {
      return storedPrefs;
    }

    const userMedia = window.matchMedia('(prefers-color-scheme: dark)');
    if (userMedia.matches) {
      return 'dark';
    }
  }
  return 'dark'; // Default to dark theme
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [siteTheme, setSiteTheme] = useState<Theme>(() => getInitialTheme('siteTheme'));
  const [adminTheme, setAdminTheme] = useState<Theme>(() => getInitialTheme('adminTheme'));

  useEffect(() => {
    try {
      window.localStorage.setItem('siteTheme', siteTheme);
    } catch (e) {
      console.error("Could not save site theme to localStorage", e);
    }
  }, [siteTheme]);

  useEffect(() => {
    try {
      window.localStorage.setItem('adminTheme', adminTheme);
    } catch (e) {
      console.error("Could not save admin theme to localStorage", e);
    }
  }, [adminTheme]);

  const toggleSiteTheme = () => {
    setSiteTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const toggleAdminTheme = () => {
    setAdminTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const value = { siteTheme, adminTheme, toggleSiteTheme, toggleAdminTheme };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};