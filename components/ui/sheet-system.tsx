'use client'

import { useEffect, useId, useRef, type FormEvent, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CloseButton } from '@/components/ui/close-button'

type SheetMode = 'bottom' | 'fullscreen' | 'dialog'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function SheetGrabber() {
  return <div className="app-sheet-grabber sheet-grabber" aria-hidden="true" />
}

export function SheetHeader({
  title,
  subtitle,
  onClose,
  showClose = true,
  titleId,
}: {
  title: ReactNode
  subtitle?: ReactNode
  onClose?: () => void
  showClose?: boolean
  titleId?: string
}) {
  return (
    <header className="app-sheet-header sheet-heading">
      <div className="app-sheet-title">
        <strong id={titleId}>{title}</strong>
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
  panelClassName,
  rawContent = false,
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
  panelClassName?: string
  rawContent?: boolean
}) {
  const titleId = useId()
  const panelRef = useRef<HTMLElement | null>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return

    const body = document.body
    const html = document.documentElement
    const previousBodyOverflow = body.style.overflow
    const previousBodyOverscroll = body.style.overscrollBehavior
    const previousHtmlOverflow = html.style.overflow
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null

    body.style.overflow = 'hidden'
    body.style.overscrollBehavior = 'none'
    html.style.overflow = 'hidden'

    const focusPanel = window.requestAnimationFrame(() => {
      const panel = panelRef.current
      if (!panel) return
      const first = panel.querySelector<HTMLElement>(FOCUSABLE)
      ;(first ?? panel).focus({ preventScroll: true })
    })

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return
      const focusable = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((node) => !node.hasAttribute('hidden'))
      if (!focusable.length) {
        event.preventDefault()
        panel.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.cancelAnimationFrame(focusPanel)
      body.style.overflow = previousBodyOverflow
      body.style.overscrollBehavior = previousBodyOverscroll
      html.style.overflow = previousHtmlOverflow
      window.removeEventListener('keydown', onKeyDown)
      returnFocusRef.current?.focus({ preventScroll: true })
    }
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  const modeClass = mode === 'fullscreen'
    ? 'app-sheet app-sheet-fullscreen'
    : mode === 'dialog'
      ? 'app-sheet app-sheet-dialog'
      : 'app-sheet app-sheet-bottom'

  const panelClass = [modeClass, panelClassName].filter(Boolean).join(' ')

  const content = rawContent ? children : (
    <>
      {(showGrabber ?? mode === 'bottom') ? <SheetGrabber /> : null}
      <SheetHeader title={title} subtitle={subtitle} onClose={onClose} showClose={showClose ?? mode !== 'bottom'} titleId={titleId} />
      <div className="app-sheet-content">{children}</div>
      {footer ? <SheetFooter>{footer}</SheetFooter> : null}
    </>
  )

  const common = {
    className: panelClass,
    role: 'dialog',
    'aria-modal': true,
    'aria-labelledby': ariaLabel ? undefined : titleId,
    'aria-label': ariaLabel,
    tabIndex: -1,
    onMouseDown: (event: ReactMouseEvent) => event.stopPropagation(),
  }

  const panel = onSubmit ? (
    <form ref={(node) => { panelRef.current = node }} {...common} onSubmit={onSubmit}>
      {content}
    </form>
  ) : (
    <section ref={(node) => { panelRef.current = node }} {...common}>
      {content}
    </section>
  )

  return createPortal(
    <div className="app-sheet-backdrop" role="presentation" onMouseDown={onClose}>
      {panel}
    </div>,
    document.body,
  )
}

export function SheetActions({ children }: { children: ReactNode }) {
  return <div className="app-sheet-actions">{children}</div>
}

export function StandardFormSheet({
  onClose,
  onSubmit,
  children,
  panelClassName = 'form-sheet bottom-sheet standard-mobile-sheet',
  ariaLabel = 'Formular',
}: {
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  children: ReactNode
  panelClassName?: string
  ariaLabel?: string
}) {
  const fullscreen = /(?:mobile-fullscreen-sheet|document-editor|policy-editor|invoice-builder-sheet)/.test(panelClassName)
  return (
    <AppSheet
      open
      mode={fullscreen ? 'fullscreen' : 'bottom'}
      title={ariaLabel}
      ariaLabel={ariaLabel}
      onClose={onClose}
      onSubmit={onSubmit}
      panelClassName={panelClassName}
      rawContent
      showClose={false}
      showGrabber={false}
    >
      {children}
    </AppSheet>
  )
}

