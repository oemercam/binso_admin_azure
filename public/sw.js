const VERSION = new URL(self.location.href).searchParams.get('v') || 'legacy'
const CACHE = `binso-shell-${VERSION}`
const OFFLINE_URL = '/offline'

function safeAppPath(value) {
  try {
    const url = new URL(typeof value === 'string' && value ? value : '/', self.location.origin)
    if (url.origin !== self.location.origin) return '/'
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return '/'
  }
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.add(OFFLINE_URL))
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

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('push', event => {
  const data = event.data?.json() ?? { title: 'Binso Admin', body: 'Neue Benachrichtigung' }
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icons/app-192.png',
    badge: '/icons/app-192.png',
    data: { url: safeAppPath(data.url) },
    tag: data.tag || 'binso-admin'
  }))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const target = safeAppPath(event.notification.data?.url)
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
    const existing = clients.find(client => 'focus' in client)
    if (existing) { existing.navigate(target); return existing.focus() }
    return self.clients.openWindow(target)
  }))
})
