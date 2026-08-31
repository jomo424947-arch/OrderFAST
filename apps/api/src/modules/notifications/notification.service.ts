import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { notifications } from '../../db/schema.js';
import { AppError } from '../../shared/errors/index.js';

export class NotificationService {
  /**
   * Retrieves paginated notifications for the authenticated user
   */
  async getUserNotifications(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Marks a single notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    const [updated] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      )
      .returning();

    if (!updated) {
      throw AppError.notFound('الإشعار غير موجود');
    }

    return updated;
  }

  /**
   * Marks all notifications as read for the user
   */
  async markAllAsRead(userId: string) {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }
}

export const notificationService = new NotificationService();
