const CACHE = 'binso-shell-v13'
const STATIC_ASSETS = ['/offline']

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()))
})

self.addEventListener('fetch', event => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  // Never cache API/authenticated business data. Only same-origin static assets are cached.
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/') || url.pathname.startsWith('/.auth/')) return
  if (request.destination === 'document') {
    event.respondWith(fetch(request).catch(() => caches.match('/offline')))
    return
  }
  if (['style','script','image','font'].includes(request.destination)) {
    event.respondWith(caches.match(request).then(hit => hit || fetch(request).then(response => {
      if (response.ok) caches.open(CACHE).then(cache => cache.put(request, response.clone()))
      return response
    })))
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
