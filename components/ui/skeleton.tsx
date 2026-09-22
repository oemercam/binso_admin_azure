import type { CSSProperties } from 'react'

export function Skeleton({ className = '', width, height = 14 }: { className?: string; width?: CSSProperties['width']; height?: CSSProperties['height'] }) {
  return <span className={`ui-skeleton ${className}`.trim()} aria-hidden="true" style={{ width, height }} />
}
