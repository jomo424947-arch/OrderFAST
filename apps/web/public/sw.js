// FastOrder Service Worker for Web Push Notifications & Background Alerts

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for Web Push Notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const title = payload.title || 'FastOrder';
    const options = {
      body: payload.body || 'لديك تحديث جديد على طلبك',
      icon: payload.icon || '/logo.png',
      badge: payload.badge || '/logo.png',
      vibrate: [200, 100, 200],
      tag: payload.tag || 'fastorder-notification',
      renotify: true,
      data: {
        url: payload.url || payload.data?.url || '/student/orders',
        ...(payload.data || {}),
      },
      dir: 'rtl',
      lang: 'ar',
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('FastOrder', {
        body: text,
        icon: '/logo.png',
        badge: '/logo.png',
        dir: 'rtl',
        lang: 'ar',
      })
    );
  }
});

// Notification Click Handler (Open / Focus App Tab)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/student/orders';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing tab if open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
