const CACHE = "binso-one-shell-v7";
const OFFLINE_URL = "/offline";
const SHELL_ASSETS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/manifest-admin.webmanifest",
  "/manifest-portal.webmanifest",
  "/brand/logo-black.svg",
  "/brand/icon-black.svg",
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(SHELL_ASSETS))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith("binso-one-shell-") && key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never proxy or cache Next.js build assets. They are content-hashed and
  // must always be resolved by the browser/HTTP cache for the active build.
  if (url.pathname.startsWith("/_next/")) return;

  // App/document navigations are always network-first; only use the offline
  // document when the network is genuinely unavailable.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .catch(() => caches.open(CACHE).then(cache => cache.match(OFFLINE_URL)))
    );
    return;
  }

  // Small stable public shell assets may use network-first caching.
  if (url.pathname.startsWith("/brand/") || ["/manifest.webmanifest", "/manifest-admin.webmanifest", "/manifest-portal.webmanifest"].includes(url.pathname)) {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.open(CACHE).then(cache => cache.match(request)))
    );
  }
});

self.addEventListener("message",event=>{if(event.data?.type==="SKIP_WAITING")self.skipWaiting();});
