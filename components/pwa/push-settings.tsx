'use client'

import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/http/api-client'
import { ApiError } from '@/lib/http/errors'
import { useFeedback } from '@/components/ui/feedback'

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - base64.length % 4) % 4)
  const value = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0))
}

export function PushSettings() {
  const [supported, setSupported] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [serverConfigured, setServerConfigured] = useState<boolean | null>(null)
  const feedback = useFeedback()
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

  useEffect(() => {
    const isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) setSupported(isSupported)
    })
    if (!isSupported) return () => { cancelled = true }

    Promise.all([
      navigator.serviceWorker.ready.then((registration) => registration.pushManager.getSubscription()),
      apiRequest<{ configured: boolean }>('/api/push/subscriptions').catch(() => ({ configured: false })),
    ])
      .then(([subscription, server]) => {
        if (cancelled) return
        setEnabled(Boolean(subscription))
        setServerConfigured(server.configured)
      })
      .catch(() => {
        if (!cancelled) feedback.warning('Push-Status konnte nicht gelesen werden.')
      })
    return () => { cancelled = true }
  }, [feedback])

  async function toggle() {
    if (!enabled && (!publicKey || serverConfigured !== true)) {
      feedback.warning('Push ist vorbereitet, aber serverseitig noch nicht vollständig konfiguriert.')
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
      feedback.success('Push wurde auf diesem Gerät aktiviert.')
    } catch (error) {
      feedback.error(error instanceof ApiError || error instanceof Error ? error.message : 'Push konnte nicht geändert werden.')
    } finally {
      setBusy(false)
    }
  }

  if (!supported) return <p className="muted">Push wird auf diesem Gerät oder Browser nicht unterstützt.</p>

  const canEnable = Boolean(publicKey) && serverConfigured === true

  return (
    <div className="settings-action-stack">
      {!enabled && serverConfigured === false ? (
        <p className="muted">Push ist vorbereitet, aber serverseitig noch nicht aktiviert.</p>
      ) : null}
      <button className="button secondary" onClick={toggle} disabled={busy || (!enabled && !canEnable)} aria-busy={busy || undefined}>
        <span>{busy ? 'Bitte warten…' : enabled ? 'Push deaktivieren' : 'Push aktivieren'}</span>
      </button>
    </div>
  )
}
