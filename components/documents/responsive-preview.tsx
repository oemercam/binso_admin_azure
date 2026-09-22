'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CloseButton } from '@/components/ui/close-button'

export function ResponsivePreview({
  open,
  title,
  subtitle,
  onClose,
  headerActions,
  warning,
  children,
  actions,
}: {
  open: boolean
  title: ReactNode
  subtitle?: ReactNode
  onClose: () => void
  headerActions?: ReactNode
  warning?: ReactNode
  children: ReactNode
  actions?: ReactNode
}) {
  const shellRef = useRef<HTMLDivElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    const body = document.body
    const previousOverflow = body.style.overflow
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    body.style.overflow = 'hidden'

    const frame = requestAnimationFrame(() => shellRef.current?.focus({ preventScroll: true }))
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('keydown', onKeyDown)
      body.style.overflow = previousOverflow
      returnFocusRef.current?.focus({ preventScroll: true })
    }
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="overlay-layer document-overlay" role="presentation" onMouseDown={onClose}>
      <div
        ref={shellRef}
        className="document-preview-shell"
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : 'Dokumentvorschau'}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="preview-toolbar">
          <div><strong>{title}</strong>{subtitle ? <span>{subtitle}</span> : null}</div>
          <div>{headerActions}<CloseButton onClick={onClose} /></div>
        </div>
        {warning}
        {children}
        {actions ? <div className="preview-actions">{actions}</div> : null}
      </div>
    </div>,
    document.body,
  )
}
