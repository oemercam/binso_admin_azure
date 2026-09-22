import Image from 'next/image'

export function AppLogo({ compact = false }: { compact?: boolean }) {
  const source = compact ? '/brand/icon-black.svg' : '/brand/logo-black.svg'
  return (
    <span className={compact ? 'binso-logo compact' : 'binso-logo'} aria-label="Binso" role="img">
      <Image
        className="binso-logo-image"
        src={source}
        alt=""
        aria-hidden="true"
        width={compact ? 36 : 1439}
        height={compact ? 20 : 365}
        priority
      />
    </span>
  )
}

/** Backwards-compatible name; AppLogo is the canonical identity component. */
export const BinsoLogo = AppLogo
