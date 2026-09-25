'use client'

import { useEffect, useRef, useState } from 'react'
import { publicEnv } from '@/lib/config/public-env'

const ACTIVE_BUILD_KEY = 'binso:pwa-active-build'

function workerBuildId(worker: ServiceWorker | null | undefined) {
  if (!worker) return null
  try {
    return new URL(worker.scriptURL).searchParams.get('v')
  } catch {
    return null
  }
}

export function PWAUpdateManager() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [updateReady, setUpdateReady] = useState(false)
  const reloadAfterUpdate = useRef(false)
  const cleanupRegistrationListeners = useRef<(() => void) | null>(null)
  const buildId = publicEnv.buildId

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !publicEnv.isProduction || !buildId) return

    let disposed = false

    const onControllerChange = () => {
      if (reloadAfterUpdate.current) window.location.reload()
    }

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    const syncUpdateState = (nextRegistration: ServiceWorkerRegistration) => {
      if (disposed) return

      const activeBuild = workerBuildId(nextRegistration.active)
      const waitingBuild = workerBuildId(nextRegistration.waiting)

      // The currently active worker already belongs to this deployment.
      // Keep local state in sync and never show an update banner.
      if (activeBuild === buildId && !nextRegistration.waiting) {
        window.localStorage.setItem(ACTIVE_BUILD_KEY, buildId)
        setUpdateReady(false)
        return
      }

      // Only announce an update when a worker for THIS deployment is actually
      // installed and waiting while an older worker still controls the app.
      if (waitingBuild === buildId && activeBuild !== buildId) {
        setRegistration(nextRegistration)
        setUpdateReady(true)
        return
      }

      setUpdateReady(false)
    }

    const scriptUrl = `/sw.js?v=${encodeURIComponent(buildId)}`

    navigator.serviceWorker.register(scriptUrl, { scope: '/', updateViaCache: 'none' })
      .then((nextRegistration) => {
        if (disposed) return

        setRegistration(nextRegistration)

        // A fresh installation has no previous controller and therefore is not
        // an "update". Remember the current build without showing a message.
        if (!navigator.serviceWorker.controller) {
          window.localStorage.setItem(ACTIVE_BUILD_KEY, buildId)
          setUpdateReady(false)
        } else {
          syncUpdateState(nextRegistration)
        }

        nextRegistration.addEventListener('updatefound', () => {
          const worker = nextRegistration.installing
          if (!worker) return

          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed') syncUpdateState(nextRegistration)
          })
        })

        // Explicitly check the registered worker. The browser only installs a
        // new worker when the registration actually changed.
        nextRegistration.update().then(() => syncUpdateState(nextRegistration)).catch(() => undefined)

        let lastCheck = 0
        const checkForUpdate = () => {
          if (disposed) return
          const now = Date.now()
          if (now - lastCheck < 60_000) return
          lastCheck = now
          nextRegistration.update().then(() => syncUpdateState(nextRegistration)).catch(() => undefined)
        }

        const onVisibilityChange = () => {
          if (document.visibilityState === 'visible') checkForUpdate()
        }

        window.addEventListener('online', checkForUpdate)
        window.addEventListener('pageshow', checkForUpdate)
        document.addEventListener('visibilitychange', onVisibilityChange)

        cleanupRegistrationListeners.current = () => {
          window.removeEventListener('online', checkForUpdate)
          window.removeEventListener('pageshow', checkForUpdate)
          document.removeEventListener('visibilitychange', onVisibilityChange)
        }
      })
      .catch(() => undefined)

    return () => {
      disposed = true
      cleanupRegistrationListeners.current?.()
      cleanupRegistrationListeners.current = null
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    }
  }, [buildId])

  if (!buildId || !updateReady || !registration?.waiting) return null

  function installUpdate() {
    const waiting = registration?.waiting
    if (!waiting || !buildId) return

    window.localStorage.setItem(ACTIVE_BUILD_KEY, buildId)
    reloadAfterUpdate.current = true
    setUpdateReady(false)
    waiting.postMessage({ type: 'SKIP_WAITING' })
  }

  return (
    <div className="pwa-update-banner" role="status" aria-live="polite">
      <span>Neue Version verfügbar.</span>
      <button type="button" onClick={installUpdate}>Jetzt aktualisieren</button>
    </div>
  )
}
