import { create } from 'zustand';
import { Notification, UserRole } from '@/types';
import { notificationService } from '@/lib/services/notificationService';

interface NotificationState {
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;

  fetchNotifications: (userId?: string, role?: UserRole, silent?: boolean) => Promise<Notification[]>;
  startNotificationsPolling: (userId?: string, role?: UserRole, intervalMs?: number) => () => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (userId?: string) => Promise<void>;
  addNotification: (notif: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
  getUnreadCount: (role?: string) => number;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  isLoading: false,
  error: null,

  fetchNotifications: async (userId?: string, role?: UserRole, silent = false) => {
    try {
      if (!silent) set({ isLoading: true, error: null });
      const fetched = await notificationService.getNotifications(userId || '', role || 'student');
      set({ notifications: fetched, isLoading: false });
      return fetched;
    } catch (err: any) {
      if (!silent) set({ isLoading: false, error: err.message || 'فشل جلب الإشعارات' });
      return [];
    }
  },

  startNotificationsPolling: (userId?: string, role?: UserRole, intervalMs = 8000) => {
    get().fetchNotifications(userId, role, false);

    const intervalId = setInterval(async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      await get().fetchNotifications(userId, role, true);
    }, intervalMs);

    return () => clearInterval(intervalId);
  },

  markAsRead: async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
      }));
    } catch {
      // Local optimistic update fallback
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
      }));
    }
  },

  markAllAsRead: async (userId?: string) => {
    try {
      await notificationService.markAllAsRead(userId || '');
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      }));
    } catch {
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      }));
    }
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

  getUnreadCount: (role?: string) => {
    return get().notifications.filter(
      (n) => (!role || n.userRole === role || n.userRole === 'student') && !n.isRead
    ).length;
  },
}));
