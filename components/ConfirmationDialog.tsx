import React, { useContext, useEffect } from 'react';
import { ConfirmationDialogStateContext, ConfirmationDialogApiContext } from '../contexts/ConfirmationDialogContext';

const ConfirmationDialog: React.FC = () => {
    const dialogState = useContext(ConfirmationDialogStateContext);
    const api = useContext(ConfirmationDialogApiContext);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                api?.handleCancel();
            }
        };

        if (dialogState?.isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [dialogState?.isOpen, api]);

    if (!dialogState || !dialogState.isOpen || !api) {
        return null;
    }

    const { title, message, confirmText = 'Confirm', confirmStyle = 'primary' } = dialogState;
    const { handleConfirm, handleCancel } = api;

    const confirmButtonClasses = confirmStyle === 'destructive'
        ? 'bg-red-600 hover:bg-red-700 text-white'
        : 'bg-[var(--primary-color)] hover:brightness-110 text-gray-900';

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[150] p-4 animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmation-dialog-title"
        >
            <div
                className="bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-lg shadow-2xl w-full max-w-md"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-start">
                    <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-500/20 sm:mx-0 sm:h-10 sm:w-10">
                        <i className="fas fa-exclamation-triangle text-red-600 dark:text-red-400 text-xl"></i>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 id="confirmation-dialog-title" className="text-lg leading-6 font-bold text-[var(--text-primary)]">
                            {title}
                        </h3>
                        <div className="mt-2">
                            <p className="text-sm text-[var(--text-secondary)]">
                                {message}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                    <button
                        type="button"
                        className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 sm:w-auto sm:text-sm ${confirmButtonClasses}`}
                        onClick={handleConfirm}
                    >
                        {confirmText}
                    </button>
                    <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-[var(--border-color)] shadow-sm px-4 py-2 bg-[var(--bg-secondary)] text-base font-medium text-[var(--text-primary)] hover:bg-[var(--bg-card)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-color)] sm:mt-0 sm:w-auto sm:text-sm"
                        onClick={handleCancel}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationDialog;
