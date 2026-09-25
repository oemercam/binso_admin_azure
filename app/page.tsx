import Link from 'next/link'
import { publicMetadata } from '@/lib/config/seo'
import { planDefinitions } from '@/lib/data/plans'
import { marketingFaq, marketingFeatures, marketingFlow, publicValuePoints } from '@/lib/config/marketing-content'
import { PublicCta, PublicShell } from '@/components/public/public-shell'
import { SwipeCarousel } from '@/components/public/swipe-carousel'
import { MarketingScreenshot } from '@/components/public/marketing-screenshot'

export const metadata = publicMetadata({
  title: 'Binso One',
  description: 'Kunden, Angebote, Aufträge, Zeiterfassung und Rechnungen in einer klaren Plattform für Schweizer Dienstleistungsunternehmen.',
  path: '/',
})

const spotlight = marketingFeatures.filter((feature) => ['customers', 'quotes', 'orders', 'time', 'invoices'].includes(feature.id))

export default function HomePage() {
  const highlightedPlans = planDefinitions.filter((plan) => ['starter', 'business', 'professional'].includes(plan.id))
  return (
    <PublicShell light>
      <main className="public-main public-landing-v78">
        <section className="v78-hero">
          <div className="v78-hero-copy">
            <span className="public-eyebrow">Binso One für Schweizer Dienstleistungsunternehmen</span>
            <h1>Vom Kunden bis zur Rechnung.<br /><em>Alles in einem klaren Ablauf.</em></h1>
            <p>Kunden, Angebote, Aufträge, Zeiten und Rechnungen greifen direkt ineinander. Du erfasst Informationen einmal und führst sie dort weiter, wo du sie brauchst.</p>
            <div className="v78-hero-actions"><Link className="button primary" href="/register">14 Tage kostenlos testen</Link><Link className="button secondary" href="/features">Funktionen ansehen</Link></div>
            <div className="v78-proof-row" aria-label="Vorteile beim Einstieg">{publicValuePoints.map((item) => <span key={item}>{item}</span>)}</div>
          </div>
          <div className="v78-hero-shot"><div className="v78-shot-label"><span>Echte Anwendung</span><strong>Binso One Dashboard</strong></div><MarketingScreenshot name="dashboard" priority /></div>
        </section>

        <section className="v78-trust-strip"><strong>Ein System statt einzelner Inseln.</strong><span>Kundendaten weiterverwenden</span><span>Leistungen direkt abrechnen</span><span>Desktop, Mobile und PWA</span></section>

        <section className="v78-intro-section"><span className="public-eyebrow">Arbeitsalltag</span><h2>So sieht Binso One wirklich aus.</h2><p>Keine illustrierten Demo-Oberflächen: Die folgenden Ansichten stammen direkt aus der Anwendung.</p></section>

        <section className="v78-feature-showcase">
          {spotlight.map((feature, index) => (
            <article className="v78-feature-row" key={feature.id}>
              <div className="v78-feature-copy"><span>{String(index + 1).padStart(2, '0')}</span><h2>{feature.title}</h2><p>{feature.description}</p><strong>{feature.benefit}</strong><Link href="/features">Mehr zu den Funktionen →</Link></div>
              <div className="v78-feature-shot"><MarketingScreenshot name={feature.id as 'customers' | 'quotes' | 'orders' | 'time' | 'invoices'} /></div>
            </article>
          ))}
        </section>

        <section className="v78-flow-section">
          <div className="v78-section-heading"><span className="public-eyebrow">Durchgängiger Ablauf</span><h2>Ein Schritt baut auf dem nächsten auf.</h2><p>Die Informationen bleiben im Prozess erhalten, statt bei jedem Schritt neu erfasst zu werden.</p></div>
          <div className="v78-flow-grid">{marketingFlow.map(([number, title, description]) => <article key={number}><b>{number}</b><strong>{title}</strong><p>{description}</p></article>)}</div>
          <Link className="v78-text-link" href="/how-it-works">Den gesamten Ablauf ansehen →</Link>
        </section>

        <section className="v78-mobile-section">
          <div className="v78-mobile-copy"><span className="public-eyebrow">Auch unterwegs</span><h2>Die gleiche Arbeit, passend für den kleineren Bildschirm.</h2><p>Binso One ist für Desktop und Mobile aufgebaut. Navigation und Inhalte werden an den verfügbaren Platz angepasst.</p><Link href="/features">Funktionen entdecken →</Link></div>
          <div className="v78-mobile-shot"><MarketingScreenshot name="dashboard" /></div>
        </section>

        <section className="v78-security-section"><div><span className="public-eyebrow">Sicherheit</span><h2>Zugriff bleibt klar getrennt.</h2><p>Organisation, Mitgliedschaft, Rollen und Berechtigungen werden serverseitig geprüft. Plattformzugänge bleiben vom Kundenbereich getrennt.</p><Link href="/security">Sicherheitsmodell ansehen →</Link></div><div className="v78-security-points"><span>Mandantentrennung</span><span>Rollen und Berechtigungen</span><span>Nachvollziehbare Plattformzugriffe</span></div></section>

        <section className="public-section v78-pricing-preview"><div className="v78-section-heading split"><div><span className="public-eyebrow">Preise</span><h2>Passend starten. Später wechseln.</h2></div><Link href="/pricing">Alle Preise vergleichen →</Link></div><SwipeCarousel className="public-price-preview" count={highlightedPlans.length}>{highlightedPlans.map((plan) => <article key={plan.id} className={plan.recommended ? 'recommended' : ''}><div><span>{plan.name}</span>{plan.recommended ? <small>Empfohlen</small> : null}</div><strong>{plan.monthlyPriceChf ? <>CHF {plan.monthlyPriceChf}<small> / Monat</small></> : 'Individuell'}</strong><p>{plan.description}</p><Link className="button secondary" href={`/register?plan=${plan.id}`}>14 Tage testen</Link></article>)}</SwipeCarousel></section>

        <section className="public-section v78-faq-preview"><div className="v78-section-heading"><span className="public-eyebrow">FAQ</span><h2>Die wichtigsten Fragen vor dem Start.</h2></div><div className="public-faq-list">{marketingFaq.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div><Link className="v78-text-link" href="/faq">Alle Fragen ansehen →</Link></section>
        <PublicCta />
      </main>
    </PublicShell>
  )
}
