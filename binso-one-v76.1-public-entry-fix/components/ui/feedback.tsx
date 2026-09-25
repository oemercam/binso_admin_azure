'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { Icon } from '@/components/ui/icon'
import { CloseButton } from '@/components/ui/close-button'

type FeedbackKind = 'success' | 'info' | 'warning' | 'error'

type FeedbackInput = {
  kind?: FeedbackKind
  message: string
  title?: string
  duration?: number
}

type FeedbackItem = Required<Pick<FeedbackInput, 'kind' | 'message'>> & Pick<FeedbackInput, 'title'> & {
  id: number
}

type FeedbackApi = {
  notify: (input: FeedbackInput) => void
  success: (message: string, title?: string) => void
  info: (message: string, title?: string) => void
  warning: (message: string, title?: string) => void
  error: (message: string, title?: string) => void
}

const FeedbackContext = createContext<FeedbackApi | null>(null)

const durationByKind: Record<FeedbackKind, number> = {
  success: 2600,
  info: 3200,
  warning: 4800,
  error: 6500,
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<FeedbackItem[]>([])
  const idRef = useRef(0)

  const notify = useCallback((input: FeedbackInput) => {
    const kind = input.kind ?? 'info'
    const id = ++idRef.current
    const item: FeedbackItem = { id, kind, message: input.message, title: input.title }
    setItems((current) => [...current, item].slice(-4))
    const duration = input.duration ?? durationByKind[kind]
    window.setTimeout(() => {
      setItems((current) => current.filter((entry) => entry.id !== id))
    }, duration)
  }, [])

  const value = useMemo<FeedbackApi>(() => ({
    notify,
    success: (message, title) => notify({ kind: 'success', message, title }),
    info: (message, title) => notify({ kind: 'info', message, title }),
    warning: (message, title) => notify({ kind: 'warning', message, title }),
    error: (message, title) => notify({ kind: 'error', message, title }),
  }), [notify])

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-relevant="additions text">
        {items.map((item) => <Toast key={item.id} item={item} onClose={() => setItems((current) => current.filter((entry) => entry.id !== item.id))} />)}
      </div>
    </FeedbackContext.Provider>
  )
}

function Toast({ item, onClose }: { item: FeedbackItem; onClose: () => void }) {
  const icon = item.kind === 'success' ? 'check' : item.kind === 'error' || item.kind === 'warning' ? 'warning' : 'bell'
  return (
    <div className={`toast toast-${item.kind}`} role={item.kind === 'error' ? 'alert' : 'status'}>
      <span className="toast-icon"><Icon name={icon} size={15} /></span>
      <span className="toast-copy">
        {item.title ? <strong>{item.title}</strong> : null}
        <span>{item.message}</span>
      </span>
      <CloseButton variant="compact" ariaLabel="Meldung schliessen" onClick={onClose} />
    </div>
  )
}

export function useFeedback() {
  const value = useContext(FeedbackContext)
  if (!value) throw new Error('useFeedback must be used inside FeedbackProvider')
  return value
}
