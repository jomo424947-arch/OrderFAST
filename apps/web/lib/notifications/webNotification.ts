/**
 * FastOrder Web Push & Browser Notifications Utility
 */

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function isServiceWorkerSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    return registration;
  } catch (err) {
    console.warn('[WebNotification] Service worker registration failed:', err);
    return null;
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('[WebNotification] Error requesting notification permission:', err);
    return 'denied';
  }
}

/**
 * Plays a pleasant notification bell chime using the Web Audio API
 * No external audio files needed; works instantly and offline.
 */
export function playNotificationSound(): void {
  if (typeof window === 'undefined') return;

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();

    // First tone (pleasant ding)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    gain1.gain.setValueAtTime(0.2, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.4);

    // Second harmonic tone (bell sparkle)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
    gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.08);
    osc2.stop(ctx.currentTime + 0.5);
  } catch {
    // Ignore audio context block if user hasn't interacted
  }
}

/**
 * Triggers a system notification in the browser / mobile notification bar
 */
export async function showBrowserNotification(
  title: string,
  options: {
    body: string;
    url?: string;
    tag?: string;
  }
): Promise<void> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  // Play audio chime
  playNotificationSound();

  // Try showing via Service Worker first (best for mobile browsers)
  if (isServiceWorkerSupported()) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        const swOptions: any = {
          body: options.body,
          icon: '/logo.png',
          badge: '/logo.png',
          vibrate: [200, 100, 200],
          tag: options.tag || 'fastorder-status',
          renotify: true,
          data: {
            url: options.url || '/student/orders',
          },
          dir: 'rtl',
          lang: 'ar',
        };
        await reg.showNotification(title, swOptions);
        return;
      }
    } catch (swErr) {
      console.warn('[WebNotification] Failed to show via service worker:', swErr);
    }
  }

  // Fallback to standard Notification API
  try {
    const notif = new Notification(title, {
      body: options.body,
      icon: '/logo.png',
      badge: '/logo.png',
      tag: options.tag || 'fastorder-status',
      dir: 'rtl',
      lang: 'ar',
    });

    notif.onclick = () => {
      window.focus();
      if (options.url) {
        window.location.href = options.url;
      }
      notif.close();
    };
  } catch (notifErr) {
    console.warn('[WebNotification] Fallback notification failed:', notifErr);
  }
}
