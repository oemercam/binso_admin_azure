const CACHE = "binso-one-static-v3";
const PUBLIC_SHELL = ["/", "/login", "/offline", "/manifest.webmanifest", "/brand/logo-black.svg", "/brand/icon-black.svg"];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(PUBLIC_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigations should always prefer the network so new deploys are visible immediately.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .catch(() => caches.match("/offline"))
    );
    return;
  }

  // During active UX testing, always prefer fresh Next.js assets.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  if (url.pathname.startsWith("/brand/") || url.pathname === "/manifest.webmanifest") {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
});
