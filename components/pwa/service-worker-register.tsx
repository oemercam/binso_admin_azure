'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || process.env.NODE_ENV !== 'production') return

    let cancelled = false

    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then((registration) => {
        if (cancelled) return
        registration.update().catch(() => undefined)
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [])

  return null
}
