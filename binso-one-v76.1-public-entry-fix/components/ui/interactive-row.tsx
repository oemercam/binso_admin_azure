'use client'

import type { KeyboardEvent, ReactNode } from 'react'
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

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!onActivate) return
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onActivate()
  }

  return (
    <div
      className={classes}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={onActivate}
      onKeyDown={onKeyDown}
    >
      {children}
    </div>
  )
}
