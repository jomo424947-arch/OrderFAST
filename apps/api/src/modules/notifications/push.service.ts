import type { MulticastMessage, SendResponse } from 'firebase-admin/messaging';
import { inArray, eq, and } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { userDeviceTokens } from '../../db/schema.js';
import { getFirebaseMessaging, isFirebaseConfigured } from './firebase.config.js';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  channelId?: 'fastorder_orders' | 'fastorder_status';
  priority?: 'high' | 'normal';
}

export class PushService {
  /**
   * Sends an FCM push notification to all active devices registered to the specified user IDs
   */
  async sendToUsers(userIds: string[], payload: PushPayload): Promise<void> {
    if (!userIds || userIds.length === 0) return;

    if (!isFirebaseConfigured()) {
      console.log(`[PushService] Standby: Firebase not configured. Skipped push to ${userIds.length} user(s).`);
      return;
    }

    const messaging = getFirebaseMessaging();
    if (!messaging) return;

    try {
      // 1. Fetch active device tokens for the target users
      const devices = await db
        .select({
          id: userDeviceTokens.id,
          token: userDeviceTokens.token,
          userId: userDeviceTokens.userId,
        })
        .from(userDeviceTokens)
        .where(
          and(
            inArray(userDeviceTokens.userId, userIds),
            eq(userDeviceTokens.isActive, true)
          )
        );

      if (devices.length === 0) {
        console.log(`[PushService] No active registered devices found for user(s): ${userIds.join(', ')}`);
        return;
      }

      // Deduplicate tokens
      const uniqueTokens = Array.from(new Set(devices.map((d) => d.token)));

      const baseChannel = payload.channelId || 'fastorder_status';
      const channelId = baseChannel.includes('orders') ? 'fastorder_orders_v3' : 'fastorder_status_v3';

      const multicastMessage: MulticastMessage = {
        tokens: uniqueTokens,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: {
          ...(payload.data || {}),
          title: payload.title,
          body: payload.body,
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
        android: {
          priority: 'high',
          notification: {
            channelId,
            sound: 'fastorder_bell',
            priority: 'high',
            defaultSound: false,
            defaultVibrateTimings: true,
            visibility: 'public',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'fastorder_bell.wav',
            },
          },
        },
      };

      const response = await messaging.sendEachForMulticast(multicastMessage);
      console.log(`[PushService] FCM Result: ${response.successCount} sent successfully, ${response.failureCount} failed`);

      // 2. Cleanup expired or invalid tokens automatically
      if (response.failureCount > 0) {
        const invalidTokens: string[] = [];
        response.responses.forEach((resp: SendResponse, index: number) => {
          if (!resp.success && resp.error) {
            const errorCode = resp.error.code;
            if (
              errorCode === 'messaging/invalid-registration-token' ||
              errorCode === 'messaging/registration-token-not-registered'
            ) {
              invalidTokens.push(uniqueTokens[index]);
            }
          }
        });

        if (invalidTokens.length > 0) {
          console.log(`[PushService] Deactivating ${invalidTokens.length} unregistered token(s)`);
          await db
            .update(userDeviceTokens)
            .set({ isActive: false, updatedAt: new Date() })
            .where(inArray(userDeviceTokens.token, invalidTokens));
        }
      }
    } catch (error) {
      console.error('[PushService] Unexpected error sending FCM push:', error);
    }
  }
}

export const pushService = new PushService();
