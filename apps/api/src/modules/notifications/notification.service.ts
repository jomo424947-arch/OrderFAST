import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { notifications, userDeviceTokens } from '../../db/schema.js';
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

  /**
   * Registers or updates an FCM device token for push notifications
   */
  async registerDevice(userId: string, token: string, platform = 'android') {
    if (!token || typeof token !== 'string') {
      throw AppError.badRequest('رمز الجهاز (Device Token) مطلوب');
    }

    // Check if token already exists
    const [existing] = await db
      .select()
      .from(userDeviceTokens)
      .where(eq(userDeviceTokens.token, token))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(userDeviceTokens)
        .set({
          userId,
          platform,
          isActive: true,
          lastUsedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userDeviceTokens.id, existing.id))
        .returning();

      return updated;
    }

    const [created] = await db
      .insert(userDeviceTokens)
      .values({
        userId,
        token,
        platform,
        isActive: true,
      })
      .returning();

    return created;
  }

  /**
   * Unregisters (deactivates) a device token upon logout
   */
  async unregisterDevice(userId: string, token: string) {
    if (!token) return;

    await db
      .update(userDeviceTokens)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userDeviceTokens.token, token),
          eq(userDeviceTokens.userId, userId)
        )
      );
  }
}

export const notificationService = new NotificationService();
