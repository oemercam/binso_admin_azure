'use client'

import { ActionFooter } from '@/components/ui/action-footer'
import { ResponsiveOverlay } from '@/components/ui/responsive-overlay'

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Abbrechen',
  destructive = false,
  onCancel,
  onConfirm,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  destructive?: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <ResponsiveOverlay
      open={open}
      title={title}
      description={description}
      onClose={onCancel}
      mobile="bottom"
      desktop="dialog"
      panelClassName="confirmation-overlay"
      footer={
        <ActionFooter>
          <button type="button" className="button secondary" onClick={onCancel}>{cancelLabel}</button>
          <button type="button" className={`button ${destructive ? 'destructive' : 'primary'}`} onClick={onConfirm}>{confirmLabel}</button>
        </ActionFooter>
      }
    >
      <></>
    </ResponsiveOverlay>
  )
}
