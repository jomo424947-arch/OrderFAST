import { Notification, UserRole } from "@/types";
import { MOCK_NOTIFICATIONS } from "@/lib/mock/notifications";

export interface INotificationService {
  getNotifications(userId: string, role: UserRole): Promise<Notification[]>;
  markAsRead(notificationId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
}

export class MockNotificationService implements INotificationService {
  private notifications: Notification[] = [...MOCK_NOTIFICATIONS];

  async getNotifications(userId: string, role: UserRole): Promise<Notification[]> {
    return this.notifications.filter(
      (n) => n.userId === userId || n.userRole === role
    );
  }

  async markAsRead(notificationId: string): Promise<void> {
    const notif = this.notifications.find((n) => n.id === notificationId);
    if (notif) notif.isRead = true;
  }

  async markAllAsRead(userId: string): Promise<void> {
    this.notifications.forEach((n) => {
      if (n.userId === userId) n.isRead = true;
    });
  }
}

import { ApiNotificationService } from "./api/apiNotificationService";

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === "true";
export const notificationService: INotificationService = useMock ? new MockNotificationService() : new ApiNotificationService();
