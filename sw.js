const CACHE = 'cycle-v1';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', './icon.png'])));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const url = new URL(r.url);
  if (url.origin === location.origin) {
    // App files: try the internet first so updates arrive, fall back to the saved copy offline
    e.respondWith(
      fetch(r).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(r, copy));
        return res;
      }).catch(() => caches.match(r).then(m => m || caches.match('./')))
    );
  } else if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    // Fonts: use the saved copy, download once
    e.respondWith(
      caches.match(r).then(m => m || fetch(r).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(r, copy));
        return res;
      }))
    );
  }
});
