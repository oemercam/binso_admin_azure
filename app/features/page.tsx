import { publicMetadata } from '@/lib/config/seo'
import { marketingFeatures } from '@/lib/config/marketing-content'
import { MarketingScreenshot } from '@/components/public/marketing-screenshot'
import { PublicCta, PublicPageIntro, PublicShell } from '@/components/public/public-shell'

export const metadata = publicMetadata({ title: 'Funktionen', description: 'Kunden, Angebote, Aufträge, Zeiterfassung und Rechnungen mit Binso One durchgängig verwalten.', path: '/features' })

const screenshotNames = new Set(['customers', 'quotes', 'orders', 'time', 'invoices'])

export default function FeaturesPage() {
  return (
    <PublicShell>
      <main className="v80-main v80-subpage">
        <PublicPageIntro eyebrow="Funktionen" title="Alles, was deinen Arbeitsablauf verbindet." description="Vom Kunden über Angebot und Auftrag bis zur Rechnung. Klar aufgebaut und ohne unnötig grosse Produktbilder." />
        <section className="v80-showcases v80-feature-page">
          {marketingFeatures.map((feature, index) => (
            <article className={`v80-split ${index % 2 ? 'is-reversed' : ''}`} key={feature.id}>
              <div className="v80-split-copy"><span>{String(index + 1).padStart(2, '0')}</span><h2>{feature.title}</h2><p>{feature.description}</p><strong>{feature.benefit}</strong></div>
              {screenshotNames.has(feature.id) ? <div className="v80-visual"><MarketingScreenshot name={feature.id as 'customers' | 'quotes' | 'orders' | 'time' | 'invoices'} desktopOnly /></div> : <div className="v80-simple-card"><span>Rollen</span><strong>Zugriff passend zur Aufgabe.</strong><p>Berechtigungen werden serverseitig und nachvollziehbar gesteuert.</p></div>}
            </article>
          ))}
        </section>
        <PublicCta />
      </main>
    </PublicShell>
  )
}
