'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type NetworkState = 'online' | 'offline' | 'reconnecting'

type NetworkContextValue = {
  state: NetworkState
  online: boolean
}

const NetworkContext = createContext<NetworkContextValue>({ state: 'online', online: true })

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NetworkState>('online')

  useEffect(() => {
    let cancelled = false
    let reconnectTimer = 0
    queueMicrotask(() => {
      if (!cancelled) setState(navigator.onLine ? 'online' : 'offline')
    })

    const onOffline = () => setState('offline')
    const onOnline = () => {
      setState('reconnecting')
      window.clearTimeout(reconnectTimer)
      reconnectTimer = window.setTimeout(() => { if (!cancelled) setState('online') }, 800)
    }

    window.addEventListener('offline', onOffline)
    window.addEventListener('online', onOnline)
    return () => {
      cancelled = true
      window.clearTimeout(reconnectTimer)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('online', onOnline)
    }
  }, [])

  const value = useMemo(() => ({ state, online: state !== 'offline' }), [state])
  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
}

export function useNetwork() {
  return useContext(NetworkContext)
}
