'use client'

import { Icon } from '@/components/ui/icon'

export function CloseButton({
  onClick,
  ariaLabel = 'Schliessen',
  className = '',
}: {
  onClick: () => void
  ariaLabel?: string
  className?: string
}) {
  return (
    <button
      type="button"
      className={`icon-button ui-close-button ${className}`.trim()}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <Icon name="close" size={18} />
    </button>
  )
}
