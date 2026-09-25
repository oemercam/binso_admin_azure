import { publicMetadata } from '@/lib/config/seo'
import { marketingFlow } from '@/lib/config/marketing-content'
import { MarketingScreenshot } from '@/components/public/marketing-screenshot'
import { PublicCta, PublicPageIntro, PublicShell } from '@/components/public/public-shell'

export const metadata = publicMetadata({ title: 'So funktioniert Binso One', description: 'Vom Kunden über Angebot und Auftrag bis zu Zeiterfassung, Rechnung und Zahlung.', path: '/how-it-works' })

const visuals = ['customers', 'quotes', 'orders', 'time', 'invoices', 'dashboard'] as const

export default function HowItWorksPage() {
  return (
    <PublicShell>
      <main className="public-main v78-subpage">
        <PublicPageIntro eyebrow="Ablauf" title="Vom Kunden bis zur Rechnung in einem durchgängigen Prozess." description="Jeder Schritt verwendet bereits vorhandene Informationen weiter. So bleibt der Ablauf verständlich und doppelte Erfassung wird reduziert." />
        <section className="v78-process-showcase">
          {marketingFlow.map(([number, title, description], index) => <article key={number}><div className="v78-process-copy"><b>{number}</b><h2>{title}</h2><p>{description}</p></div><div className="v78-process-shot"><MarketingScreenshot name={visuals[index]} /></div></article>)}
        </section>
        <PublicCta />
      </main>
    </PublicShell>
  )
}
