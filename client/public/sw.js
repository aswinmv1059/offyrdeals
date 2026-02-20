const CACHE_NAME = 'offeyrdeals-cache-v1';
const BASE_PATH = self.location.pathname.replace(/sw\.js$/, '');
const OFFLINE_URL = `${BASE_PATH}offline.html`;
const HOME_URL = BASE_PATH;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([HOME_URL, OFFLINE_URL]))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request).catch(() => caches.match(OFFLINE_URL)))
  );
});
