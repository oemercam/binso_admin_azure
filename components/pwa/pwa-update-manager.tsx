'use client'

import { useEffect, useState } from 'react'

export function PWAUpdateManager() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [updateReady, setUpdateReady] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || process.env.NODE_ENV !== 'production') return

    let disposed = false
    let activeRegistration: ServiceWorkerRegistration | null = null

    const onControllerChange = () => window.location.reload()
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then((nextRegistration) => {
        if (disposed) return
        activeRegistration = nextRegistration
        setRegistration(nextRegistration)
        setUpdateReady(Boolean(nextRegistration.waiting))

        nextRegistration.addEventListener('updatefound', () => {
          const worker = nextRegistration.installing
          if (!worker) return
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) setUpdateReady(true)
          })
        })

        nextRegistration.update().catch(() => undefined)
      })
      .catch(() => undefined)

    return () => {
      disposed = true
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
      activeRegistration = null
    }
  }, [])

  if (!updateReady || !registration?.waiting) return null

  return (
    <div className="pwa-update-banner" role="status" aria-live="polite">
      <span>Neue Version verfügbar.</span>
      <button type="button" onClick={() => registration.waiting?.postMessage({ type: 'SKIP_WAITING' })}>Jetzt aktualisieren</button>
    </div>
  )
}
