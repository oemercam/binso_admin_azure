import type { ReactNode } from 'react'
import { statusPresentation } from '@/lib/status/presentation'

export { statusPresentation } from '@/lib/status/presentation'

export function StatusBadge({ status, label, className = '', children }: { status: string; label?: string; className?: string; children?: ReactNode }) {
  const presentation = statusPresentation(status)
  return <span className={`status status-${presentation.tone} ${className}`.trim()}>{children ?? label ?? presentation.label}</span>
}
