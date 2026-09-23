'use client'

import { useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CloseButton } from '@/components/ui/close-button'
import { useModalOverlay } from '@/components/ui/overlay-manager'

export function ResponsivePreview({
  open,
  title,
  subtitle,
  onClose,
  headerActions,
  warning,
  children,
  actions,
  mobileActions,
  mobileMoreActions,
}: {
  open: boolean
  title: ReactNode
  subtitle?: ReactNode
  onClose: () => void
  headerActions?: ReactNode
  warning?: ReactNode
  children: ReactNode
  actions?: ReactNode
  mobileActions?: ReactNode
  mobileMoreActions?: ReactNode
}) {
  const shellRef = useRef<HTMLDivElement>(null)
  useModalOverlay({ open, onClose, containerRef: shellRef })

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="document-overlay" role="presentation" onMouseDown={onClose}>
      <div
        ref={shellRef}
        className={`document-preview-shell${actions ? " has-desktop-actions" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : 'Dokumentvorschau'}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="preview-toolbar">
          <div><strong>{title}</strong>{subtitle ? <span>{subtitle}</span> : null}</div>
          <div>{headerActions}<CloseButton onClick={onClose} /></div>
        </header>
        <div className="document-preview-content">
          {warning}
          {children}
        </div>
        {actions ? <footer className="preview-actions preview-actions-desktop">{actions}</footer> : null}
        {(mobileActions || mobileMoreActions || actions) ? (
          <footer className="preview-actions-mobile">
            <div className="preview-mobile-primary">{mobileActions ?? actions}</div>
            {mobileMoreActions ? (
              <details className="preview-more-menu">
                <summary className="button secondary">Mehr</summary>
                <div className="preview-more-panel">{mobileMoreActions}</div>
              </details>
            ) : null}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}
