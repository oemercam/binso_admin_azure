import { publicMetadata } from '@/lib/config/seo'
import { marketingFlow } from '@/lib/config/marketing-content'
import { MarketingScreenshot } from '@/components/public/marketing-screenshot'
import { PublicCta, PublicPageIntro, PublicShell } from '@/components/public/public-shell'

export const metadata = publicMetadata({ title: 'So funktioniert Binso One', description: 'Vom Kunden über Angebot und Auftrag bis zu Zeiterfassung, Rechnung und Zahlung.', path: '/how-it-works' })
const screens = ['customers','quotes','orders','time','invoices'] as const

export default function HowItWorksPage() {
  return (
    <PublicShell>
      <main className="v80-main v812-page">
        <PublicPageIntro eyebrow="Ablauf" title="Vom Kunden bis zur Rechnung." description="Ein klarer Ablauf, bei dem Informationen nur einmal erfasst und im nächsten Schritt weiterverwendet werden." />
        <section className="v812-showcases">
          {marketingFlow.slice(0,5).map(([number,title,description], index) => (
            <article className={`v812-split ${index % 2 ? 'is-reversed' : ''}`} key={number}>
              <div className="v812-copy"><span className="v80-eyebrow">{number}</span><h2>{title}</h2><p>{description}</p><strong>Ein Schritt. Klar im Prozess.</strong></div>
              <div className="v812-visual"><MarketingScreenshot name={screens[index]} desktopOnly /></div>
            </article>
          ))}
        </section>
        <PublicCta />
      </main>
    </PublicShell>
  )
}
