'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import {
  isNotificationSupported,
  registerServiceWorker,
  requestNotificationPermission,
  showBrowserNotification,
} from '@/lib/notifications/webNotification';
import { Bell, X, Check } from 'lucide-react';

const DISMISSED_BANNER_KEY = 'fastorder_push_banner_dismissed';

export function WebPushNotificationHandler() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const notifications = useNotificationStore((state) => state.notifications);

  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showPromptBanner, setShowPromptBanner] = useState<boolean>(false);
  const [isActivating, setIsActivating] = useState<boolean>(false);
  const [justActivated, setJustActivated] = useState<boolean>(false);

  const prevNotificationsCountRef = useRef<number>(0);
  const initializedRef = useRef<boolean>(false);

  // 1. Initialize Service Worker & check permission state
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if Capacitor native plugin is active (if so, Capacitor handles push natively)
    const isCapacitor = Boolean((window as any).Capacitor?.Plugins?.PushNotifications);
    if (isCapacitor) return;

    if (!isNotificationSupported()) return;

    // Register SW
    registerServiceWorker();

    setPermission(Notification.permission);

    // Show prompt banner if user is logged in, permission is default, and not previously dismissed
    const isDismissed = sessionStorage.getItem(DISMISSED_BANNER_KEY);
    if (Notification.permission === 'default' && !isDismissed && isAuthenticated) {
      // Delay slightly for smooth page load
      const timer = setTimeout(() => setShowPromptBanner(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  // 2. Request Permission Handler
  const handleEnableNotifications = async () => {
    setIsActivating(true);
    try {
      const result = await requestNotificationPermission();
      setPermission(result);

      if (result === 'granted') {
        setShowPromptBanner(false);
        setJustActivated(true);

        // Send a friendly verification notification immediately
        await showBrowserNotification('FastOrder - تم تفعيل الإشعارات', {
          body: 'ستصلك تنبيهات حالة طلباتك مباشرة على هذا الجهاز.',
          url: '/student/orders',
        });

        setTimeout(() => setJustActivated(false), 4000);
      } else {
        setShowPromptBanner(false);
      }
    } catch (err) {
      console.warn('[WebPush] Permission request error:', err);
    } finally {
      setIsActivating(false);
    }
  };

  const handleDismissBanner = () => {
    setShowPromptBanner(false);
    sessionStorage.setItem(DISMISSED_BANNER_KEY, 'true');
  };

  // 3. Monitor notifications in real time and trigger browser notification if new one arrives
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (permission !== 'granted') return;

    // Skip on initial load to avoid re-triggering for past notifications
    if (!initializedRef.current) {
      initializedRef.current = true;
      prevNotificationsCountRef.current = notifications.length;
      return;
    }

    // If new notifications arrived
    if (notifications.length > prevNotificationsCountRef.current) {
      const newest = notifications[0];
      if (newest && !newest.isRead) {
        showBrowserNotification(newest.title, {
          body: newest.body,
          url: newest.orderId ? `/student/orders` : '/student/notifications',
          tag: `notif-${newest.id}`,
        });
      }
    }

    prevNotificationsCountRef.current = notifications.length;
  }, [notifications, permission]);

  // Success toast when just activated
  if (justActivated) {
    return (
      <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 max-w-sm z-50 bg-emerald-600 text-white rounded-2xl p-3.5 shadow-floating flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <Check className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-xs">تم تفعيل الإشعارات بنجاح</p>
          <p className="font-body text-[11px] text-white/90">ستصلك التنبيهات على جهازك بصوت واهتزاز.</p>
        </div>
      </div>
    );
  }

  // Prompt Banner
  if (!showPromptBanner) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-4 left-3 right-3 sm:left-auto sm:right-4 max-w-md z-40 bg-surface border-2 border-primary/40 rounded-3xl p-4 shadow-floating animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-primary text-primary-ink flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5">
          <Bell className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-display font-bold text-xs sm:text-sm text-ink">
              تفعيل إشعارات المتصفح
            </h4>
            <button
              type="button"
              onClick={handleDismissBanner}
              className="text-ink-soft hover:text-ink p-1 rounded-lg transition-colors"
              aria-label="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="font-body text-[11px] sm:text-xs text-ink-soft mt-1 leading-relaxed">
            فعّل التنبيهات لتصلك تحديثات طلبك (قبول، تحضير، جاهز للاستلام) على هاتفك أولاً بأول حتى عند تصغير المتصفح.
          </p>

          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              disabled={isActivating}
              onClick={handleEnableNotifications}
              className="bg-primary hover:bg-primary-hover text-primary-ink font-body font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50"
            >
              {isActivating ? 'جارِ التفعيل...' : 'تفعيل الإشعارات الآن'}
            </button>
            <button
              type="button"
              onClick={handleDismissBanner}
              className="text-ink-soft hover:text-ink font-body text-xs px-2.5 py-2 transition-colors"
            >
              لاحقاً
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
