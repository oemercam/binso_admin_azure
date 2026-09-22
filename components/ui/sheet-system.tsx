'use client'

import { useId, useRef, type FormEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useDeviceEnvironment } from '@/components/providers/device-environment-provider'
import { CloseButton } from '@/components/ui/close-button'
import { useModalOverlay } from '@/components/ui/overlay-manager'

type SheetMode = 'bottom' | 'fullscreen' | 'dialog'
type StandardSheetMode = SheetMode | 'auto'

export function SheetGrabber() {
  return <div className="app-sheet-grabber" aria-hidden="true" />
}

export function SheetHeader({
  title,
  description,
  onClose,
  showClose = true,
  titleId,
  descriptionId,
}: {
  title: ReactNode
  description?: ReactNode
  onClose?: () => void
  showClose?: boolean
  titleId?: string
  descriptionId?: string
}) {
  return (
    <header className="app-sheet-header">
      <div className="app-sheet-title">
        <strong id={titleId}>{title}</strong>
        {description ? <span id={descriptionId}>{description}</span> : null}
      </div>
      {showClose && onClose ? <CloseButton onClick={onClose} /> : null}
    </header>
  )
}

export function SheetFooter({ children }: { children: ReactNode }) {
  return <footer className="app-sheet-footer">{children}</footer>
}

export function SheetActions({ children }: { children: ReactNode }) {
  return <div className="app-sheet-actions">{children}</div>
}

export function AppSheet({
  open,
  mode = 'bottom',
  title,
  description,
  onClose,
  children,
  footer,
  ariaLabel,
  showClose = true,
  showGrabber,
  panelClassName,
}: {
  open: boolean
  mode?: SheetMode
  title: ReactNode
  description?: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  ariaLabel?: string
  showClose?: boolean
  showGrabber?: boolean
  panelClassName?: string
}) {
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef<HTMLElement | null>(null)

  useModalOverlay({ open, onClose, containerRef: panelRef })

  if (!open || typeof document === 'undefined') return null

  const modeClass = mode === 'fullscreen'
    ? 'app-sheet app-sheet-fullscreen'
    : mode === 'dialog'
      ? 'app-sheet app-sheet-dialog'
      : 'app-sheet app-sheet-bottom'

  const panelClass = [modeClass, panelClassName].filter(Boolean).join(' ')

  return createPortal(
    <div className="app-sheet-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        ref={(node) => { panelRef.current = node }}
        className={panelClass}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabel ? undefined : titleId}
        aria-describedby={description && !ariaLabel ? descriptionId : undefined}
        aria-label={ariaLabel}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {(showGrabber ?? mode === 'bottom') ? <SheetGrabber /> : null}
        <SheetHeader
          title={title}
          description={description}
          onClose={onClose}
          showClose={showClose}
          titleId={titleId}
          descriptionId={descriptionId}
        />
        <div className="app-sheet-content">{children}</div>
        {footer ? <SheetFooter>{footer}</SheetFooter> : null}
      </section>
    </div>,
    document.body,
  )
}

export function StandardFormSheet({
  open,
  title,
  description,
  onClose,
  onSubmit,
  children,
  footer,
  mode = 'auto',
  loading = false,
  formId,
  panelClassName,
}: {
  open: boolean
  title: ReactNode
  description?: ReactNode
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  children: ReactNode
  footer: ReactNode
  mode?: StandardSheetMode
  loading?: boolean
  formId?: string
  panelClassName?: string
}) {
  const generatedId = useId()
  const { isMobileLayout } = useDeviceEnvironment()
  const resolvedFormId = formId ?? `sheet-form-${generatedId.replace(/:/g, '')}`
  const resolvedMode: SheetMode = mode === 'auto' ? (isMobileLayout ? 'bottom' : 'dialog') : mode

  return (
    <AppSheet
      open={open}
      mode={resolvedMode}
      title={title}
      description={description}
      onClose={onClose}
      panelClassName={panelClassName}
      footer={<div className="app-sheet-actions" aria-busy={loading || undefined}>{footer}</div>}
    >
      <form id={resolvedFormId} className="app-sheet-form" onSubmit={onSubmit} aria-busy={loading || undefined}>
        {children}
      </form>
    </AppSheet>
  )
}
