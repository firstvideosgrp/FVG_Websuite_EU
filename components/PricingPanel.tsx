import React, { useState, useEffect, useCallback } from 'react';
import { PricingTier } from '../types';
import * as api from '../services/appwrite';
import LoadingSpinner from './LoadingSpinner';
import { useNotification } from '../contexts/NotificationContext';
import { useConfirmation } from '../contexts/ConfirmationDialogContext';

const CURRENCY_OPTIONS = ["USD", "EUR", "GBP", "HUF", "CAD", "AUD"];

const PricingPanel: React.FC = () => {
    const [tiers, setTiers] = useState<PricingTier[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { addNotification } = useNotification();
    const { confirm } = useConfirmation();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTier, setEditingTier] = useState<PricingTier | null>(null);
    const [formState, setFormState] = useState({
        title: '',
        description: '',
        priceMonthly: 0,
        priceYearly: 0,
        currency: 'USD',
        features: '',
        order: 0,
        isFeatured: false,
        buttonText: 'Get Started',
        buttonUrl: '',
        yearlyDiscountText: '',
    });

    const fetchTiers = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.getPricingTiers();
            setTiers(data);
        } catch (error) {
            addNotification('error', 'Load Failed', 'Could not fetch pricing tiers.');
        } finally {
            setIsLoading(false);
        }
    }, [addNotification]);

    useEffect(() => {
        fetchTiers();
    }, [fetchTiers]);

    const openModal = (tier: PricingTier | null) => {
        setEditingTier(tier);
        if (tier) {
            setFormState({
                title: tier.title,
                description: tier.description,
                priceMonthly: tier.priceMonthly,
                priceYearly: tier.priceYearly,
                currency: tier.currency,
                features: tier.features.join('\n'),
                order: tier.order,
                isFeatured: tier.isFeatured || false,
                buttonText: tier.buttonText,
                buttonUrl: tier.buttonUrl || '',
                yearlyDiscountText: tier.yearlyDiscountText || '',
            });
        } else {
            setFormState({
                title: '',
                description: '',
                priceMonthly: 0,
                priceYearly: 0,
                currency: 'USD',
                features: '',
                order: tiers.length,
                isFeatured: false,
                buttonText: 'Get Started',
                buttonUrl: '',
                yearlyDiscountText: '',
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormState(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const dataToSubmit = {
                ...formState,
                features: formState.features.split('\n').filter(f => f.trim() !== ''),
                buttonUrl: formState.buttonUrl || undefined,
                yearlyDiscountText: formState.yearlyDiscountText || undefined,
            };

            if (editingTier) {
                await api.updatePricingTier(editingTier.$id, dataToSubmit);
                addNotification('success', 'Tier Updated', `Successfully updated "${formState.title}".`);
            } else {
                await api.createPricingTier(dataToSubmit);
                addNotification('success', 'Tier Created', `Successfully created "${formState.title}".`);
            }
            closeModal();
            fetchTiers();
        } catch (error) {
            addNotification('error', 'Save Failed', 'Could not save the pricing tier.');
            console.error('Pricing Tier Save Error:', error);
        }
    };

    const handleDelete = async (tier: PricingTier) => {
        const isConfirmed = await confirm({
            title: 'Confirm Deletion',
            message: `Are you sure you want to delete the "${tier.title}" pricing tier? This action cannot be undone.`,
            confirmStyle: 'destructive',
        });
        if (isConfirmed) {
            try {
                await api.deletePricingTier(tier.$id);
                addNotification('info', 'Tier Deleted', `The tier "${tier.title}" has been deleted.`);
                fetchTiers();
            } catch (error) {
                addNotification('error', 'Delete Failed', 'Could not delete the pricing tier.');
            }
        }
    };

    return (
        <>
            <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-[var(--text-secondary)]">Manage the plans that appear on your public website.</p>
                <button 
                    onClick={() => openModal(null)} 
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors flex items-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled
                    title="This feature is temporarily disabled."
                >
                    <i className="fas fa-plus"></i><span>Add New Tier</span>
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-10"><LoadingSpinner /></div>
            ) : tiers.length > 0 ? (
                <div className="space-y-4">
                    {tiers.map(tier => (
                        <div key={tier.$id} className="bg-[var(--bg-secondary)] p-4 rounded-md flex justify-between items-center border border-[var(--border-color)]">
                            <div className="flex items-center gap-4">
                                <span className="text-[var(--text-secondary)] font-bold text-lg w-8 text-center">{tier.order}</span>
                                <div>
                                    <h3 className="font-bold text-lg flex items-center gap-2">
                                        {tier.title}
                                        {tier.isFeatured && <span className="bg-yellow-500/20 text-yellow-300 text-xs font-medium px-2 py-0.5 rounded-full">Featured</span>}
                                    </h3>
                                    <p className="text-sm text-[var(--text-secondary)]">{tier.priceMonthly}/{tier.priceYearly} {tier.currency} &bull; {tier.features.length} features</p>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <button onClick={() => openModal(tier)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded text-sm"><i className="fas fa-pencil-alt"></i></button>
                                <button onClick={() => handleDelete(tier)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded text-sm"><i className="fas fa-trash"></i></button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-[var(--text-secondary)] py-10">No pricing tiers found. Click "Add New Tier" to get started.</p>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-lg shadow-2xl w-full max-w-2xl relative text-[var(--text-primary)] max-h-[90vh] overflow-y-auto">
                        <button onClick={closeModal} className="absolute top-4 right-4 text-[var(--text-secondary)] text-2xl">&times;</button>
                        <h2 className="text-2xl font-bold mb-6">{editingTier ? 'Edit' : 'Create'} Pricing Tier</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Title</label>
                                    <input type="text" name="title" value={formState.title} onChange={handleChange} required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" />
                                </div>
                                <div>
                                    <label htmlFor="order" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Display Order</label>
                                    <input type="number" name="order" value={formState.order} onChange={handleChange} required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description</label>
                                <textarea name="description" value={formState.description} onChange={handleChange} required rows={2} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label htmlFor="priceMonthly" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Price (Monthly)</label>
                                    <input type="number" name="priceMonthly" value={formState.priceMonthly} onChange={handleChange} step="0.01" required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" />
                                </div>
                                <div>
                                    <label htmlFor="priceYearly" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Price (Yearly)</label>
                                    <input type="number" name="priceYearly" value={formState.priceYearly} onChange={handleChange} step="0.01" required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" />
                                </div>
                                <div>
                                    <label htmlFor="currency" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Currency</label>
                                    <select name="currency" value={formState.currency} onChange={handleChange} required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2">
                                        {CURRENCY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="yearlyDiscountText" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Yearly Discount Text (Optional)</label>
                                <input type="text" name="yearlyDiscountText" value={formState.yearlyDiscountText} onChange={handleChange} placeholder="e.g., Save 20% or 2 months free" className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" />
                            </div>
                            <div>
                                <label htmlFor="features" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Features (one per line)</label>
                                <textarea name="features" value={formState.features} onChange={handleChange} required rows={5} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" />
                            </div>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="buttonText" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Button Text</label>
                                    <input type="text" name="buttonText" value={formState.buttonText} onChange={handleChange} required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" />
                                </div>
                                <div>
                                    <label htmlFor="buttonUrl" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Button URL (Optional)</label>
                                    <input type="text" name="buttonUrl" value={formState.buttonUrl} onChange={handleChange} placeholder="https://example.com" className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="isFeatured" className="flex items-center space-x-2 text-sm font-medium text-[var(--text-secondary)] cursor-pointer">
                                    <input type="checkbox" id="isFeatured" name="isFeatured" checked={formState.isFeatured} onChange={handleChange} className="h-4 w-4 rounded bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--primary-color)] focus:ring-[var(--primary-color)]" />
                                    <span>Mark as Featured Plan</span>
                                </label>
                            </div>
                            <div className="flex justify-end space-x-4 pt-4">
                                <button type="button" onClick={closeModal} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">Cancel</button>
                                <button type="submit" className="bg-[var(--primary-color)] hover:brightness-110 text-gray-900 font-bold py-2 px-4 rounded">Save Tier</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default PricingPanel;