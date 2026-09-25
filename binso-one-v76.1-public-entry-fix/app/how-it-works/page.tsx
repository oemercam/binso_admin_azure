import { publicMetadata } from '@/lib/config/seo'
import { marketingFlow } from '@/lib/config/marketing-content'
import { PublicCta, PublicPageIntro, PublicShell } from '@/components/public/public-shell'

export const metadata = publicMetadata({ title: 'So funktioniert Binso One', description: 'Vom Kunden über Angebot und Auftrag bis zu Zeiterfassung, Rechnung und Zahlung.', path: '/how-it-works' })

export default function HowItWorksPage() {
  return (
    <PublicShell>
      <main className="public-main">
        <PublicPageIntro eyebrow="So funktioniert es" title="Ein klarer Ablauf vom Kunden bis zur Zahlung." description="Jeder Schritt baut auf den bereits erfassten Informationen auf. So bleibt der Prozess verständlich und doppelte Erfassung wird reduziert." />
        <section className="public-process-list">
          {marketingFlow.map(([number, title, description]) => <article key={number}><b>{number}</b><div><h2>{title}</h2><p>{description}</p></div></article>)}
        </section>
        <PublicCta />
      </main>
    </PublicShell>
  )
}
