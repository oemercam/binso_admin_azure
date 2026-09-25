import { existsSync } from 'node:fs'
import { join } from 'node:path'

export type MarketingScreenshotName = 'dashboard' | 'customers' | 'quotes' | 'orders' | 'time' | 'invoices' | 'landing' | 'login'

const altByName: Record<MarketingScreenshotName, string> = {
  dashboard: 'Dashboard der echten Binso One Anwendung',
  customers: 'Kundenübersicht der echten Binso One Anwendung',
  quotes: 'Angebotsübersicht der echten Binso One Anwendung',
  orders: 'Auftragsübersicht der echten Binso One Anwendung',
  time: 'Zeiterfassung der echten Binso One Anwendung',
  invoices: 'Rechnungsübersicht der echten Binso One Anwendung',
  landing: 'Öffentliche Binso One Startseite',
  login: 'Binso One Anmeldeseite',
}

export function MarketingScreenshot({ name, priority = false, className = '', desktopOnly = false }: { name: MarketingScreenshotName; priority?: boolean; className?: string; desktopOnly?: boolean }) {
  const desktop = `/marketing/screenshots/${name}-desktop.png`
  const mobile = `/marketing/screenshots/${name}-mobile.png`
  const desktopExists = existsSync(join(process.cwd(), 'public', desktop))
  const mobileExists = existsSync(join(process.cwd(), 'public', mobile))
  if (!desktopExists) return null
  return (
    <picture className={`marketing-real-screenshot ${className}`.trim()}>
      {!desktopOnly && mobileExists ? <source media="(max-width: 720px)" srcSet={mobile} /> : null}
      <img src={desktop} alt={altByName[name]} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} />
    </picture>
  )
}

export function MarketingDashboardScreenshot() { return <MarketingScreenshot name="dashboard" /> }
