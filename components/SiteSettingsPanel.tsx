import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { sendTestEmail } from '../services/appwrite';
// FIX: Changed to a value import to ensure the 'Models' namespace is resolved correctly by TypeScript,
// which fixes type inference issues for 'settingsToSave' later in the file.
import { Models } from 'appwrite';
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
// FIX: Imported the 'Models' type from 'appwrite' to resolve the "Cannot find namespace 'Models'" error.
// This allows TypeScript to correctly interpret 'keyof Models.Document', fixing subsequent type errors
// related to properties not being found on the 'settingsToSave' object.
            const settingsToSave: Partial<Omit<SiteSettings, keyof Models.Document>> = {
                ...rest,
                socialLinks: JSON.stringify(socialLinks.map(({ id, ...rest }) => rest)),
                footerLinks: JSON.stringify(footerLinks.map(({ id, ...rest }) => rest)),
            };

            // Don't save password if it hasn't changed from the placeholder
            if (settingsToSave.mailSmtpPassword === '••••••••') {
                 delete settingsToSave.mailSmtpPassword;
            }
            
            // If URL fields are empty strings, convert them to null before sending to Appwrite.
            if (settingsToSave.heroBackgroundImageUrl === '') settingsToSave.heroBackgroundImageUrl = undefined;
            if (settingsToSave.logoLightUrl === '') settingsToSave.logoLightUrl = undefined;
            if (settingsToSave.logoDarkUrl === '') settingsToSave.logoDarkUrl = undefined;
            if (settingsToSave.customBeepSoundUrl === '') settingsToSave.customBeepSoundUrl = undefined;

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
                <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
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
                                <label htmlFor="adminTitle" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Admin Dashboard Title</label>
                                <input type="text" id="adminTitle" name="adminTitle" value={formState.adminTitle} onChange={handleChange} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-all" />
                            </div>
                            <div>
                                <label htmlFor="siteVersion" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Site Version</label>
                                <input type="text" id="siteVersion" name="siteVersion" value={formState.siteVersion} onChange={handleChange} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-all" />
                            </div>
                        </div>
                    </section>
                </div>

                <div className={activeTab === 'appearance' ? 'block' : 'hidden'}>
                    <section className="space-y-6">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2 mb-4">Branding &amp; Colors</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="primaryColor" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Primary Accent Color</label>
                                <div className="flex items-center space-x-2"><input type="color" id="primaryColor" name="primaryColor" value={formState.primaryColor} onChange={handleChange} className="h-10 w-10 p-1 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md cursor-pointer" /><input type="text" value={formState.primaryColor} onChange={handleChange} name="primaryColor" className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]" /></div>
                            </div>
                             <div>
                                <label htmlFor="secondaryColor" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Dark Theme Text Color</label>
                                <div className="flex items-center space-x-2"><input type="color" id="secondaryColor" name="secondaryColor" value={formState.secondaryColor} onChange={handleChange} className="h-10 w-10 p-1 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md cursor-pointer" /><input type="text" value={formState.secondaryColor} onChange={handleChange} name="secondaryColor" className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2 text-[var(--text-primary)]" /></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Logo (Light Theme)</label>
                                <div className="flex items-center space-x-2"><input type="text" name="logoLightUrl" value={formState.logoLightUrl} onChange={handleChange} placeholder="Select from media" className="flex-grow bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" /><button type="button" onClick={() => { setFieldToSet('lightLogo'); setIsMediaModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded text-sm"><i className="fas fa-photo-video"></i></button></div>
                                {formState.logoLightUrl && <img src={formState.logoLightUrl} alt="Light Logo Preview" className="mt-2 h-10 max-w-xs object-contain bg-gray-200 p-1 rounded" />}
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Logo (Dark Theme)</label>
                                <div className="flex items-center space-x-2"><input type="text" name="logoDarkUrl" value={formState.logoDarkUrl} onChange={handleChange} placeholder="Select from media" className="flex-grow bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" /><button type="button" onClick={() => { setFieldToSet('darkLogo'); setIsMediaModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded text-sm"><i className="fas fa-photo-video"></i></button></div>
                                {formState.logoDarkUrl && <img src={formState.logoDarkUrl} alt="Dark Logo Preview" className="mt-2 h-10 max-w-xs object-contain bg-gray-800 p-1 rounded" />}
                            </div>
                        </div>

                        <h3 className="text-lg font-semibold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2 mb-4 pt-4">Hero Section</h3>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Background Image</label>
                            <div className="flex items-center space-x-2"><input type="text" name="heroBackgroundImageUrl" value={formState.heroBackgroundImageUrl} onChange={handleChange} placeholder="Select from media" className="flex-grow bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" /><button type="button" onClick={() => { setFieldToSet('hero'); setIsMediaModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded text-sm"><i className="fas fa-photo-video"></i></button></div>
                            {formState.heroBackgroundImageUrl && <img src={formState.heroBackgroundImageUrl} alt="Hero Preview" className="mt-2 h-20 w-full object-cover rounded" />}
                        </div>
                         <div className="flex items-center space-x-6"><label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" name="heroUseImage" checked={formState.heroUseImage} onChange={handleChange} className="h-4 w-4 rounded text-[var(--primary-color)] focus:ring-[var(--primary-color)]" /> <span className="text-sm font-medium">Use Background Image</span></label><label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" name="heroUsePlexus" checked={formState.heroUsePlexus} onChange={handleChange} className="h-4 w-4 rounded text-[var(--primary-color)] focus:ring-[var(--primary-color)]" /> <span className="text-sm font-medium">Use Plexus Animation</span></label></div>
                        <input type="text" name="heroTitle" value={formState.heroTitle} onChange={handleChange} placeholder="Hero Title" className="w-full bg-[var(--input-bg)] p-2 rounded border" />
                        <textarea name="heroDescription" value={formState.heroDescription} onChange={handleChange} placeholder="Hero Description" rows={3} className="w-full bg-[var(--input-bg)] p-2 rounded border" />
                        <input type="text" name="heroButtonText" value={formState.heroButtonText} onChange={handleChange} placeholder="Hero Button Text" className="w-full bg-[var(--input-bg)] p-2 rounded border" />
                    </section>
                </div>

                <div className={`${activeTab === 'content' ? 'block' : 'hidden'} space-y-8`}>
                    <section>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2 mb-4">About Section</h3>
                        {isAboutLoading ? <LoadingSpinner /> : (
                            <div>
                                <textarea value={aboutText} onChange={(e) => setAboutText(e.target.value)} rows={6} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-3" />
                                <button type="button" onClick={handleAboutSave} className="mt-2 bg-blue-600 text-white py-2 px-4 rounded text-sm font-bold">Save About Section</button>
                            </div>
                        )}
                    </section>
                     <section>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2 mb-4">Footer</h3>
                        <div>
                            <label htmlFor="footerText" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Footer Text ({'{year}'} is a placeholder for the current year)</label>
                            <input type="text" id="footerText" name="footerText" value={formState.footerText} onChange={handleChange} className="w-full bg-[var(--input-bg)] p-2 rounded border" />
                        </div>
                        <div className="mt-4">
                            <h4 className="text-md font-medium text-[var(--text-secondary)] mb-2">Social Links</h4>
                            <div className="space-y-2">
                                {formState.socialLinks.map((link, index) => (
                                    <div key={link.id} className="flex items-center space-x-2">
                                        <input type="text" value={link.icon} onChange={(e) => handleSocialLinkChange(index, 'icon', e.target.value)} placeholder="Font Awesome Icon (e.g. fab fa-twitter)" className="w-1/2 bg-[var(--input-bg)] p-2 rounded border" />
                                        <input type="text" value={link.url} onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)} placeholder="URL" className="w-1/2 bg-[var(--input-bg)] p-2 rounded border" />
                                        <button type="button" onClick={() => removeSocialLink(index)} className="text-red-500 p-2"><i className="fas fa-trash"></i></button>
                                    </div>
                                ))}
                            </div>
                             <button type="button" onClick={addSocialLink} className="mt-2 text-sm text-[var(--primary-color)] font-semibold">+ Add Social Link</button>
                        </div>
                        <div className="mt-4">
                            <h4 className="text-md font-medium text-[var(--text-secondary)] mb-2">Footer Links</h4>
                             <div className="space-y-2">
                                {formState.footerLinks.map((link, index) => (
                                    <div key={link.id} className="flex items-center space-x-2">
                                        <input type="text" value={link.label} onChange={(e) => handleFooterLinkChange(index, 'label', e.target.value)} placeholder="Label" className="w-1/2 bg-[var(--input-bg)] p-2 rounded border" />
                                        <input type="text" value={link.url} onChange={(e) => handleFooterLinkChange(index, 'url', e.target.value)} placeholder="URL" className="w-1/2 bg-[var(--input-bg)] p-2 rounded border" />
                                        <button type="button" onClick={() => removeFooterLink(index)} className="text-red-500 p-2"><i className="fas fa-trash"></i></button>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={addFooterLink} className="mt-2 text-sm text-[var(--primary-color)] font-semibold">+ Add Footer Link</button>
                        </div>
                    </section>
                </div>
                
                <div className={activeTab === 'mail' ? 'block' : 'hidden'}>
                    <section>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2 mb-4">Mail Configuration</h3>
                         <div className="space-y-4">
                            <label className="flex items-center space-x-3 cursor-pointer"><input type="checkbox" name="mailEnabled" checked={formState.mailEnabled} onChange={handleChange} className="h-5 w-5 rounded text-[var(--primary-color)] focus:ring-[var(--primary-color)]" /><span className="font-medium">Enable Mail Functions</span></label>
                            <fieldset disabled={!formState.mailEnabled} className="space-y-4 relative">
                                {!formState.mailEnabled && <div className="absolute inset-0 bg-[var(--bg-primary)]/80 z-10"></div>}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input type="email" name="mailSenderEmail" value={formState.mailSenderEmail} onChange={handleChange} placeholder="Sender Email" className="w-full bg-[var(--input-bg)] p-2 rounded border" />
                                    <input type="email" name="mailContactRecipient" value={formState.mailContactRecipient} onChange={handleChange} placeholder="Contact Form Recipient" className="w-full bg-[var(--input-bg)] p-2 rounded border" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <input type="text" name="mailSmtpHost" value={formState.mailSmtpHost} onChange={handleChange} placeholder="SMTP Host" className="w-full bg-[var(--input-bg)] p-2 rounded border" />
                                    <input type="number" name="mailSmtpPort" value={formState.mailSmtpPort} onChange={handleChange} placeholder="SMTP Port" className="w-full bg-[var(--input-bg)] p-2 rounded border" />
                                    <select name="mailSmtpEncryption" value={formState.mailSmtpEncryption} onChange={handleChange} className="w-full bg-[var(--input-bg)] p-2 rounded border"><option value="none">None</option><option value="ssl">SSL</option><option value="tls">TLS</option></select>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input type="text" name="mailSmtpUsername" value={formState.mailSmtpUsername} onChange={handleChange} placeholder="SMTP Username" className="w-full bg-[var(--input-bg)] p-2 rounded border" />
                                    <input type="password" name="mailSmtpPassword" value={formState.mailSmtpPassword} onChange={handleChange} placeholder="••••••••" className="w-full bg-[var(--input-bg)] p-2 rounded border" />
                                </div>
                            </fieldset>
                        </div>
                    </section>
                    <section className="mt-8">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2 mb-4">Send Test Email</h3>
                        <div className="flex items-center space-x-2"><input type="email" value={testRecipient} onChange={(e) => setTestRecipient(e.target.value)} placeholder="Recipient Email" className="flex-grow bg-[var(--input-bg)] p-2 rounded border" /><button type="button" onClick={handleSendTest} disabled={isSendingTest || !formState.mailEnabled} className="bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50 flex items-center justify-center w-32">{isSendingTest ? <LoadingSpinner /> : 'Send Test'}</button></div>
                    </section>
                </div>
                
                <div className={activeTab === 'tools' ? 'block' : 'hidden'}>
                    <section>
                         <h3 className="text-lg font-semibold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2 mb-4">Timecode Slate</h3>
                         <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Custom Beep Sound URL (optional)</label>
                            <div className="flex items-center space-x-2"><input type="text" name="customBeepSoundUrl" value={formState.customBeepSoundUrl} onChange={handleChange} placeholder="Select from media" className="flex-grow bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" /><button type="button" onClick={() => { setFieldToSet('beepSound'); setIsMediaModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded text-sm"><i className="fas fa-photo-video"></i></button></div>
                         </div>
                    </section>
                    <section className="mt-8">
                         <h3 className="text-lg font-semibold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2 mb-4">Soundtrack Searcher</h3>
                         <div className="space-y-4">
                            <label className="flex items-center space-x-3 cursor-pointer"><input type="checkbox" name="strSrcNotificationEnabled" checked={formState.strSrcNotificationEnabled} onChange={handleChange} className="h-5 w-5 rounded text-[var(--primary-color)] focus:ring-[var(--primary-color)]" /><span className="font-medium">Enable Notification Banner</span></label>
                            <input type="text" name="strSrcNotificationText" value={formState.strSrcNotificationText} onChange={handleChange} placeholder="Notification text (max 36 chars)" maxLength={36} disabled={!formState.strSrcNotificationEnabled} className="w-full bg-[var(--input-bg)] p-2 rounded border disabled:opacity-50" />
                            <label className="flex items-center space-x-3 cursor-pointer pt-2"><input type="checkbox" name="strSrcTopPicksEnabled" checked={formState.strSrcTopPicksEnabled} onChange={handleChange} className="h-5 w-5 rounded text-[var(--primary-color)] focus:ring-[var(--primary-color)]" /><span className="font-medium">Enable "Top 10 Editor's Picks" Section</span></label>
                         </div>
                    </section>
                </div>

                <div className="pt-6 border-t border-[var(--border-color)] mt-8 flex justify-end">
                    <button type="submit" disabled={!isDirty || isUpdating} className="bg-[var(--primary-color)] text-gray-900 font-bold py-3 px-6 rounded-lg uppercase tracking-wider transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center w-40">
                        {isUpdating ? <LoadingSpinner /> : 'Save Settings'}
                    </button>
                </div>
            </form>

            {isMediaModalOpen && (
                <MediaLibraryModal onSelect={handleImageSelect} onClose={() => setIsMediaModalOpen(false)} fileUsageMap={fileUsageMap} />
            )}

            {isContactInfoModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
                    <div className="bg-[var(--bg-card)] p-8 rounded-lg w-full max-w-lg">
                        <h2 className="text-2xl font-bold mb-6">{editingContactInfo ? 'Edit' : 'Create'} Contact Detail</h2>
                        <form onSubmit={handleContactInfoSubmit} className="space-y-4">
                            <input name="label" value={contactInfoForm.label} onChange={e => setContactInfoForm(p=>({...p, label: e.target.value}))} placeholder="Label (e.g., General Inquiries)" required className="w-full bg-[var(--input-bg)] p-2 rounded border" />
                            <input name="value" value={contactInfoForm.value} onChange={e => setContactInfoForm(p=>({...p, value: e.target.value}))} placeholder="Value (e.g., contact@firstvideos.com)" required className="w-full bg-[var(--input-bg)] p-2 rounded border" />
                            <input name="icon" value={contactInfoForm.icon} onChange={e => setContactInfoForm(p=>({...p, icon: e.target.value}))} placeholder="Font Awesome Icon (e.g., fas fa-envelope)" required className="w-full bg-[var(--input-bg)] p-2 rounded border" />
                            <input name="url" value={contactInfoForm.url} onChange={e => setContactInfoForm(p=>({...p, url: e.target.value}))} placeholder="URL (e.g., mailto:...)" className="w-full bg-[var(--input-bg)] p-2 rounded border" />
                            <div className="flex justify-end gap-4 pt-4">
                                <button type="button" onClick={closeContactInfoModal} className="bg-gray-500 py-2 px-4 rounded text-white">Cancel</button>
                                <button type="submit" className="bg-[var(--primary-color)] py-2 px-4 rounded text-gray-900 font-bold">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
