'use client'

import { useNetwork } from '@/components/providers/network-provider'

export function NetworkStatus() {
  const { state } = useNetwork()
  if (state === 'online') return null

  return (
    <div className="network-status" role="status" aria-live="polite">
      {state === 'offline' ? 'Offline – einige Funktionen sind nicht verfügbar.' : 'Verbindung wird wiederhergestellt…'}
    </div>
  )
}
