export function BinsoLogo({ compact = false }: { compact?: boolean }) {
  const prefix = compact ? 'icon' : 'logo'

  return (
    <span
      className={compact ? 'binso-logo compact' : 'binso-logo'}
      aria-label="Binso"
      role="img"
    >
      <img
        className="binso-logo-light"
        src={`/brand/${prefix}-white.svg`}
        alt=""
        aria-hidden="true"
      />
      <img
        className="binso-logo-dark"
        src={`/brand/${prefix}-black.svg`}
        alt=""
        aria-hidden="true"
      />
    </span>
  )
}
