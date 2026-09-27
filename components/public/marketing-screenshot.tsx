import { existsSync } from 'node:fs'
import { join } from 'node:path'

export type MarketingScreenshotName = 'dashboard' | 'customers' | 'quotes' | 'orders' | 'time' | 'invoices' | 'landing' | 'login'


const screenshotDimensions: Record<string, { width: number; height: number }> = {
  'dashboard-desktop.png': { width: 1178, height: 327 },
  'dashboard-mobile.png': { width: 1083, height: 192 },

  'customers-desktop.png': { width: 1178, height: 241 },
  'customers-mobile.png': { width: 1083, height: 519 },

  'quotes-desktop.png': { width: 1178, height: 173 },
  'quotes-mobile.png': { width: 1083, height: 345 },

  'orders-desktop.png': { width: 1178, height: 241 },
  'orders-mobile.png': { width: 1083, height: 519 },

  'time-desktop.png': { width: 1178, height: 420 },
  'time-mobile.png': { width: 1083, height: 1680 },

  'invoices-desktop.png': { width: 1178, height: 241 },
  'invoices-mobile.png': { width: 1083, height: 519 },

  'landing-desktop.png': { width: 1430, height: 520 },
  'landing-mobile.png': { width: 1179, height: 1602 },

  'login-desktop.png': { width: 330, height: 309 },
  'login-mobile.png': { width: 1083, height: 885 },
}

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
  const desktopFile = `${name}-desktop.png`
  const mobileFile = `${name}-mobile.png`
  const desktopSize = screenshotDimensions[desktopFile] ?? { width: 1440, height: 900 }
  const mobileSize = screenshotDimensions[mobileFile]
  if (!desktopExists) return null
  return (
    <picture className={`marketing-real-screenshot ${className}`.trim()}>
      {!desktopOnly && mobileExists && mobileSize ? <source media="(max-width: 720px)" srcSet={mobile} width={mobileSize.width} height={mobileSize.height} /> : null}
      <img src={desktop} alt={altByName[name]} width={desktopSize.width} height={desktopSize.height} loading={priority ? 'eager' : 'lazy'} decoding="async" fetchPriority={priority ? 'high' : 'auto'} />
    </picture>
  )
}

export function MarketingDashboardScreenshot() { return <MarketingScreenshot name="dashboard" /> }
