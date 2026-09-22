const CACHE = 'binso-shell-v19'
const OFFLINE_URL = '/offline'

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/.auth/')) return

  // Navigations must always use the current deployment. Offline is fallback only.
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)))
    return
  }

  // Never serve cached Next.js JS/CSS first. Cache-first chunks can become stale
  // across deployments and lead to Safari/Next navigation failures.
  if (request.destination === 'script' || request.destination === 'style' || url.pathname.startsWith('/_next/')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request).then(hit => hit || Response.error()))
    )
    return
  }

  // Immutable visual assets are safe to cache after they have been fetched.
  if (request.destination === 'image' || request.destination === 'font') {
    event.respondWith(
      caches.match(request).then(hit => hit || fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone()
          caches.open(CACHE).then(cache => cache.put(request, copy))
        }
        return response
      }))
    )
  }
})

self.addEventListener('push', event => {
  const data = event.data?.json() ?? { title: 'Binso Admin', body: 'Neue Benachrichtigung' }
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icons/icon-192.svg',
    badge: '/icons/icon-192.svg',
    data: { url: data.url || '/' },
    tag: data.tag || 'binso-admin'
  }))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const target = event.notification.data?.url || '/'
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
    const existing = clients.find(client => 'focus' in client)
    if (existing) { existing.navigate(target); return existing.focus() }
    return self.clients.openWindow(target)
  }))
})
