const CACHE = 'wedding-v14';
const ASSETS = [
  'index.html','css/style.css','css/homepage.css','css/music.css','css/invitation.css','css/memories.css','js/script.js','js/firebase-config.js','js/firebase.js',
  'setup.html','preview.html','profile.html',
  'music.html','js/music.js',
  'invitation.html','js/invitation.js',
  'memories.html','js/memories.js',
  'planner.html','css/planner.css','js/planner.js',
  'about.html','gallery.html','events.html','rsvp.html','contact.html',
  'our-story.html','wedding-details.html','wedding-party.html','timeline.html','gift-registry.html','faq.html',
  'ai-assistant.html','css/ai-concierge.css','js/ai-concierge.js','js/ai-planner.js',
  'developer.html','css/developer.css','js/developer.js',
  'dashboard.html','css/dashboard.css','js/dashboard.js','js/dashboard-extensions.js',
  'login.html','signup.html','forgot-password.html','css/auth.css','js/auth.js','js/auth-guard.js',
  'js/notifications.js','css/sidebar.css','js/sidebar.js',
  'js/homepage.js','js/premium-gallery.js','js/global.js','js/floating-panel.js','js/website-title.js','js/invitation-system.js',
  'invite.html','css/invite.css',
  'share.html','css/share.css','js/share-center.js',
  '403.html','500.html','404.html','privacy.html','terms.html',
  'settings.html','css/settings.css','js/settings.js',
  'customize.html','css/customize.css','js/customize.js',
  'reminders.html','js/reminders.js',
  'media.html','js/media.js',
  'admin.html','css/admin.css','js/admin.js',
  'maintenance.html','js/maintenance.js',
  'js/error-logger.js','js/audit-log.js','js/backup.js','js/monitoring.js','js/api-stubs.js','js/ai-content.js',
  'js/verify-phase6.js','js/verify-phase7.js',
  'manifest.json','sitemap.xml','robots.txt',
  'icons/icon-192.svg','icons/icon-512.svg'
];

const OFFLINE_PAGE = '404.html';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks =>
      Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  // Network-first for HTML pages (ensures freshness)
  if (e.request.headers.get('accept') && e.request.headers.get('accept').includes('text/html')) {
    e.respondWith(
      fetch(e.request).then(r => {
        const clone = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return r;
      }).catch(() => caches.match(e.request).then(cached => cached || caches.match(OFFLINE_PAGE)))
    );
    return;
  }

  // Cache-first for static assets
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(r => {
        if (r.status === 200) {
          const clone = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return r;
      }).catch(() => {
        if (e.request.destination === 'image') {
          return new Response('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="#111" width="200" height="200"/><text fill="#888" x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="14">Offline</text></svg>', { headers: { 'Content-Type': 'image/svg+xml' } });
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// Background sync for RSVP submissions
self.addEventListener('sync', e => {
  if (e.tag === 'sync-rsvp') {
    e.waitUntil(syncPendingRSVPs());
  }
  if (e.tag === 'sync-analytics') {
    e.waitUntil(syncPendingAnalytics());
  }
});

async function syncPendingRSVPs() {
  try {
    const cache = await caches.open('pending-rsvps');
    const keys = await cache.keys();
    for (const req of keys) {
      const data = await cache.match(req).then(r => r.json());
      await fetch(req, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      await cache.delete(req);
    }
  } catch {}
}

async function syncPendingAnalytics() {
  try {
    const pending = JSON.parse(localStorage.getItem('pendingAnalytics') || '[]');
    if (pending.length) {
      for (const event of pending) {
        await fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(event) }).catch(() => {});
      }
      localStorage.removeItem('pendingAnalytics');
    }
  } catch {}
}

// Push notifications
self.addEventListener('push', e => {
  if (!e.data) return;
  const data = e.data.json();
  const options = {
    body: data.body || 'New notification',
    icon: 'icons/icon-192.svg',
    badge: 'icons/icon-192.svg',
    vibrate: [200, 100, 200],
    tag: data.tag || 'wedding-notification',
    data: { url: data.url || '/index.html' }
  };
  e.waitUntil(self.registration.showNotification(data.title || 'Forever & Always', options));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data.url));
});
