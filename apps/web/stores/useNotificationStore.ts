import { create } from 'zustand';
import { Notification } from '@/types';
import { MOCK_NOTIFICATIONS } from '@/lib/mock/notifications';

interface NotificationState {
  notifications: Notification[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notif: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
  getUnreadCount: (role: string) => number;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [...MOCK_NOTIFICATIONS],

  markAsRead: (id: string) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
    }));
  },

  addNotification: (notifData) => {
    const newNotif: Notification = {
      ...notifData,
      id: `notif-${Date.now()}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      notifications: [newNotif, ...state.notifications],
    }));
  },

  getUnreadCount: (role: string) => {
    return get().notifications.filter(
      (n) => (n.userRole === role || n.userRole === 'student') && !n.isRead
    ).length;
  },
}));
