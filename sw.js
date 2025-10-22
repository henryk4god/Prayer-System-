const CACHE_NAME = 'breakthrough-prayer-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/content/toc.md',
  '/content/chapter1.md',
  '/content/chapter2.md',
  '/content/chapter3.md',
  '/content/chapter4.md',
  '/content/chapter5.md',
  '/content/chapter6.md',
  '/content/chapter7.md',
  'https://cdn.jsdelivr.net/npm/marked/marked.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
