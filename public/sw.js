// Minimal service worker for Ancestory PWA (base-aware for GitHub Pages subpaths)
// Provides basic offline shell + fast repeat visits

const CACHE_NAME = "ancestory-v3"; // bumped after base-aware hardening + data fix

// Derive the app base from the SW's registration scope (works for / and /ancestory/)
const SCOPE = self.registration.scope;
const BASE = new URL(SCOPE).pathname.replace(/\/$/, ""); // e.g. "" or "/ancestory"

function u(path) {
  // Join base + path safely
  if (path.startsWith("http")) return path;
  const p = path.startsWith("/") ? path : "/" + path;
  return BASE + p;
}

const SHELL_ASSETS = [
  u("/"),
  u("/index.html"),
  u("/manifest.webmanifest"),
  u("/morph/face-shape-oval.png"),
  u("/morph/face-shapes-grid.png"),
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

// Fetch handler — base-aware
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  const pathname = url.pathname;

  // Is this request under our app's base?
  const underBase = !BASE || pathname.startsWith(BASE + "/") || pathname === BASE;

  if (!underBase) return; // let other requests go through normally

  const isShell =
    pathname === BASE ||
    pathname === BASE + "/" ||
    pathname === BASE + "/index.html" ||
    pathname.startsWith(BASE + "/morph/") ||
    pathname.includes(".webmanifest");

  if (isShell) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          return res;
        });
      })
    );
    return;
  }

  // Default for data/JSON/other app assets: network first, cache fallback (good for research data)
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
