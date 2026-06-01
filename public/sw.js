// Minimal service worker for Ancestory PWA
// Provides basic offline shell + fast repeat visits

const CACHE_NAME = "ancestory-v1";
const SHELL_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/morph/face-shape-oval.png",
  "/morph/face-shapes-grid.png",
];

// Install: cache core shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network first for data, cache first for shell + static
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // For the main app shell and static assets → cache first
  if (url.pathname === "/" || url.pathname.startsWith("/morph/") || url.pathname.includes(".webmanifest")) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, resClone));
          return res;
        });
      })
    );
    return;
  }

  // Default: network first, fallback to cache (good for research data)
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(event.request, resClone));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
