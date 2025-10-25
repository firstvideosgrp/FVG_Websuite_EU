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

const SiteSettingsPanel: React.FC<SiteSettingsPanelProps> = ({ fileUsageMap }) => {
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
                            <div>
                                <label htmlFor="adminTitle" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Admin Page Title</label>
                                <input type="text" id="adminTitle" name="adminTitle" value={formState.adminTitle} onChange={handleChange} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-all" />
                            </div>
                            <div>
                                <label htmlFor="siteVersion" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Site Version</label>
                                <input type="text" id="siteVersion" name="siteVersion" value={formState.siteVersion} onChange={handleChange} placeholder="e.g., 1.0.1" className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-all" />
                                <p className="text-xs text-[var(--text-secondary)] mt-1">Displayed in the site footer.</p>
                            </div>
                             <div>
                                <label htmlFor="logoLightUrl" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Light Theme Logo</label>
                                <div className="flex items-center space-x-2">
                                    <input id="logoLightUrl" type="text" name="logoLightUrl" value={formState.logoLightUrl} onChange={handleChange} placeholder="Enter URL or select from media" className="flex-grow bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-3 h-[50px]" />
                                    <button type="button" onClick={() => { setFieldToSet('lightLogo'); setIsMediaModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded text-sm whitespace-nowrap h-[50px]" aria-label="Select from Media Library">
                                        <i className="fas fa-photo-video"></i>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="logoDarkUrl" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Dark Theme Logo</label>
                                <div className="flex items-center space-x-2">
                                    <input id="logoDarkUrl" type="text" name="logoDarkUrl" value={formState.logoDarkUrl} onChange={handleChange} placeholder="Enter URL or select from media" className="flex-grow bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-3 h-[50px]" />
                                    <button type="button" onClick={() => { setFieldToSet('darkLogo'); setIsMediaModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded text-sm whitespace-nowrap h-[50px]" aria-label="Select from Media Library">
                                        <i className="fas fa-photo-video"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
                
                 <div className={activeTab === 'appearance' ? 'block' : 'hidden'}>
                     <section>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2 mb-4">Colors</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="primaryColor" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Primary Color (Accent)</label>
                                <div className="flex items-center space-x-3"><input type="color" id="primaryColor" name="primaryColor" value={formState.primaryColor} onChange={handleChange} className="w-12 h-12 p-1 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md cursor-pointer" /><input type="text" value={formState.primaryColor} onChange={handleChange} name="primaryColor" className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-all" /></div>
                            </div>
                            <div>
                                <label htmlFor="secondaryColor" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Dark Theme Text Color</label>
                                <div className="flex items-center space-x-3"><input type="color" id="secondaryColor" name="secondaryColor" value={formState.secondaryColor} onChange={handleChange} className="w-12 h-12 p-1 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md cursor-pointer" /><input type="text" value={formState.secondaryColor} onChange={handleChange} name="secondaryColor" className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-all" /></div>
                            </div>
                        </div>
                    </section>
                    <section className="mt-8">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2 mb-4">Hero Section</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-[var(--text-primary)]">Background Type</span>
                                <div className="flex items-center space-x-6">
                                    <label htmlFor="heroUseImage" className="flex items-center cursor-pointer">
                                        <span className="mr-3 text-sm font-medium text-[var(--text-secondary)]">Use Background Image</span>
                                        <div className="relative">
                                            <input type="checkbox" id="heroUseImage" name="heroUseImage" className="sr-only" checked={formState.heroUseImage} onChange={handleChange} />
                                            <div className="block bg-gray-600 w-14 h-8 rounded-full"></div>
                                            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${formState.heroUseImage ? 'translate-x-6' : ''}`}></div>
                                        </div>
                                    </label>
                                    <label htmlFor="heroUsePlexus" className="flex items-center cursor-pointer">
                                        <span className="mr-3 text-sm font-medium text-[var(--text-secondary)]">Use Plexus Animation</span>
                                        <div className="relative">
                                            <input type="checkbox" id="heroUsePlexus" name="heroUsePlexus" className="sr-only" checked={formState.heroUsePlexus} onChange={handleChange} />
                                            <div className="block bg-gray-600 w-14 h-8 rounded-full"></div>
                                            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${formState.heroUsePlexus ? 'translate-x-6' : ''}`}></div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                            <div className={formState.heroUseImage ? '' : 'opacity-50'}>
                                <label htmlFor="heroBackgroundImageUrl" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Background Image</label>
                                <div className="flex items-center space-x-2">
                                    <input type="text" id="heroBackgroundImageUrl" name="heroBackgroundImageUrl" value={formState.heroBackgroundImageUrl} onChange={handleChange} className="flex-grow bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-3" placeholder="Enter URL or select from media" disabled={!formState.heroUseImage}/>
                                    <button type="button" onClick={() => { setFieldToSet('hero'); setIsMediaModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded text-sm whitespace-nowrap h-[50px]" aria-label="Select from Media Library" disabled={!formState.heroUseImage}>
                                        <i className="fas fa-photo-video"></i>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="heroTitle" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Title Text</label>
                                <input type="text" id="heroTitle" name="heroTitle" value={formState.heroTitle} onChange={handleChange} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-3" />
                            </div>
                            <div>
                                <label htmlFor="heroDescription" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Description Text</label>
                                <textarea id="heroDescription" name="heroDescription" value={formState.heroDescription} onChange={handleChange} rows={3} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-3"></textarea>
                            </div>
                            <div>
                                <label htmlFor="heroButtonText" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Button Text</label>
                                <input type="text" id="heroButtonText" name="heroButtonText" value={formState.heroButtonText} onChange={handleChange} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-3" />
                            </div>
                        </div>
                    </section>
                 </div>
                
                <div className={activeTab === 'content' ? 'block space-y-8' : 'hidden'}>
                    <section>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2 mb-4">About Section</h3>
                         {isAboutLoading ? <LoadingSpinner /> : (
                            <div>
                                <textarea 
                                    value={aboutText} 
                                    onChange={e => setAboutText(e.target.value)}
                                    rows={10}
                                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-all"
                                    placeholder="Enter the content for the 'About Us' section..."
                                />
                                <button type="button" onClick={handleAboutSave} className="mt-4 bg-[var(--primary-color)] hover:brightness-110 text-gray-900 font-bold py-2 px-6 rounded transition-colors flex items-center space-x-2">
                                    <i className="fas fa-save"></i>
                                    <span>Save About Content</span>
                                </button>
                            </div>
                        )}
                    </section>

                    <section>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2 mb-4">Footer & Socials</h3>
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Social Media Links</label>
                                <div className="space-y-3">
                                    {formState.socialLinks.map((link, index) => (
                                        <div key={link.id} className="flex items-center space-x-2 p-2 bg-[var(--bg-secondary)] rounded-md">
                                            <input type="text" value={link.icon} onChange={(e) => handleSocialLinkChange(index, 'icon', e.target.value)} placeholder="Icon (e.g., fab fa-twitter)" className="w-1/3 bg-[var(--input-bg)] border border-[var(--border-color)] rounded p-2" />
                                            <input type="text" value={link.url} onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)} placeholder="URL" className="flex-grow bg-[var(--input-bg)] border border-[var(--border-color)] rounded p-2" />
                                            <button type="button" onClick={() => removeSocialLink(index)} className="bg-red-600 hover:bg-red-700 text-white font-bold p-2 rounded w-10 h-10 flex items-center justify-center"><i className="fas fa-trash"></i></button>
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={addSocialLink} className="mt-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm flex items-center space-x-2"><i className="fas fa-plus"></i><span>Add Social Link</span></button>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Footer Additional Links</label>
                                <div className="space-y-3">
                                    {formState.footerLinks.map((link, index) => (
                                        <div key={link.id} className="flex items-center space-x-2 p-2 bg-[var(--bg-secondary)] rounded-md">
                                            <input type="text" value={link.label} onChange={(e) => handleFooterLinkChange(index, 'label', e.target.value)} placeholder="Label (e.g., Privacy Policy)" className="w-1/3 bg-[var(--input-bg)] border border-[var(--border-color)] rounded p-2" />
                                            <input type="text" value={link.url} onChange={(e) => handleFooterLinkChange(index, 'url', e.target.value)} placeholder="URL" className="flex-grow bg-[var(--input-bg)] border border-[var(--border-color)] rounded p-2" />
                                            <button type="button" onClick={() => removeFooterLink(index)} className="bg-red-600 hover:bg-red-700 text-white font-bold p-2 rounded w-10 h-10 flex items-center justify-center"><i className="fas fa-trash"></i></button>
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={addFooterLink} className="mt-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm flex items-center space-x-2"><i className="fas fa-plus"></i><span>Add Footer Link</span></button>
                            </div>
                         </div>
                         <div className="mt-6">
                            <label htmlFor="footerText" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Footer Text (use `{'{year}'}` for current year)</label>
                            <textarea id="footerText" name="footerText" value={formState.footerText} onChange={handleChange} rows={3} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-all" />
                        </div>
                    </section>

                    <section>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2 mb-4">Static Contact Information</h3>
                        <p className="text-sm text-[var(--text-secondary)] mb-4">This information will be displayed on the public "Contact" page when mail sending is disabled.</p>
                        <div className="space-y-3">
                            {isContactInfoLoading ? (
                                <div className="flex justify-center"><LoadingSpinner /></div>
                            ) : (
                                contactInfo.map((info) => (
                                    <div key={info.$id} className="flex items-center space-x-2 p-3 bg-[var(--bg-secondary)] rounded-md border border-[var(--border-color)]">
                                        <i className={`${info.icon} text-[var(--primary-color)] text-xl w-8 text-center`}></i>
                                        <div className="flex-grow">
                                            <p className="font-semibold text-[var(--text-primary)]">{info.label}</p>
                                            <p className="text-sm text-[var(--text-secondary)]">{info.value}</p>
                                        </div>
                                        <button type="button" onClick={() => openContactInfoModal(info)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 rounded w-10 h-10 flex items-center justify-center"><i className="fas fa-pencil-alt"></i></button>
                                        <button type="button" onClick={() => handleDeleteContactInfo(info)} className="bg-red-600 hover:bg-red-700 text-white font-bold p-2 rounded w-10 h-10 flex items-center justify-center"><i className="fas fa-trash"></i></button>
                                    </div>
                                ))
                            )}
                        </div>
                        <button type="button" onClick={() => openContactInfoModal(null)} className="mt-3 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm flex items-center space-x-2"><i className="fas fa-plus"></i><span>Add Contact Detail</span></button>
                    </section>

                    <section>
                         <h3 className="text-lg font-semibold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2 mb-4">Pricing Tiers</h3>
                         <PricingPanel />
                    </section>
                </div>
                
                <div className={activeTab === 'mail' ? 'block' : 'hidden'}>
                     <section>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2 mb-4 flex justify-between items-center">
                            <span>Mail Settings</span>
                            <label htmlFor="mailEnabled" className="flex items-center cursor-pointer">
                                <span className="mr-3 text-sm font-medium text-[var(--text-secondary)]">Enable Sending</span>
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        id="mailEnabled"
                                        name="mailEnabled"
                                        className="sr-only"
                                        checked={formState.mailEnabled}
                                        onChange={handleChange}
                                    />
                                    <div className="block bg-gray-600 w-14 h-8 rounded-full"></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${formState.mailEnabled ? 'translate-x-6' : ''}`}></div>
                                </div>
                            </label>
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="mailSenderEmail" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Sender Email Address</label>
                                <input type="email" id="mailSenderEmail" name="mailSenderEmail" value={formState.mailSenderEmail} onChange={handleChange} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-3" placeholder="sender@example.com" />
                                <p className="text-xs text-[var(--text-secondary)] mt-1">The "From" address for all outgoing system emails.</p>
                            </div>
                            <div>
                                <label htmlFor="mailContactRecipient" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Contact Form Recipient</label>
                                <input type="email" id="mailContactRecipient" name="mailContactRecipient" value={formState.mailContactRecipient} onChange={handleChange} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-3" placeholder="recipient@example.com" />
                                <p className="text-xs text-[var(--text-secondary)] mt-1">The email address where submissions from the public "Contact Us" form will be sent.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label htmlFor="mailSmtpHost" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">SMTP Host</label>
                                    <input type="text" id="mailSmtpHost" name="mailSmtpHost" value={formState.mailSmtpHost} onChange={handleChange} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-3" placeholder="smtp.mailtrap.io" />
                                </div>
                                <div>
                                    <label htmlFor="mailSmtpPort" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">SMTP Port</label>
                                    <input type="number" id="mailSmtpPort" name="mailSmtpPort" value={formState.mailSmtpPort} onChange={handleChange} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-3" />
                                </div>
                                <div>
                                    <label htmlFor="mailSmtpEncryption" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Encryption</label>
                                    <select id="mailSmtpEncryption" name="mailSmtpEncryption" value={formState.mailSmtpEncryption} onChange={handleChange} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-3">
                                        <option value="none">None</option>
                                        <option value="ssl">SSL</option>
                                        <option value="tls">TLS</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="mailSmtpUsername" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">SMTP Username</label>
                                    <input type="text" id="mailSmtpUsername" name="mailSmtpUsername" value={formState.mailSmtpUsername} onChange={handleChange} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-3" autoComplete="off"/>
                                </div>
                                <div>
                                    <label htmlFor="mailSmtpPassword" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">SMTP Password</label>
                                    <input type="password" id="mailSmtpPassword" name="mailSmtpPassword" onChange={handleChange} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-3" placeholder="Enter new password" autoComplete="new-password"/>
                                </div>
                            </div>
                        </div>
                        {/* Test Mail Sub-section */}
                        <div className="mt-6 pt-6 border-t border-[var(--border-color)]">
                            <h4 className="text-md font-semibold text-[var(--text-primary)] mb-3">Test Configuration</h4>
                            <p className="text-sm text-[var(--text-secondary)] mb-4">
                                After saving your settings above, you can send a test email to verify the configuration.
                                The test will use the saved credentials.
                            </p>
                            <div className="flex items-center space-x-2">
                                <input 
                                    type="email" 
                                    value={testRecipient} 
                                    onChange={e => setTestRecipient(e.target.value)}
                                    placeholder="To: recipient@example.com"
                                    className="flex-grow bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2"
                                />
                                <button 
                                    type="button" 
                                    onClick={handleSendTest} 
                                    disabled={isSendingTest || isDirty || !formState.mailEnabled}
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors flex items-center justify-center w-44 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSendingTest ? (
                                        <>
                                            <i className="fas fa-spinner animate-spin mr-2"></i>
                                            <span>Sending...</span>
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-paper-plane mr-2"></i>
                                            <span>Send Test</span>
                                        </>
                                    )}
                                </button>
                            </div>
                            {isDirty && <p className="text-xs text-yellow-400 mt-2">Please save your changes before sending a test email.</p>}
                            {!formState.mailEnabled && <p className="text-xs text-yellow-400 mt-2">Mail sending is disabled. Enable and save settings to send a test.</p>}
                        </div>
                    </section>
                </div>
                 <div className={activeTab === 'tools' ? 'block' : 'hidden'}>
                    <section>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2 mb-4">Timecode Slate</h3>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="customBeepSoundUrl" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Custom Beep Sound</label>
                                <div className="flex items-center space-x-2">
                                    <input id="customBeepSoundUrl" type="text" name="customBeepSoundUrl" value={formState.customBeepSoundUrl} onChange={handleChange} placeholder="Optional: Select an audio file" className="flex-grow bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-3 h-[50px]" />
                                    <button type="button" onClick={() => { setFieldToSet('beepSound'); setIsMediaModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded text-sm whitespace-nowrap h-[50px]" aria-label="Select from Media Library">
                                        <i className="fas fa-music"></i>
                                    </button>
                                </div>
                                <p className="text-xs text-[var(--text-secondary)] mt-1">Upload an audio file (e.g., MP3, WAV) in the Media Library under the 'Audio Clip' category.</p>
                            </div>
                        </div>
                    </section>
                    <section className="mt-8">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2 mb-4 flex justify-between items-center">
                            <span>Soundtrack Searcher Page</span>
                            <label htmlFor="strSrcNotificationEnabled" className="flex items-center cursor-pointer">
                                <span className="mr-3 text-sm font-medium text-[var(--text-secondary)]">Enable Notification Bar</span>
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        id="strSrcNotificationEnabled"
                                        name="strSrcNotificationEnabled"
                                        className="sr-only"
                                        checked={formState.strSrcNotificationEnabled}
                                        onChange={handleChange}
                                    />
                                    <div className="block bg-gray-600 w-14 h-8 rounded-full"></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${formState.strSrcNotificationEnabled ? 'translate-x-6' : ''}`}></div>
                                </div>
                            </label>
                        </h3>
                        <div className={`space-y-4 transition-opacity ${formState.strSrcNotificationEnabled ? 'opacity-100' : 'opacity-50'}`}>
                            <div>
                                <label htmlFor="strSrcNotificationText" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Notification Text</label>
                                <textarea
                                    id="strSrcNotificationText"
                                    name="strSrcNotificationText"
                                    value={formState.strSrcNotificationText}
                                    onChange={handleChange}
                                    rows={2}
                                    maxLength={36}
                                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-3"
                                    placeholder="e.g., New tracks added!"
                                    disabled={!formState.strSrcNotificationEnabled}
                                />
                                <p className="text-xs text-right text-[var(--text-secondary)] mt-1">{formState.strSrcNotificationText.length} / 36</p>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="pt-4 border-t border-[var(--border-color)]">
                    <button type="submit" disabled={isUpdating || !isDirty} className="bg-[var(--primary-color)] hover:brightness-110 text-gray-900 font-bold py-2 px-6 rounded transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isUpdating ? <><i className="fas fa-spinner animate-spin"></i><span>Saving...</span></> : <><i className="fas fa-save"></i><span>Save Settings</span></>}
                    </button>
                </div>
            </form>
            {isMediaModalOpen && <MediaLibraryModal onSelect={handleImageSelect} onClose={() => setIsMediaModalOpen(false)} fileUsageMap={fileUsageMap} />}
            
            {isContactInfoModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-lg shadow-2xl w-full max-w-lg relative text-[var(--text-primary)]">
                        <button onClick={closeContactInfoModal} aria-label="Close modal" className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-2xl">&times;</button>
                        <h2 className="text-2xl font-bold mb-6">{editingContactInfo ? 'Edit' : 'Add'} Contact Detail</h2>
                        <form onSubmit={handleContactInfoSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="ci-label" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Label</label>
                                <input id="ci-label" type="text" value={contactInfoForm.label} onChange={e => setContactInfoForm(p => ({...p, label: e.target.value}))} placeholder="e.g., General Inquiries" required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2"/>
                            </div>
                             <div>
                                <label htmlFor="ci-value" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Value</label>
                                <input id="ci-value" type="text" value={contactInfoForm.value} onChange={e => setContactInfoForm(p => ({...p, value: e.target.value}))} placeholder="e.g., contact@firstvideos.com" required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2"/>
                            </div>
                            <div>
                                <label htmlFor="ci-icon" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Icon</label>
                                <input id="ci-icon" type="text" value={contactInfoForm.icon} onChange={e => setContactInfoForm(p => ({...p, icon: e.target.value}))} placeholder="e.g., fas fa-envelope" required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2"/>
                                <p className="text-xs text-[var(--text-secondary)] mt-1">Use Font Awesome class names (e.g., `fas fa-phone`).</p>
                            </div>
                             <div>
                                <label htmlFor="ci-url" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">URL (Optional)</label>
                                <input id="ci-url" type="text" value={contactInfoForm.url} onChange={e => setContactInfoForm(p => ({...p, url: e.target.value}))} placeholder="e.g., mailto:contact@firstvideos.com" className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2"/>
                                <p className="text-xs text-[var(--text-secondary)] mt-1">Makes the item clickable. Use `mailto:`, `tel:`, or a web URL.</p>
                            </div>
                            <div className="flex justify-end space-x-4 pt-4">
                                <button type="button" onClick={closeContactInfoModal} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">Cancel</button>
                                <button type="submit" className="bg-[var(--primary-color)] hover:brightness-110 text-gray-900 font-bold py-2 px-4 rounded">Save Detail</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SiteSettingsPanel;