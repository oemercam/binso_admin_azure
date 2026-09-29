const CACHE = "binso-one-v5";
const APP_SHELL = ["/", "/offline", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png", "/brand/binso-icon-black.svg", "/brand/binso-icon-white.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then((cached) => cached || (event.request.mode === "navigate" ? caches.match("/offline") : caches.match("/")))
    )
  );
});
