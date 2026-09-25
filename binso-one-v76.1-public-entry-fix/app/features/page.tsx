import { publicMetadata } from '@/lib/config/seo'
import { marketingFeatures } from '@/lib/config/marketing-content'
import { PublicCta, PublicPageIntro, PublicShell } from '@/components/public/public-shell'

export const metadata = publicMetadata({ title: 'Funktionen', description: 'Kunden, Angebote, Aufträge, Zeiterfassung und Rechnungen mit Binso One durchgängig verwalten.', path: '/features' })

export default function FeaturesPage() {
  return (
    <PublicShell>
      <main className="public-main">
        <PublicPageIntro eyebrow="Funktionen" title="Die wichtigsten Abläufe in einer Anwendung." description="Binso One verbindet die Arbeitsschritte, die im Alltag zusammengehören. Daten werden dort weiterverwendet, wo sie bereits vorhanden sind." />
        <section className="public-feature-detail-grid">
          {marketingFeatures.map((feature, index) => <article key={feature.id}><span>{String(index + 1).padStart(2, '0')}</span><h2>{feature.title}</h2><p>{feature.description}</p><strong className="public-feature-benefit">{feature.benefit}</strong></article>)}
        </section>
        <PublicCta />
      </main>
    </PublicShell>
  )
}
