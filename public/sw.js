// Lemon PWA Service Worker v2.0 — with push notifications
const CACHE_NAME = 'lemon-v2';

const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico',
];

// ─── Install ───────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// ─── Activate ──────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch Strategy ────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.startsWith('/_next/static/')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          if (request.destination === 'document') {
            return caches.match('/');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// ─── Background Sync ───────────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-logs') {
    event.waitUntil(syncPendingLogs());
  }
});

async function syncPendingLogs() {
  console.log('[Lemon SW] Syncing pending logs...');
}

// ─── Push Notifications ────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data = {};
  try { data = event.data.json(); } catch { data = { body: event.data.text() }; }

  const title = data.title || '🍋 Lemon';
  const type  = data.type  || 'general';
  const url   = data.url   || getDefaultUrl(type);

  // Collapse notifications of the same type so they don't stack up
  const tag = data.tag || type;

  const options = {
    body:    data.body    || 'Time to log your progress!',
    icon:    data.icon    || '/icon-192.png',
    badge:   data.badge   || '/favicon-32.png',
    tag,
    // Renotify=true means a new push with the same tag still vibrates
    renotify: true,
    vibrate: [100, 50, 100],
    timestamp: Date.now(),
    data: { url, type },
    actions: getActions(type),
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

function getDefaultUrl(type) {
  switch (type) {
    case 'reminder_meal':    return '/?tab=meals';
    case 'reminder_workout': return '/?tab=workout';
    case 'reminder_water':   return '/?tab=dashboard';
    case 'motivation':       return '/';
    default:                 return '/';
  }
}

function getActions(type) {
  switch (type) {
    case 'reminder_meal':
      return [
        { action: 'log',     title: 'Log meal' },
        { action: 'dismiss', title: 'Later'    },
      ];
    case 'reminder_workout':
      return [
        { action: 'log',     title: 'Start workout' },
        { action: 'dismiss', title: 'Skip'          },
      ];
    case 'reminder_water':
      return [
        { action: 'log',     title: 'Log water' },
        { action: 'dismiss', title: 'Dismiss'   },
      ];
    default:
      return [
        { action: 'open',    title: 'Open Lemon' },
        { action: 'dismiss', title: 'Dismiss'    },
      ];
  }
}

// ─── Notification click ────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  // For action buttons, always navigate to the relevant deep link
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If the app is already open, navigate it and focus
      for (const client of clientList) {
        if ('navigate' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ─── Notification close (analytics hook) ──────────────────────────────────
self.addEventListener('notificationclose', (event) => {
  // Could POST to /api/push/analytics here if desired
  console.log('[Lemon SW] Notification dismissed:', event.notification.tag);
});
