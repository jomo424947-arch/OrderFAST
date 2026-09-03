import { apiClient } from '@/lib/api/client';
import { Notification, UserRole } from '@/types';
import { INotificationService } from '../notificationService';

export interface ApiNotificationRaw {
  id: string;
  userId: string;
  orderId?: string | null;
  type: 'order_status' | 'kiosk_notice' | 'system' | 'warning';
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

function adaptNotificationFromApi(raw: ApiNotificationRaw, role: UserRole = 'student'): Notification {
  return {
    id: raw.id,
    userId: raw.userId,
    userRole: role,
    title: raw.title,
    body: raw.body,
    type: raw.type,
    orderId: raw.orderId || undefined,
    isRead: !!raw.isRead,
    createdAt: raw.createdAt,
  };
}

export class ApiNotificationService implements INotificationService {
  async getNotifications(_userId?: string, role: UserRole = 'student'): Promise<Notification[]> {
    const result = await apiClient.get<ApiNotificationRaw[]>('/notifications');
    const items = Array.isArray(result) ? result : [];
    return items.map((item: ApiNotificationRaw) => adaptNotificationFromApi(item, role));
  }

  async markAsRead(notificationId: string): Promise<void> {
    await apiClient.patch(`/notifications/${notificationId}/read`);
  }

  async markAllAsRead(_userId?: string): Promise<void> {
    await apiClient.patch('/notifications/read-all');
  }
}
