import { publicMetadata } from '@/lib/config/seo'
import { marketingFeatures } from '@/lib/config/marketing-content'
import { MarketingScreenshot } from '@/components/public/marketing-screenshot'
import { PublicCta, PublicPageIntro, PublicShell } from '@/components/public/public-shell'

export const metadata = publicMetadata({ title: 'Funktionen', description: 'Kunden, Angebote, Aufträge, Zeiterfassung und Rechnungen mit Binso One durchgängig verwalten.', path: '/features' })

const screenshotNames = new Set(['customers', 'quotes', 'orders', 'time', 'invoices'])

export default function FeaturesPage() {
  return (
    <PublicShell>
      <main className="public-main v78-subpage">
        <PublicPageIntro eyebrow="Funktionen" title="Die wichtigsten Abläufe. Ohne unnötige Umwege." description="Binso One verbindet die Arbeitsschritte, die im Alltag zusammengehören. Hier siehst du die Funktionen direkt in der echten Anwendung." />
        <section className="v78-feature-showcase v78-feature-showcase-page">
          {marketingFeatures.map((feature, index) => (
            <article className="v78-feature-row" key={feature.id}>
              <div className="v78-feature-copy"><span>{String(index + 1).padStart(2, '0')}</span><h2>{feature.title}</h2><p>{feature.description}</p><strong>{feature.benefit}</strong></div>
              {screenshotNames.has(feature.id) ? <div className="v78-feature-shot"><MarketingScreenshot name={feature.id as 'customers' | 'quotes' | 'orders' | 'time' | 'invoices'} /></div> : <div className="v78-feature-text-card"><span>Mitarbeitende</span><strong>Rollen passend zur Aufgabe.</strong><p>Zugriffe werden nicht über die Darstellung, sondern serverseitig über Rollen und Berechtigungen gesteuert.</p></div>}
            </article>
          ))}
        </section>
        <PublicCta />
      </main>
    </PublicShell>
  )
}
