import type { ReactNode } from 'react'
import { Icon } from '@/components/ui/icon'

export function ErrorState({
  title,
  description,
  actions,
  referenceId,
}: {
  title: string
  description: string
  actions?: ReactNode
  referenceId?: string
}) {
  return (
    <main className="app-error-screen" role="alert">
      <div className="app-error-symbol"><Icon name="warning" size={24} /></div>
      <h1>{title}</h1>
      <p>{description}</p>
      {referenceId ? <small className="error-reference">Referenz: {referenceId}</small> : null}
      {actions ? <div className="app-error-actions">{actions}</div> : null}
    </main>
  )
}
