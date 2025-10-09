/* ======== Freedom Prayer Power - Service Worker ======== */

const CACHE_NAME = "prayerpower-v1";
const OFFLINE_URLS = [
  "./",
  "./index.html",
  "./app.js",
  "./chapters.json",
  "./styles.css",
  "./manifest.json",
  "https://cdn.jsdelivr.net/npm/marked/marked.min.js"
];

// Cache install
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("📘 Caching resources...");
      return cache.addAll(OFFLINE_URLS);
    })
  );
  self.skipWaiting();
});

// Fetch from cache, fallback to network
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Serve from cache first
      return (
        response ||
        fetch(event.request).then(fetchResponse => {
          return caches.open(CACHE_NAME).then(cache => {
            // Cache new resource for offline use
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        })
      );
    }).catch(() => {
      // Fallback message for offline errors
      return new Response(
        `<h3 style="font-family:sans-serif;text-align:center;">📴 You're offline.<br>Check your connection.</h3>`,
        { headers: { "Content-Type": "text/html" } }
      );
    })
  );
});

// Clean up old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) {
          console.log("🧹 Removing old cache:", key);
          return caches.delete(key);
        }
      }))
    )
  );
  self.clients.claim();
});
