'use client'
import { useEffect, useState } from 'react'

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - base64.length % 4) % 4)
  const value = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(value), c => c.charCodeAt(0))
}

export function PushSettings() {
  const [supported, setSupported] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setSupported('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window)
    navigator.serviceWorker?.ready.then(r => r.pushManager.getSubscription()).then(s => setEnabled(Boolean(s))).catch(() => undefined)
  }, [])

  async function toggle() {
    setBusy(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const current = await registration.pushManager.getSubscription()
      if (current) {
        await fetch('/api/push/subscriptions', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify(current.toJSON()) })
        await current.unsubscribe()
        setEnabled(false)
        return
      }
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!key) throw new Error('VAPID key missing')
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) })
      await fetch('/api/push/subscriptions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(subscription.toJSON()) })
      setEnabled(true)
    } finally { setBusy(false) }
  }

  if (!supported) return <p className="muted">Push wird auf diesem Gerät oder Browser nicht unterstützt.</p>
  return <button className="button secondary" onClick={toggle} disabled={busy}>{busy ? 'Bitte warten…' : enabled ? 'Push deaktivieren' : 'Push aktivieren'}</button>
}
