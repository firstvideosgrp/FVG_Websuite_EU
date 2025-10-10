import React from 'react';
import { useNotificationContext } from '../contexts/NotificationContext';
import type { NotificationType } from '../types';

const notificationConfig: Record<NotificationType, { icon: string; bg: string; text: string }> = {
  success: { icon: 'fas fa-check-circle', bg: 'bg-green-500', text: 'text-green-500' },
  error: { icon: 'fas fa-times-circle', bg: 'bg-red-500', text: 'text-red-500' },
  warning: { icon: 'fas fa-exclamation-triangle', bg: 'bg-yellow-500', text: 'text-yellow-500' },
  info: { icon: 'fas fa-info-circle', bg: 'bg-blue-500', text: 'text-blue-500' },
};

const NotificationToast: React.FC<{ id: string, type: NotificationType, title: string, message: string, onDismiss: (id: string) => void }> = ({ id, type, title, message, onDismiss }) => {
  const config = notificationConfig[type];

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="bg-[var(--bg-card)] border-l-4 rounded-md shadow-lg w-full max-w-sm pointer-events-auto overflow-hidden animate-fade-in-right"
      style={{ borderColor: `var(--primary-color)` }} // Use primary color for consistency, or use config.bg for type-specific colors
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <i className={`${config.icon} ${config.text} text-2xl`}></i>
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-bold text-[var(--text-primary)]">{title}</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={() => onDismiss(id)}
              className="inline-flex text-[var(--text-secondary)] rounded-md hover:text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-color)]"
            >
              <span className="sr-only">Close</span>
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotificationContext();

  return (
    <div aria-live="polite" aria-atomic="true" className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-[200]">
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        {notifications.map((notification) => (
          <NotificationToast
            key={notification.id}
            id={notification.id}
            type={notification.type}
            title={notification.title}
            message={notification.message}
            onDismiss={removeNotification}
          />
        ))}
      </div>
    </div>
  );
};

export default NotificationContainer;
