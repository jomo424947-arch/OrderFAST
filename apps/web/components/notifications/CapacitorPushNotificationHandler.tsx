'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { apiClient } from '@/lib/api/client';

const FCM_TOKEN_STORAGE_KEY = 'fastorder_fcm_token';

/**
 * Handles Capacitor Push Notifications on mobile devices (Android / iOS).
 * - Requests permission on Android 13+
 * - Creates high-priority notification channels (orders & status)
 * - Registers FCM token and syncs with backend API
 * - Routes to relevant screen on notification tap
 */
export function CapacitorPushNotificationHandler() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isRegisteredRef = useRef(false);

  // Sync token with backend when user becomes authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const storedToken = localStorage.getItem(FCM_TOKEN_STORAGE_KEY);
    if (storedToken) {
      apiClient
        .post('/notifications/devices', {
          token: storedToken,
          platform: 'android',
        })
        .then(() => {
          console.log('[Push] Device token synced successfully with user account.');
        })
        .catch((err) => {
          console.warn('[Push] Failed to sync device token with backend:', err);
        });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isSubscribed = true;

    async function initPushNotifications() {
      try {
        const capacitor = (window as any).Capacitor;
        const pushPlugin = capacitor?.Plugins?.PushNotifications;

        // Only run if native Capacitor PushNotifications plugin is available
        if (!pushPlugin) {
          return;
        }

        // 1. Create Android Notification Channels with Custom Sound
        try {
          if (pushPlugin.createChannel) {
            // Delete legacy channels if exists
            if (pushPlugin.deleteChannel) {
              try {
                await pushPlugin.deleteChannel({ id: 'fastorder_orders' });
                await pushPlugin.deleteChannel({ id: 'fastorder_status' });
              } catch {}
            }

            await pushPlugin.createChannel({
              id: 'fastorder_orders_v3',
              name: 'طلبات جديدة (كاشير)',
              description: 'إشعارات الطلبات الجديدة الواردة للكشك مع صوت ورنين مميز',
              importance: 5, // High / Heads-up
              visibility: 1, // Public
              sound: 'fastorder_bell',
              vibration: true,
              lights: true,
              lightColor: '#FFA41C',
            });

            await pushPlugin.createChannel({
              id: 'fastorder_status_v3',
              name: 'تحديثات حالة الطلب',
              description: 'إشعارات تغير حالة الطلب للطلاب مع نغمة تنبيه',
              importance: 5, // High / Heads-up
              visibility: 1, // Public
              sound: 'fastorder_bell',
              vibration: true,
              lights: true,
              lightColor: '#FFA41C',
            });
          }
        } catch (channelErr) {
          console.warn('[Push] Could not create notification channel:', channelErr);
        }

        // 2. Check and request notification permissions
        let permStatus = await pushPlugin.checkPermissions();
        if (permStatus.receive !== 'granted') {
          permStatus = await pushPlugin.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
          console.log('[Push] User denied or has not granted notification permissions');
          return;
        }

        // 3. Register listeners before calling register()
        if (!isRegisteredRef.current) {
          isRegisteredRef.current = true;

          // Token Registration Success
          await pushPlugin.addListener('registration', async (tokenData: { value: string }) => {
            if (!isSubscribed) return;
            const token = tokenData?.value;
            if (!token) return;

            console.log('[Push] Device registered with FCM, token:', token.substring(0, 16) + '...');
            localStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);

            // Sync with backend if already authenticated
            if (useAuthStore.getState().isAuthenticated) {
              try {
                await apiClient.post('/notifications/devices', {
                  token,
                  platform: 'android',
                });
                console.log('[Push] Device token registered with backend API.');
              } catch (apiErr) {
                console.warn('[Push] Error registering device token with API:', apiErr);
              }
            }
          });

          // Registration Error
          await pushPlugin.addListener('registrationError', (error: any) => {
            console.error('[Push] FCM Registration Error:', error);
          });

          // Foreground Notification Received
          await pushPlugin.addListener('pushNotificationReceived', (notification: any) => {
            console.log('[Push] Received in foreground:', notification.title, notification.body);
          });

          // Notification Tapped (Action Performed)
          await pushPlugin.addListener('pushNotificationActionPerformed', (action: any) => {
            console.log('[Push] Notification tapped:', action);
            const data = action?.notification?.data;
            if (!data) return;

            if (data.url) {
              router.push(data.url);
            } else if (data.orderId) {
              const role = useAuthStore.getState().role;
              if (role === 'cashier') {
                router.push('/cashier');
              } else {
                router.push(`/orders/${data.orderId}`);
              }
            }
          });
        }

        // 4. Register with Apple / Google APNs/FCM
        await pushPlugin.register();
      } catch (err) {
        console.warn('[Push] Push notification initialization skipped or failed:', err);
      }
    }

    initPushNotifications();

    return () => {
      isSubscribed = false;
    };
  }, [router]);

  return null;
}
