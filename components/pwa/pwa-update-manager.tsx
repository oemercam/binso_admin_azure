'use client'

import { useEffect, useRef, useState } from 'react'

export function PWAUpdateManager() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [updateReady, setUpdateReady] = useState(false)
  const refreshRequested = useRef(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || process.env.NODE_ENV !== 'production') return

    let disposed = false
    const onControllerChange = () => {
      if (refreshRequested.current) window.location.reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then((nextRegistration) => {
        if (disposed) return
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
    }
  }, [])

  if (!updateReady || !registration?.waiting) return null

  return (
    <div className="pwa-update-banner" role="status" aria-live="polite">
      <span>Neue Version verfügbar.</span>
      <button type="button" onClick={() => {
        refreshRequested.current = true
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' })
      }}>Jetzt aktualisieren</button>
    </div>
  )
}
