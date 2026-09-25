import { publicMetadata } from '@/lib/config/seo'
import { marketingFlow } from '@/lib/config/marketing-content'
import { MarketingScreenshot } from '@/components/public/marketing-screenshot'
import { PublicCta, PublicPageIntro, PublicShell } from '@/components/public/public-shell'

export const metadata = publicMetadata({ title: 'So funktioniert Binso One', description: 'Vom Kunden über Angebot und Auftrag bis zu Zeiterfassung, Rechnung und Zahlung.', path: '/how-it-works' })

const milestoneScreens = [
  { after: '01', name: 'customers' as const, label: 'Kunden' },
  { after: '04', name: 'time' as const, label: 'Zeiterfassung' },
  { after: '05', name: 'invoices' as const, label: 'Rechnungen' },
]

export default function HowItWorksPage() {
  return (
    <PublicShell>
      <main className="public-main v78-subpage v782-process-page">
        <PublicPageIntro eyebrow="Ablauf" title="Vom Kunden bis zur Rechnung. Schritt für Schritt." description="Binso One folgt einem einfachen roten Faden. Bereits erfasste Informationen werden im nächsten Schritt weiterverwendet." />
        <section className="v782-process-list">
          {marketingFlow.map(([number, title, description]) => (
            <article key={number}>
              <b>{number}</b>
              <div><h2>{title}</h2><p>{description}</p></div>
              <span aria-hidden="true">→</span>
            </article>
          ))}
        </section>
        <section className="v782-process-screens" aria-label="Produktansichten entlang des Ablaufs">
          {milestoneScreens.map((item) => <article key={item.name}><span>{item.label}</span><div className="v78-process-shot v782-process-shot"><MarketingScreenshot name={item.name} /></div></article>)}
        </section>
        <PublicCta />
      </main>
    </PublicShell>
  )
}
