import Link from 'next/link'
import { publicMetadata } from '@/lib/config/seo'
import { planDefinitions } from '@/lib/data/plans'
import { marketingFaq, marketingFeatures, marketingFlow, publicValuePoints } from '@/lib/config/marketing-content'
import { PublicCta, PublicShell } from '@/components/public/public-shell'
import { MarketingScreenshot } from '@/components/public/marketing-screenshot'

export const metadata = publicMetadata({
  title: 'Binso One',
  description: 'Kunden, Angebote, Aufträge, Zeiterfassung und Rechnungen in einer klaren Plattform für Schweizer Dienstleistungsunternehmen.',
  path: '/',
})

const spotlight = marketingFeatures.filter((feature) => ['customers', 'time', 'invoices'].includes(feature.id))

export default function HomePage() {
  const highlightedPlans = planDefinitions.filter((plan) => ['starter', 'business', 'professional'].includes(plan.id))
  return (
    <PublicShell>
      <main className="v80-main">
        <section className="v80-hero">
          <div className="v80-hero-copy">
            <span className="v80-eyebrow">Binso One · Für Schweizer Dienstleistungsunternehmen</span>
            <h1>Vom Kunden bis zur Rechnung. <em>Einfach verbunden.</em></h1>
            <p>Eine ruhige, durchgängige Arbeitsoberfläche für Kunden, Angebote, Aufträge, Zeiten und Rechnungen – ohne unnötige Umwege.</p>
            <div className="v80-actions"><Link className="button primary" href="/register">14 Tage kostenlos testen</Link><Link className="button secondary" href="/register?mode=demo">Produktdemo starten</Link></div>
            <div className="v80-proof">{publicValuePoints.map((item) => <span key={item}>{item}</span>)}</div>
          </div>
          <div className="v80-visual v80-hero-visual"><div className="v80-visual-label"><span>Produktansicht</span><strong>Dashboard</strong></div><MarketingScreenshot name="dashboard" priority desktopOnly /></div>
        </section>

        <section className="v80-process">
          <div className="v80-section-head"><span className="v80-eyebrow">Ein Ablauf</span><h2>Weniger Wechsel. Mehr Überblick.</h2><p>Informationen werden dort weitergeführt, wo sie bereits vorhanden sind.</p></div>
          <div className="v80-process-grid">{marketingFlow.slice(0, 4).map(([number, title, description]) => <article key={number}><span>{number}</span><div><strong>{title}</strong><p>{description}</p></div></article>)}</div>
          <Link className="v80-text-link" href="/how-it-works">Gesamten Ablauf ansehen →</Link>
        </section>

        <section className="v80-showcases">
          <div className="v80-section-head"><span className="v80-eyebrow">Im Alltag</span><h2>Echte Ansichten. Ruhig präsentiert.</h2><p>Keine übergrossen Produktbilder: Text und Anwendung bleiben im Gleichgewicht.</p></div>
          {spotlight.map((feature, index) => (
            <article className={`v80-split ${index % 2 ? 'is-reversed' : ''}`} key={feature.id}>
              <div className="v80-split-copy"><span>{String(index + 1).padStart(2, '0')}</span><h3>{feature.title}</h3><p>{feature.description}</p><strong>{feature.benefit}</strong>{index === spotlight.length - 1 ? <Link className="v80-text-link" href="/features">Alle Funktionen ansehen →</Link> : null}</div>
              <div className="v80-visual"><MarketingScreenshot name={feature.id as 'customers' | 'time' | 'invoices'} desktopOnly /></div>
            </article>
          ))}
        </section>

        <section className="v80-security">
          <div><span className="v80-eyebrow">Sicherheit</span><h2>Klare Trennung zwischen Kunden und Plattformverwaltung.</h2><p>Organisation, Rollen und Berechtigungen werden serverseitig geprüft. Der interne Binso-Zugang bleibt vom Kunden-Login getrennt.</p><Link className="v80-text-link" href="/security">Mehr zur Sicherheit →</Link></div>
          <ul><li>Mandantentrennung</li><li>Rollen und Berechtigungen</li><li>Separater Admin-Zugang</li></ul>
        </section>

        <section className="v80-pricing-preview">
          <div className="v80-section-head is-row"><div><span className="v80-eyebrow">Preise</span><h2>Passend starten.</h2></div><Link className="v80-text-link" href="/pricing">Alle Preise →</Link></div>
          <div className="v80-plan-grid">{highlightedPlans.map((plan) => <article key={plan.id} className={plan.recommended ? 'recommended' : ''}><div><span>{plan.name}</span>{plan.recommended ? <small>Empfohlen</small> : null}</div><strong>{plan.monthlyPriceChf ? <>CHF {plan.monthlyPriceChf}<small> / Monat</small></> : 'Individuell'}</strong><p>{plan.description}</p><Link href={`/register?plan=${plan.id}`}>Starten →</Link></article>)}</div>
        </section>

        <section className="v80-faq"><div className="v80-section-head"><span className="v80-eyebrow">FAQ</span><h2>Kurz beantwortet.</h2></div><div>{marketingFaq.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></section>
        <PublicCta />
      </main>
    </PublicShell>
  )
}
