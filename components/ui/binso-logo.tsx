export function BinsoLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? 'binso-logo compact' : 'binso-logo'} aria-label="Binso">
      <span className="binso-logo-mark">B</span>
      {!compact && <span className="binso-logo-word">BINSO</span>}
    </span>
  )
}
