export function BinsoLogo({ compact = false }: { compact?: boolean }) {
  const prefix = compact ? 'icon' : 'logo'

  return (
    <span
      className={compact ? 'binso-logo compact' : 'binso-logo'}
      aria-label="Binso"
      role="img"
    >
      {/* Light UI: black logo. Dark UI: white logo. */}
      <img
        className="binso-logo-light"
        src={`/brand/${prefix}-black.svg`}
        alt=""
        aria-hidden="true"
      />
      <img
        className="binso-logo-dark"
        src={`/brand/${prefix}-white.svg`}
        alt=""
        aria-hidden="true"
      />
    </span>
  )
}
