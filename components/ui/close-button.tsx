'use client'

import { Icon } from '@/components/ui/icon'

type ControlProps = {
  onClick: () => void
  ariaLabel?: string
  className?: string
  disabled?: boolean
}

export function CloseButton({
  onClick,
  ariaLabel = 'Schliessen',
  className = '',
  variant = 'default',
}: ControlProps & { variant?: 'default' | 'compact' }) {
  return (
    <button
      type="button"
      className={`ui-overlay-control ui-close-button ui-overlay-control-${variant} ${className}`.trim()}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <Icon name="close" size={variant === 'compact' ? 15 : 17} />
    </button>
  )
}

export function BackButton({ onClick, ariaLabel = 'Zurück', className = '', disabled = false }: ControlProps) {
  return (
    <button
      type="button"
      className={`ui-overlay-control ui-back-button ${className}`.trim()}
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
    >
      <Icon name="back" size={17} />
    </button>
  )
}

export function RemoveButton({ onClick, ariaLabel = 'Entfernen', className = '', disabled = false }: ControlProps) {
  return (
    <button
      type="button"
      className={`ui-remove-button ${className}`.trim()}
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
    >
      <Icon name="remove" size={15} />
    </button>
  )
}
