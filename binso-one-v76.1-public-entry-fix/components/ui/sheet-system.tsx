'use client'

import { Children, Fragment, cloneElement, isValidElement, useEffect, useId, useRef, useState, type FormEvent, type ReactElement, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useDeviceEnvironment } from '@/components/providers/device-environment-provider'
import { CloseButton } from '@/components/ui/close-button'
import { useModalOverlay } from '@/components/ui/overlay-manager'
import { ActionFooter } from '@/components/ui/action-footer'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

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
  return <ActionFooter className="app-sheet-actions">{children}</ActionFooter>
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
  confirmDiscard = true,
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
  confirmDiscard?: boolean
}) {
  const generatedId = useId()
  const { isMobileLayout } = useDeviceEnvironment()
  const [dirty, setDirty] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)
  const resolvedFormId = formId ?? `sheet-form-${generatedId.replace(/:/g, '')}`
  const responsiveFullscreen = mode === 'fullscreen'
  const resolvedMode: SheetMode = mode === 'auto'
    ? (isMobileLayout ? 'bottom' : 'dialog')
    : responsiveFullscreen
      ? (isMobileLayout ? 'fullscreen' : 'dialog')
      : mode
  const resolvedPanelClassName = [
    panelClassName,
    responsiveFullscreen && !isMobileLayout ? 'app-sheet-desktop-wide' : '',
  ].filter(Boolean).join(' ')

  useEffect(() => {
    if (!open) return
    const reset = window.setTimeout(() => setDirty(false), 0)
    return () => window.clearTimeout(reset)
  }, [open])

  function requestClose() {
    if (confirmDiscard && dirty && !loading) {
      setDiscardOpen(true)
      return
    }
    onClose()
  }

  function isCancelButton(node: ReactElement<{ children?: ReactNode; type?: string }>) {
    if (node.props.type !== 'button') return false
    const label = flattenText(node.props.children).toLowerCase()
    return label.includes('abbrechen') || label.includes('schliessen')
  }

  function normalizeFooter(node: ReactNode): ReactNode {
    return Children.map(node, (child) => {
      if (!isValidElement(child)) return child
      if (child.type === Fragment) return cloneElement(child, {}, normalizeFooter((child.props as { children?: ReactNode }).children))
      const typed = child as ReactElement<{ children?: ReactNode; type?: string; onClick?: () => void }>
      if (typeof child.type === 'string' && child.type === 'button' && isCancelButton(typed)) {
        return cloneElement(typed, { onClick: requestClose })
      }
      return child
    })
  }

  return (
    <>
      <AppSheet
        open={open}
        mode={resolvedMode}
        title={title}
        description={description}
        onClose={requestClose}
        panelClassName={resolvedPanelClassName}
        footer={<div aria-busy={loading || undefined}><SheetActions>{normalizeFooter(footer)}</SheetActions></div>}
      >
        <form
          id={resolvedFormId}
          className="app-sheet-form"
          onSubmit={onSubmit}
          onInput={() => setDirty(true)}
          onChange={() => setDirty(true)}
          aria-busy={loading || undefined}
        >
          {children}
        </form>
      </AppSheet>

      <ConfirmationDialog
        open={discardOpen}
        title="Änderungen verwerfen?"
        description="Deine nicht gespeicherten Änderungen gehen verloren."
        cancelLabel="Weiter bearbeiten"
        confirmLabel="Verwerfen"
        destructive
        onCancel={() => setDiscardOpen(false)}
        onConfirm={() => {
          setDiscardOpen(false)
          setDirty(false)
          onClose()
        }}
      />
    </>
  )
}

function flattenText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(flattenText).join(' ')
  if (isValidElement(node)) return flattenText((node.props as { children?: ReactNode }).children)
  return ''
}
