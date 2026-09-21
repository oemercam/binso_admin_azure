'use client'

import type { FormEvent, ReactNode } from 'react'
import { Icon } from '@/components/ui/icon'

type SheetMode = 'bottom' | 'fullscreen' | 'dialog'

export function AppSheet({
  open,
  mode = 'bottom',
  title,
  subtitle,
  onClose,
  children,
  footer,
  onSubmit,
  ariaLabel,
}: {
  open: boolean
  mode?: SheetMode
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void
  ariaLabel?: string
}) {
  if (!open) return null

  const modeClass = mode === 'fullscreen'
    ? 'app-sheet app-sheet-fullscreen'
    : mode === 'dialog'
      ? 'app-sheet app-sheet-dialog'
      : 'app-sheet app-sheet-bottom'

  const content = (
    <>
      {mode === 'bottom' && <div className="app-sheet-grabber" aria-hidden="true" />}
      <header className="app-sheet-header">
        <div className="app-sheet-title">
          <strong>{title}</strong>
          {subtitle && <span>{subtitle}</span>}
        </div>
        {mode !== 'bottom' && (
          <button type="button" className="icon-button app-sheet-close" onClick={onClose} aria-label="Schliessen">
            <Icon name="close" size={18} />
          </button>
        )}
      </header>
      <div className="app-sheet-content">{children}</div>
      {footer && <footer className="app-sheet-footer">{footer}</footer>}
    </>
  )

  return (
    <div className="app-sheet-backdrop" role="presentation" onMouseDown={onClose}>
      {onSubmit ? (
        <form
          className={modeClass}
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel ?? title}
          onSubmit={onSubmit}
          onMouseDown={(event) => event.stopPropagation()}
        >
          {content}
        </form>
      ) : (
        <section
          className={modeClass}
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel ?? title}
          onMouseDown={(event) => event.stopPropagation()}
        >
          {content}
        </section>
      )}
    </div>
  )
}

export function SheetActions({ children }: { children: ReactNode }) {
  return <div className="app-sheet-actions">{children}</div>
}
