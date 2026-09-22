'use client'

import type { FormEvent, ReactNode } from 'react'
import { useDeviceEnvironment } from '@/components/providers/device-environment-provider'
import { AppSheet } from '@/components/ui/sheet-system'

type Presentation = 'bottom' | 'fullscreen' | 'dialog'

export function ResponsiveOverlay({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  onSubmit,
  mobile = 'bottom',
  desktop = 'dialog',
  panelClassName,
  showClose = true,
  showGrabber,
}: {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void
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
      subtitle={subtitle}
      onClose={onClose}
      footer={footer}
      onSubmit={onSubmit}
      panelClassName={panelClassName}
      showClose={showClose}
      showGrabber={showGrabber ?? mode === 'bottom'}
    >
      {children}
    </AppSheet>
  )
}
