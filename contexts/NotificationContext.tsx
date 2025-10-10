import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Notification, NotificationType } from '../types';

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (type: NotificationType, title: string, message: string) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addNotification = useCallback((type: NotificationType, title: string, message: string) => {
    const id = crypto.randomUUID();
    setNotifications(prev => [...prev, { id, type, title, message }]);

    if (type !== 'error') {
      setTimeout(() => {
        removeNotification(id);
      }, 5000);
    }
  }, [removeNotification]);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): Pick<NotificationContextType, 'addNotification'> => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return { addNotification: context.addNotification };
};

// Expose the full context for the container
export const useNotificationContext = (): NotificationContextType => {
    const context = useContext(NotificationContext);
    if (!context) {
      throw new Error('useNotificationContext must be used within a NotificationProvider');
    }
    return context;
}
