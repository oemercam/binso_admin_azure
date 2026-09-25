'use client'

import type { ReactNode } from 'react'

export function ActionFooter({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={['action-footer', className].filter(Boolean).join(' ')}>{children}</div>
}

export const SheetFooterActions = ActionFooter
