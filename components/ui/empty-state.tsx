import type { ReactNode } from 'react'

export function EmptyState({ title, description, action }: { title?: string; description: string; action?: ReactNode }) {
  return (
    <div className="empty-state" role="status">
      {title ? <strong>{title}</strong> : null}
      <span>{description}</span>
      {action ? <div>{action}</div> : null}
    </div>
  )
}
