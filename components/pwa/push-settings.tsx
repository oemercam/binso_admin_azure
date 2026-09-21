'use client'

import { useEffect, useState } from 'react'

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - base64.length % 4) % 4)
  const value = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0))
}

export function PushSettings() {
  const [supported, setSupported] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

  useEffect(() => {
    const isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    setSupported(isSupported)
    if (!isSupported) return
    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => setEnabled(Boolean(subscription)))
      .catch(() => setMessage('Push-Status konnte nicht gelesen werden.'))
  }, [])

  async function toggle() {
    if (!publicKey && !enabled) {
      setMessage('Push ist vorbereitet, aber noch nicht produktiv konfiguriert. Es fehlt NEXT_PUBLIC_VAPID_PUBLIC_KEY.')
      return
    }

    setBusy(true)
    setMessage('')
    try {
      const registration = await navigator.serviceWorker.ready
      const current = await registration.pushManager.getSubscription()
      if (current) {
        const response = await fetch('/api/push/subscriptions', {
          method: 'DELETE',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(current.toJSON()),
        })
        if (!response.ok) throw new Error('Push-Abonnement konnte serverseitig nicht entfernt werden.')
        await current.unsubscribe()
        setEnabled(false)
        setMessage('Push wurde auf diesem Gerät deaktiviert.')
        return
      }

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setMessage('Benachrichtigungen wurden nicht freigegeben.')
        return
      }
      if (!publicKey) return

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })
      const response = await fetch('/api/push/subscriptions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      })
      if (!response.ok) {
        await subscription.unsubscribe()
        throw new Error('Push-Abonnement konnte serverseitig nicht gespeichert werden.')
      }
      setEnabled(true)
      setMessage('Push wurde auf diesem Gerät aktiviert. Die serverseitige Zustellung bleibt bis zur Datenbank-/Worker-Anbindung im Demo-Modus.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Push konnte nicht geändert werden.')
    } finally {
      setBusy(false)
    }
  }

  if (!supported) return <p className="muted">Push wird auf diesem Gerät oder Browser nicht unterstützt.</p>

  return (
    <div className="settings-action-stack">
      <button className="button secondary" onClick={toggle} disabled={busy}>
        {busy ? 'Bitte warten…' : enabled ? 'Push deaktivieren' : 'Push aktivieren'}
      </button>
      {message && <p className="settings-action-hint">{message}</p>}
    </div>
  )
}
