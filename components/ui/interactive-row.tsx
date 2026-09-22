'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'

type InteractiveRowProps = {
  children: ReactNode
  className?: string
  href?: string
  onActivate?: () => void
  ariaLabel: string
}

export function InteractiveRow({ children, className = '', href, onActivate, ariaLabel }: InteractiveRowProps) {
  const classes = `interactive-row ${className}`.trim()

  if (href) {
    return (
      <Link className={classes} href={href} aria-label={ariaLabel}>
        {children}
      </Link>
    )
  }

  return (
    <button
      type="button"
      className={classes}
      aria-label={ariaLabel}
      onClick={onActivate}
      disabled={!onActivate}
    >
      {children}
    </button>
  )
}
