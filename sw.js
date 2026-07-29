// Walla Walla Tasting Rooms — offline app-shell cache
const CACHE_NAME = 'ww-tasting-rooms-v1';
const SHELL_ASSETS = [
  './walla-walla-tasting-rooms.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-180.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first for our own shell files; network passthrough for everything else
// (fonts, map tiles, Google Maps links) so those always stay fresh.
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isShellAsset = SHELL_ASSETS.some(a => url.pathname.endsWith(a.replace('./', '/')));

  if (isShellAsset) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(resp => {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return resp;
        });
      })
    );
  }
  // else: let the browser handle it normally (network)
});
