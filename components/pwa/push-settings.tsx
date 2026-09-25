'use client'

import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/http/api-client'
import { ApiError } from '@/lib/http/errors'
import { useFeedback } from '@/components/ui/feedback'
import { publicEnv } from '@/lib/config/public-env'

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - base64.length % 4) % 4)
  const value = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0))
}

export function PushSettings() {
  const [supported, setSupported] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const feedback = useFeedback()
  const publicKey = publicEnv.vapidPublicKey

  useEffect(() => {
    const isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) setSupported(isSupported)
    })
    if (!isSupported) return () => { cancelled = true }

    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => {
        if (!cancelled) setEnabled(Boolean(subscription))
      })
      .catch(() => {
        if (!cancelled) feedback.warning('Push-Status konnte nicht gelesen werden.')
      })
    return () => { cancelled = true }
  }, [feedback])

  async function toggle() {
    if (!publicKey && !enabled) {
      feedback.warning('Push ist vorbereitet, aber noch nicht produktiv konfiguriert. Es fehlt NEXT_PUBLIC_VAPID_PUBLIC_KEY.')
      return
    }

    setBusy(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const current = await registration.pushManager.getSubscription()
      if (current) {
        await apiRequest<{ ok: boolean }>('/api/push/subscriptions', {
          method: 'DELETE',
          body: JSON.stringify(current.toJSON()),
        })
        await current.unsubscribe()
        setEnabled(false)
        feedback.success('Push wurde auf diesem Gerät deaktiviert.')
        return
      }

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        feedback.info('Benachrichtigungen wurden nicht freigegeben.')
        return
      }
      if (!publicKey) return

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })
      try {
        await apiRequest<{ ok: boolean }>('/api/push/subscriptions', {
          method: 'POST',
          body: JSON.stringify(subscription.toJSON()),
        })
      } catch (error) {
        await subscription.unsubscribe()
        throw error
      }
      setEnabled(true)
      feedback.success('Das Gerät wurde für Push registriert. Automatische Push-Zustellung ist noch nicht implementiert.')
    } catch (error) {
      feedback.error(error instanceof ApiError || error instanceof Error ? error.message : 'Push konnte nicht geändert werden.')
    } finally {
      setBusy(false)
    }
  }

  if (!supported) return <p className="muted">Push wird auf diesem Gerät oder Browser nicht unterstützt.</p>

  return (
    <div className="settings-action-stack">
      <button className="button secondary" onClick={toggle} disabled={busy} aria-busy={busy || undefined}>
        <span>{busy ? 'Bitte warten…' : enabled ? 'Push deaktivieren' : 'Push aktivieren'}</span>
      </button>
    </div>
  )
}
