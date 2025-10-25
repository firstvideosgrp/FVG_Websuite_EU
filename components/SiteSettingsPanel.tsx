import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { sendTestEmail } from '../services/appwrite';
import type { SocialLink, FooterLink, SiteSettings, StaticContactInfo, AboutContent } from '../types';
import MediaLibraryModal from './MediaLibraryModal';
import { useNotification } from '../contexts/NotificationContext';
import { useConfirmation } from '../contexts/ConfirmationDialogContext';
import * as api from '../services/appwrite';
import LoadingSpinner from './LoadingSpinner';
import PricingPanel from './PricingPanel';

// Add a temporary ID for list rendering
type SocialLinkWithId = SocialLink & { id: string };
type FooterLinkWithId = FooterLink & { id: string };

interface SiteSettingsPanelProps {
    fileUsageMap: Map<string, string[]>;
}

const tabs = [
    { id: 'general', label: 'General', icon: 'fas fa-globe-americas' },
    { id: 'appearance', label: 'Appearance', icon: 'fas fa-palette' },
    { id: 'content', label: 'Content', icon: 'fas fa-paragraph' },
    { id: 'mail', label: 'Mail', icon: 'fas fa-envelope' },
    { id: 'tools', label: 'Tools', icon: 'fas fa-tools' },
];

// FIX: Added a named export to the component to match the import change in AdminDashboard.tsx.
export const SiteSettingsPanel: React.FC<SiteSettingsPanelProps> = ({ fileUsageMap }) => {
    const { settings, updateSettings, isUpdating } = useSettings();
    const { addNotification } = useNotification();
    const { confirm } = useConfirmation();
    const [activeTab, setActiveTab] = useState('general');
    
    // About Section State
    const [about, setAbout] = useState<AboutContent | null>(null);
    const [aboutText, setAboutText] = useState('');
    const [isAboutLoading, setIsAboutLoading] = useState(true);
    
    const initialFormState = useMemo(() => {
        let socialLinks: SocialLinkWithId[] = [];
        let footerLinks: FooterLinkWithId[] = [];

        try {
            if (settings?.socialLinks) {
                socialLinks = JSON.parse(settings.socialLinks).map((link: SocialLink) => ({...link, id: crypto.randomUUID()}));
            }
        } catch (e) { console.error("Failed to parse social links JSON", e); }
        
        try {
            if (settings?.footerLinks) {
                footerLinks = JSON.parse(settings.footerLinks).map((link: FooterLink) => ({...link, id: crypto.randomUUID()}));
            }
        } catch (e) { console.error("Failed to parse footer links JSON", e); }
        
        return {
            siteTitle: settings?.siteTitle || '',
            primaryColor: settings?.primaryColor || '#22d3ee',
            secondaryColor: settings?.secondaryColor || '#f3f4f6',
            adminTitle: settings?.adminTitle || '',
            footerText: settings?.footerText || '',
            siteVersion: settings?.siteVersion || '1.0.0',
            socialLinks,
            footerLinks,
            // Logo Settings
            logoLightUrl: settings?.logoLightUrl || '',
            logoDarkUrl: settings?.logoDarkUrl || '',
            // Hero settings
            heroBackgroundImageUrl: settings?.heroBackgroundImageUrl || '',
            heroTitle: settings?.heroTitle || '',
            heroDescription: settings?.heroDescription || '',
            heroButtonText: settings?.heroButtonText || '',
            heroUseImage: settings?.heroUseImage ?? true,
            heroUsePlexus: settings?.heroUsePlexus ?? false,
            // Mail settings
            mailEnabled: settings?.mailEnabled ?? false,
            mailSenderEmail: settings?.mailSenderEmail || '',
            mailContactRecipient: settings?.mailContactRecipient || '',
            mailSmtpHost: settings?.mailSmtpHost || '',
            mailSmtpPort: settings?.mailSmtpPort || 587,
            mailSmtpEncryption: settings?.mailSmtpEncryption || 'tls',
            mailSmtpUsername: settings?.mailSmtpUsername || '',
            mailSmtpPassword: settings?.mailSmtpPassword || '',
            // Slate Settings
            customBeepSoundUrl: settings?.customBeepSoundUrl || '',
            // Soundtrack Searcher
            strSrcNotificationEnabled: settings?.strSrcNotificationEnabled ?? false,
            strSrcNotificationText: settings?.strSrcNotificationText || '',
            strSrcTopPicksEnabled: settings?.strSrcTopPicksEnabled ?? true,
        }
    }, [settings]);
    
    const [formState, setFormState] = useState(initialFormState);
    const [isDirty, setIsDirty] = useState(false);
    const [testRecipient, setTestRecipient] = useState('');
    const [isSendingTest, setIsSendingTest] = useState(false);
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    const [fieldToSet, setFieldToSet] = useState<'hero' | 'lightLogo' | 'darkLogo' | 'beepSound' | null>(null);

    // New state for Static Contact Info
    const [contactInfo, setContactInfo] = useState<StaticContactInfo[]>([]);
    const [isContactInfoLoading, setIsContactInfoLoading] = useState(true);
    const [isContactInfoModalOpen, setIsContactInfoModalOpen] = useState(false);
    const [editingContactInfo, setEditingContactInfo] = useState<StaticContactInfo | null>(null);
    const [contactInfoForm, setContactInfoForm] = useState({ label: '', value: '', icon: '', url: '' });

    useEffect(() => {
        setFormState(initialFormState);
        setIsDirty(false);
    }, [initialFormState]);

    const fetchAboutContent = useCallback(async () => {
        setIsAboutLoading(true);
        try {
            const data = await api.getAboutContent();
            setAbout(data);
            setAboutText(data?.content || '');
        } catch (e) {
            addNotification('error', 'Load Failed', 'Could not load About section content.');
        } finally {
            setIsAboutLoading(false);
        }
    }, [addNotification]);
    
    const fetchContactInfo = useCallback(async () => {
        setIsContactInfoLoading(true);
        try {
            const data = await api.getStaticContactInfo();
            setContactInfo(data);
        } catch (e) {
            addNotification('error', 'Load Failed', 'Could not load static contact info.');
        } finally {
            setIsContactInfoLoading(false);
        }
    }, [addNotification]);

    useEffect(() => {
        if (activeTab === 'content') {
            fetchAboutContent();
            fetchContactInfo();
        }
    }, [activeTab, fetchAboutContent, fetchContactInfo]);

    useEffect(() => {
        const hasChanged = Object.keys(initialFormState).some(key => {
            const initialValue = initialFormState[key as keyof typeof initialFormState];
            const currentValue = formState[key as keyof typeof formState];
            if (Array.isArray(initialValue) && Array.isArray(currentValue)) {
                const initialComparable = initialValue.map(({id, ...rest}) => rest);
                const currentComparable = currentValue.map(({id, ...rest}) => rest);
                return JSON.stringify(initialComparable) !== JSON.stringify(currentComparable);
            }
            return initialValue !== currentValue;
        });
        setIsDirty(hasChanged);
    }, [formState, initialFormState]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, type } = e.target;
        
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
             if (name === 'heroUseImage') {
                setFormState(prevState => ({ ...prevState, heroUseImage: checked, heroUsePlexus: checked ? false : prevState.heroUsePlexus }));
            } else if (name === 'heroUsePlexus') {
                setFormState(prevState => ({ ...prevState, heroUsePlexus: checked, heroUseImage: checked ? false : prevState.heroUseImage }));
            } else {
                setFormState(prevState => ({ ...prevState, [name]: checked }));
            }
            return;
        }

        const { value } = e.target;
        const isNumberInput = type === 'number';
        setFormState(prevState => ({ 
            ...prevState, 
            [name]: isNumberInput ? parseInt(value, 10) : value 
        }));
    };

    // Social Links Handlers
    const handleSocialLinkChange = (index: number, field: keyof SocialLink, value: string) => {
        const newLinks = [...formState.socialLinks];
        newLinks[index] = { ...newLinks[index], [field]: value };
        setFormState(prev => ({ ...prev, socialLinks: newLinks }));
    };

    const addSocialLink = () => setFormState(prev => ({ ...prev, socialLinks: [...prev.socialLinks, { id: crypto.randomUUID(), icon: '', url: '' }] }));
    const removeSocialLink = (index: number) => setFormState(prev => ({ ...prev, socialLinks: prev.socialLinks.filter((_, i) => i !== index) }));

    // Footer Links Handlers
    const handleFooterLinkChange = (index: number, field: keyof FooterLink, value: string) => {
        const newLinks = [...formState.footerLinks];
        newLinks[index] = { ...newLinks[index], [field]: value };
        setFormState(prev => ({ ...prev, footerLinks: newLinks }));
    };

    const addFooterLink = () => setFormState(prev => ({ ...prev, footerLinks: [...prev.footerLinks, { id: crypto.randomUUID(), label: '', url: '' }] }));
    const removeFooterLink = (index: number) => setFormState(prev => ({ ...prev, footerLinks: prev.footerLinks.filter((_, i) => i !== index) }));
    
    const handleImageSelect = (url: string) => {
        if (fieldToSet === 'hero') {
            setFormState(prev => ({ ...prev, heroBackgroundImageUrl: url }));
        } else if (fieldToSet === 'lightLogo') {
            setFormState(prev => ({ ...prev, logoLightUrl: url }));
        } else if (fieldToSet === 'darkLogo') {
            setFormState(prev => ({ ...prev, logoDarkUrl: url }));
        } else if (fieldToSet === 'beepSound') {
            setFormState(prev => ({ ...prev, customBeepSoundUrl: url }));
        }
        setIsMediaModalOpen(false);
        setFieldToSet(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isDirty) return;
        try {
            const { socialLinks, footerLinks, ...rest } = formState;

            // FIX: Typed as 'any' to easily allow conditional property deletion without TypeScript errors.
            const settingsToSave: any = {
                ...rest,
                socialLinks: JSON.stringify(socialLinks.map(({ id, ...rest }) => rest)),
                footerLinks: JSON.stringify(footerLinks.map(({ id, ...rest }) => rest)),
            };

            // Don't save password if it hasn't changed from the placeholder
            if (settingsToSave.mailSmtpPassword === '••••••••') {
                 delete settingsToSave.mailSmtpPassword;
            }
            
            // If URL fields are empty strings, convert them to null before sending to Appwrite.
            // Appwrite's URL attribute type does not accept empty strings, but it accepts null for optional fields.
            if (settingsToSave.heroBackgroundImageUrl === '') settingsToSave.heroBackgroundImageUrl = null;
            if (settingsToSave.logoLightUrl === '') settingsToSave.logoLightUrl = null;
            if (settingsToSave.logoDarkUrl === '') settingsToSave.logoDarkUrl = null;
            if (settingsToSave.customBeepSoundUrl === '') settingsToSave.customBeepSoundUrl = null;

            await updateSettings(settingsToSave);
            addNotification('success', 'Settings Saved', 'Site settings updated successfully!');
        } catch (error) {
            addNotification('error', 'Update Failed', 'Failed to update settings. Please try again.');
        }
    };
    
    const handleSendTest = async () => {
        if (!testRecipient) {
            addNotification('warning', 'Missing Field', 'Please enter a recipient email address for the test.');
            return;
        }
        setIsSendingTest(true);
        try {
            await sendTestEmail({ recipientEmail: testRecipient });
            addNotification('success', 'Email Sent', `Test email sent successfully to ${testRecipient}!`);
        } catch (error) {
            console.error("Failed to send test email:", error);
            addNotification('error', 'Send Failed', 'Failed to send test email. Please check the console and your mail settings.');
        } finally {
            setIsSendingTest(false);
        }
    };

    const handleAboutSave = async () => {
        if (about) {
            try {
                await api.updateAboutContent(about.$id, aboutText);
                addNotification('success', 'Success', 'About section updated!');
            } catch(e) {
                addNotification('error', 'Update Failed', 'Failed to update about section.');
                console.error(e);
            }
        }
    };

    // Handlers for static contact info
    const openContactInfoModal = (info: StaticContactInfo | null) => {
        setEditingContactInfo(info);
        setContactInfoForm({
            label: info?.label || '',
            value: info?.value || '',
            icon: info?.icon || 'fas fa-info-circle',
            url: info?.url || ''
        });
        setIsContactInfoModalOpen(true);
    };

    const closeContactInfoModal = () => setIsContactInfoModalOpen(false);

    const handleContactInfoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const dataToSubmit = { ...contactInfoForm, url: contactInfoForm.url || undefined };
            if (editingContactInfo) {
                await api.updateStaticContactInfo(editingContactInfo.$id, dataToSubmit);
            } else {
                await api.createStaticContactInfo(dataToSubmit);
            }
            addNotification('success', 'Saved', 'Contact detail saved successfully.');
            closeContactInfoModal();
            fetchContactInfo();
        } catch (error) {
            addNotification('error', 'Save Failed', 'Could not save contact detail.');
        }
    };

    const handleDeleteContactInfo = async (info: StaticContactInfo) => {
        const isConfirmed = await confirm({
            title: 'Confirm Deletion',
            message: `Are you sure you want to delete the contact detail "${info.label}"?`,
            confirmStyle: 'destructive'
        });
        if (isConfirmed) {
            try {
                await api.deleteStaticContactInfo(info.$id);
                addNotification('info', 'Deleted', 'Contact detail has been deleted.');
                setContactInfo(prev => prev.filter(item => item.$id !== info.$id));
            } catch (error) {
                addNotification('error', 'Delete Failed', 'Could not delete contact detail.');
            }
        }
    };


    return (
        <div className="bg-[var(--bg-primary)] p-6 rounded-lg shadow-lg border border-[var(--border-color)]">
            <h2 className="text-2xl font-bold mb-6 text-[var(--primary-color)] flex items-center">
                <i className="fas fa-cogs mr-3"></i>Site Settings
            </h2>
             <div className="border-b border-[var(--border-color)] mb-6">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                                activeTab === tab.id
                                    ? 'border-[var(--primary-color)] text-[var(--primary-color)]'
                                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-gray-300'
                            }`}
                            aria-current={activeTab === tab.id ? 'page' : undefined}
                        >
                            <i className={tab.icon}></i>
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-8">
                 {/* Tab Content */}
                 <div className={activeTab === 'general' ? 'block' : 'hidden'}>
                    <section>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2 mb-4">General</h3>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="siteTitle" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Public Site Title</label>
                                <input type="text" id="siteTitle" name="siteTitle" value={formState.siteTitle} onChange={handleChange} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-all" />
                                <p className="text-xs text-[var(--text-secondary)] mt-1">Used as a fallback when logos are not set.</p>
                            </div>
                            {/* FIX: Removed truncated and invalid input field for 'adminTitle' to fix syntax error. */}
                        </div>
                    </section>
                </div>
            </form>
        </div>
    );
};
