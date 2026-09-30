import type { MulticastMessage, SendResponse } from 'firebase-admin/messaging';
import { inArray, eq, and } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { userDeviceTokens } from '../../db/schema.js';
import { getFirebaseMessaging, isFirebaseConfigured } from './firebase.config.js';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  channelId?: 'fastorder_orders' | 'fastorder_status' | 'fastorder_cashier_chime_10s';
  priority?: 'high' | 'normal';
  sound?: string;
}

export class PushService {
  /**
   * Sends an FCM multicast message directly to an array of tokens (chunked in batches of 500)
   */
  async sendToTokens(
    tokens: string[],
    payload: PushPayload
  ): Promise<{ successCount: number; failureCount: number }> {
    if (!tokens || tokens.length === 0) {
      return { successCount: 0, failureCount: 0 };
    }

    if (!isFirebaseConfigured()) {
      console.log(`[PushService] Standby: Firebase not configured. Skipped push to ${tokens.length} token(s).`);
      return { successCount: 0, failureCount: 0 };
    }

    const messaging = getFirebaseMessaging();
    if (!messaging) return { successCount: 0, failureCount: 0 };

    const uniqueTokens = Array.from(new Set(tokens.filter(Boolean)));
    const baseChannel = payload.channelId || 'fastorder_status';
    let channelId = 'fastorder_status_v3';
    if (baseChannel === 'fastorder_cashier_chime_10s' || payload.sound === 'cashier_alarm_10s') {
      channelId = 'fastorder_cashier_urgent_v1';
    } else if (baseChannel.includes('orders')) {
      channelId = 'fastorder_orders_v3';
    }

    const sound = payload.sound || 'fastorder_bell';
    const apnsSound = payload.sound ? `${payload.sound}.wav` : 'fastorder_bell.wav';

    let totalSuccess = 0;
    let totalFailure = 0;
    const invalidTokens: string[] = [];

    // FCM sendEachForMulticast accepts max 500 tokens per call
    const BATCH_SIZE = 500;
    for (let i = 0; i < uniqueTokens.length; i += BATCH_SIZE) {
      const batch = uniqueTokens.slice(i, i + BATCH_SIZE);

      const multicastMessage: MulticastMessage = {
        tokens: batch,
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
            sound,
            priority: 'high',
            defaultSound: false,
            defaultVibrateTimings: true,
            visibility: 'public',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: apnsSound,
            },
          },
        },
        webpush: {
          headers: {
            Urgency: payload.priority === 'high' ? 'high' : 'normal',
            TTL: '86400',
          },
          notification: {
            title: payload.title,
            body: payload.body,
            icon: '/logo.png',
            badge: '/logo.png',
            tag: payload.channelId || 'fastorder-notification',
            dir: 'rtl',
            lang: 'ar',
          },
          fcmOptions: {
            link: payload.data?.url || '/student',
          },
        },
      };

      try {
        const response = await messaging.sendEachForMulticast(multicastMessage);
        totalSuccess += response.successCount;
        totalFailure += response.failureCount;

        response.responses.forEach((resp: SendResponse, idx: number) => {
          if (!resp.success && resp.error) {
            const code = resp.error.code;
            if (
              code === 'messaging/invalid-registration-token' ||
              code === 'messaging/registration-token-not-registered'
            ) {
              invalidTokens.push(batch[idx]);
            }
          }
        });
      } catch (err) {
        console.error('[PushService] Batch send error:', err);
        totalFailure += batch.length;
      }
    }

    console.log(`[PushService] FCM Result: ${totalSuccess} succeeded, ${totalFailure} failed.`);

    // Deactivate invalid tokens from DB
    if (invalidTokens.length > 0) {
      try {
        await db
          .update(userDeviceTokens)
          .set({ isActive: false, updatedAt: new Date() })
          .where(inArray(userDeviceTokens.token, invalidTokens));
      } catch (err) {
        console.warn('[PushService] Failed to deactivate invalid tokens:', err);
      }
    }

    return { successCount: totalSuccess, failureCount: totalFailure };
  }

  /**
   * Sends an FCM push notification to all active devices registered to the specified user IDs
   */
  async sendToUsers(userIds: string[], payload: PushPayload): Promise<void> {
    if (!userIds || userIds.length === 0) return;

    try {
      const devices = await db
        .select({ token: userDeviceTokens.token })
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

      await this.sendToTokens(
        devices.map((d) => d.token),
        payload
      );
    } catch (error) {
      console.error('[PushService] Unexpected error sending FCM push to users:', error);
    }
  }
}

export const pushService = new PushService();

