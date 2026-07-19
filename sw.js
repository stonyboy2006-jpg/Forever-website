const CACHE = 'wedding-v11';
const ASSETS = [
  'index.html','css/style.css','css/homepage.css','css/music.css','css/invitation.css','css/memories.css','js/script.js','js/firebase-config.js','js/firebase.js',
  'setup.html','preview.html','js/admin.js',
  'profile.html',
  'music.html','js/music.js',
  'invitation.html','js/invitation.js',
  'memories.html','js/memories.js',
  'planner.html','css/planner.css','js/planner.js',
  'about.html','gallery.html','events.html','rsvp.html','contact.html',
  'our-story.html','wedding-details.html','wedding-party.html','timeline.html','gift-registry.html','faq.html',
  'ai-assistant.html','css/ai-concierge.css','js/ai-concierge.js','js/ai-planner.js',
  'developer.html','css/developer.css','js/developer.js',
  'dashboard.html','css/dashboard.css','js/dashboard.js',
  'login.html','signup.html','forgot-password.html','css/auth.css','js/auth.js','js/auth-guard.js',
  'js/notifications.js','css/sidebar.css','js/sidebar.js',
  'js/homepage.js','js/premium-gallery.js','js/global.js','js/floating-panel.js','js/website-title.js',
  '404.html','privacy.html','terms.html',
  'manifest.json','sitemap.xml','robots.txt'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(()=>{})));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).then(r => {
        const clone = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return r;
      }).catch(() => cached)
    )
  );
});
