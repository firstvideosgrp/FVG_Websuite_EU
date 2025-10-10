import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSiteSettings, updateSiteSettings as apiUpdateSettings } from '../services/appwrite';
import type { SiteSettings } from '../types';
import type { Models } from 'appwrite';
import { useNotification } from './NotificationContext';

interface SettingsContextType {
  settings: SiteSettings | null;
  loading: boolean;
  isUpdating: boolean;
  updateSettings: (newSettings: Partial<Omit<SiteSettings, keyof Models.Document>>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const applySettings = (settings: SiteSettings) => {
    document.title = settings.siteTitle;
    const root = document.documentElement;
    root.style.setProperty('--primary-color', settings.primaryColor);
    root.style.setProperty('--secondary-color', settings.secondaryColor);
};

const defaultSettings: Omit<SiteSettings, keyof Models.Document> = {
    siteTitle: 'FirstVideos Group',
    primaryColor: '#22d3ee', // tailwind cyan-400
    secondaryColor: '#f3f4f6', // tailwind gray-100
    adminTitle: 'FirstVideos Admin',
    footerText: `© {year} FirstVideos Group. All Rights Reserved.`,
    siteVersion: '1.0.0',
    socialLinks: '[]',
    footerLinks: '[]',
    heroBackgroundImageUrl: 'https://picsum.photos/1920/1080?grayscale&blur=2',
    heroTitle: 'Storytelling Redefined',
    heroDescription: 'FirstVideos Group crafts compelling narratives that captivate audiences and shape the future of entertainment.',
    heroButtonText: 'View Our Work',
    heroUseImage: true,
    heroUsePlexus: false,
    logoLightUrl: '',
    logoDarkUrl: '',
    customBeepSoundUrl: '',
};


export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    // Cannot use useNotification here as it's not a child of NotificationProvider
    // Errors will be handled where the updateSettings function is called.

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const data = await getSiteSettings();
                if (data) {
                    setSettings(data);
                    applySettings(data);
                } else {
                    console.warn("No site settings found in the database. Using default settings. Please configure them in the admin panel.");
                    // Create a non-persistent settings object for display
                    const tempSettings: SiteSettings = {
                        ...defaultSettings,
                        $id: '', $collectionId: '', $databaseId: '', $createdAt: '', $updatedAt: '', $permissions: [],
                        // FIX: Added missing '$sequence' property to satisfy the Appwrite Models.Document interface, resolving a type error.
                        $sequence: 0,
                    };
                    setSettings(tempSettings);
                    applySettings(tempSettings);
                }
            } catch (error) {
                console.error("Failed to load site settings", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const updateSettings = async (newSettingsData: Partial<Omit<SiteSettings, keyof Models.Document>>) => {
        if (!settings || !settings.$id) {
             throw new Error("Settings not loaded yet or missing document ID. Cannot update settings. Initial settings document not found in database.");
        }
        
        setIsUpdating(true);
        try {
            await apiUpdateSettings(settings.$id, newSettingsData);
            const updatedSettings: SiteSettings = { ...settings, ...newSettingsData };
            setSettings(updatedSettings);
            applySettings(updatedSettings);
        } catch (error) {
            console.error("Failed to update settings:", error);
            throw error;
        } finally {
            setIsUpdating(false);
        }
    };

    const value = { settings, loading, isUpdating, updateSettings };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = (): SettingsContextType => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};