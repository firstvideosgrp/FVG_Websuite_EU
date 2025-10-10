import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  confirmStyle?: 'primary' | 'destructive';
}

type ConfirmationContextType = {
  confirm: (options: ConfirmationOptions) => Promise<boolean>;
};

type DialogStateType = ConfirmationOptions & {
  isOpen: boolean;
  resolve: ((value: boolean) => void) | null;
};

// Context to be used by the hook
const ConfirmationDialogContext = createContext<ConfirmationContextType | undefined>(undefined);

// Context to be used by the Provider/Dialog Component
export const ConfirmationDialogStateContext = createContext<DialogStateType | undefined>(undefined);
export const ConfirmationDialogApiContext = createContext<{
    handleConfirm: () => void;
    handleCancel: () => void;
} | undefined>(undefined);


export const ConfirmationDialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dialogState, setDialogState] = useState<DialogStateType>({
    isOpen: false,
    title: '',
    message: '',
    resolve: null,
    confirmStyle: 'primary'
  });

  const confirm = useCallback((options: ConfirmationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        ...options,
        isOpen: true,
        resolve,
      });
    });
  }, []);
  
  const handleConfirm = () => {
    dialogState.resolve?.(true);
    setDialogState(prev => ({ ...prev, isOpen: false, resolve: null }));
  };
  
  const handleCancel = () => {
    dialogState.resolve?.(false);
    setDialogState(prev => ({ ...prev, isOpen: false, resolve: null }));
  };

  return (
    <ConfirmationDialogContext.Provider value={{ confirm }}>
        <ConfirmationDialogStateContext.Provider value={dialogState}>
            <ConfirmationDialogApiContext.Provider value={{ handleConfirm, handleCancel }}>
                {children}
            </ConfirmationDialogApiContext.Provider>
        </ConfirmationDialogStateContext.Provider>
    </ConfirmationDialogContext.Provider>
  );
};

export const useConfirmation = (): ConfirmationContextType => {
  const context = useContext(ConfirmationDialogContext);
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationDialogProvider');
  }
  return context;
};
