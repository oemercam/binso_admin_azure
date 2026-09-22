export function AppLogo({ compact = false }: { compact?: boolean }) {
  const source = compact ? '/brand/icon-black.svg' : '/brand/logo-black.svg'
  return (
    <span className={compact ? 'binso-logo compact' : 'binso-logo'} aria-label="Binso" role="img">
      <img className="binso-logo-image" src={source} alt="" aria-hidden="true" />
    </span>
  )
}

/** Backwards-compatible name; AppLogo is the canonical identity component. */
export const BinsoLogo = AppLogo
