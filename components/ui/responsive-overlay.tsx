'use client'

import type { ReactNode } from 'react'
import { useDeviceEnvironment } from '@/components/providers/device-environment-provider'
import { AppSheet } from '@/components/ui/sheet-system'

type Presentation = 'bottom' | 'fullscreen' | 'dialog'

export function ResponsiveOverlay({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  mobile = 'bottom',
  desktop = 'dialog',
  panelClassName,
  showClose = true,
  showGrabber,
}: {
  open: boolean
  title: ReactNode
  description?: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  mobile?: Presentation
  desktop?: Presentation
  panelClassName?: string
  showClose?: boolean
  showGrabber?: boolean
}) {
  const { isMobileLayout } = useDeviceEnvironment()
  const mode = isMobileLayout ? mobile : desktop

  return (
    <AppSheet
      open={open}
      mode={mode}
      title={title}
      description={description}
      onClose={onClose}
      footer={footer}
      panelClassName={panelClassName}
      showClose={showClose}
      showGrabber={showGrabber ?? mode === 'bottom'}
    >
      {children}
    </AppSheet>
  )
}
