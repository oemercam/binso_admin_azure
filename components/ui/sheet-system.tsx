'use client'

import type { FormEvent, ReactNode } from 'react'
import { CloseButton } from '@/components/ui/close-button'

type SheetMode = 'bottom' | 'fullscreen' | 'dialog'

export function SheetGrabber() {
  return <div className="app-sheet-grabber sheet-grabber" aria-hidden="true" />
}

export function SheetHeader({
  title,
  subtitle,
  onClose,
  showClose = true,
}: {
  title: ReactNode
  subtitle?: ReactNode
  onClose?: () => void
  showClose?: boolean
}) {
  return (
    <header className="app-sheet-header sheet-heading">
      <div className="app-sheet-title">
        <strong>{title}</strong>
        {subtitle ? <span>{subtitle}</span> : null}
      </div>
      {showClose && onClose ? <CloseButton onClick={onClose} /> : null}
    </header>
  )
}

export function SheetFooter({ children }: { children: ReactNode }) {
  return <footer className="app-sheet-footer sheet-actions">{children}</footer>
}

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
  showClose,
  showGrabber,
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
  showClose?: boolean
  showGrabber?: boolean
}) {
  if (!open) return null

  const modeClass = mode === 'fullscreen'
    ? 'app-sheet app-sheet-fullscreen'
    : mode === 'dialog'
      ? 'app-sheet app-sheet-dialog'
      : 'app-sheet app-sheet-bottom'

  const content = (
    <>
      {(showGrabber ?? mode === 'bottom') ? <SheetGrabber /> : null}
      <SheetHeader title={title} subtitle={subtitle} onClose={onClose} showClose={showClose ?? mode !== 'bottom'} />
      <div className="app-sheet-content">{children}</div>
      {footer ? <SheetFooter>{footer}</SheetFooter> : null}
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
