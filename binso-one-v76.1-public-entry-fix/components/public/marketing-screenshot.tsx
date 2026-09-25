import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { LandingProofVisual } from './product-visuals'

export function MarketingDashboardScreenshot() {
  const desktopPath = join(process.cwd(), 'public', 'marketing', 'screenshots', 'dashboard-desktop.png')
  const mobilePath = join(process.cwd(), 'public', 'marketing', 'screenshots', 'dashboard-mobile.png')
  if (!existsSync(desktopPath)) return <LandingProofVisual />

  return (
    <picture className="marketing-real-screenshot">
      {existsSync(mobilePath) ? <source media="(max-width: 720px)" srcSet="/marketing/screenshots/dashboard-mobile.png" /> : null}
      <img src="/marketing/screenshots/dashboard-desktop.png" alt="Binso One Dashboard in der echten Anwendung" loading="lazy" />
    </picture>
  )
}
