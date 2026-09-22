'use client'

import type { FormEvent, ReactNode } from 'react'
import { useEffect } from 'react'
import { CloseButton } from '@/components/ui/close-button'

export type SheetMode = 'bottom' | 'fullscreen' | 'dialog'

export function SheetGrabber() {
  return <div className="app-sheet-grabber" aria-hidden="true" />
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
    <header className="app-sheet-header">
      <div className="app-sheet-title">
        <strong>{title}</strong>
        {subtitle ? <span>{subtitle}</span> : null}
      </div>
      {showClose && onClose ? <CloseButton onClick={onClose} /> : null}
    </header>
  )
}

export function SheetFooter({ children }: { children: ReactNode }) {
  return <footer className="app-sheet-footer">{children}</footer>
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
  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) return null

  const modeClass = `app-sheet app-sheet-${mode}`

  const content = (
    <>
      {(showGrabber ?? mode === 'bottom') ? <SheetGrabber /> : null}
      <SheetHeader
        title={title}
        subtitle={subtitle}
        onClose={onClose}
        showClose={showClose ?? true}
      />
      <div className="app-sheet-content">{children}</div>
      {footer ? <SheetFooter>{footer}</SheetFooter> : null}
    </>
  )

  const common = {
    className: modeClass,
    role: 'dialog',
    'aria-modal': true as const,
    'aria-label': ariaLabel ?? title,
    'data-sheet-mode': mode,
    onMouseDown: (event: React.MouseEvent) => event.stopPropagation(),
  }

  return (
    <div className="app-sheet-backdrop" data-sheet-mode={mode} role="presentation" onMouseDown={onClose}>
      {onSubmit ? (
        <form {...common} onSubmit={onSubmit}>
          {content}
        </form>
      ) : (
        <section {...common}>
          {content}
        </section>
      )}
    </div>
  )
}

export function SheetActions({ children }: { children: ReactNode }) {
  return <div className="app-sheet-actions">{children}</div>
}
