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

const spotlight = marketingFeatures.filter((feature) => ['customers', 'time', 'invoices'].includes(feature.id))

export default function HomePage() {
  const highlightedPlans = planDefinitions.filter((plan) => ['starter', 'business', 'professional'].includes(plan.id))
  return (
    <PublicShell light>
      <main className="public-main public-landing-v78 v782-landing">
        <section className="v78-hero v782-hero">
          <div className="v78-hero-copy">
            <span className="public-eyebrow">Binso One für Schweizer Dienstleistungsunternehmen</span>
            <h1>Vom Kunden bis zur Rechnung.<br /><em>Einfach durchgängig arbeiten.</em></h1>
            <p>Binso One verbindet Kunden, Angebote, Aufträge, Zeiterfassung und Rechnungen. So bleibt dein Ablauf verständlich und Informationen müssen nicht mehrfach erfasst werden.</p>
            <div className="v78-hero-actions"><Link className="button primary" href="/register">14 Tage kostenlos testen</Link><Link className="button secondary" href="/register?mode=demo">Produktdemo starten</Link></div><Link className="v79-hero-detail-link" href="/how-it-works">So funktioniert Binso One →</Link>
            <div className="v78-proof-row" aria-label="Vorteile beim Einstieg">{publicValuePoints.map((item) => <span key={item}>{item}</span>)}</div>
          </div>
          <div className="v78-hero-shot v782-hero-shot"><div className="v78-shot-label"><span>Produktansicht</span><strong>Dashboard</strong></div><MarketingScreenshot name="dashboard" priority /></div>
        </section>

        <section className="v78-trust-strip v782-trust-strip"><strong>Ein klarer Ablauf.</strong><span>Kundendaten einmal erfassen</span><span>Arbeit direkt weiterführen</span><span>Leistungen sauber abrechnen</span></section>

        <section className="v78-flow-section v782-flow-section">
          <div className="v78-section-heading"><span className="public-eyebrow">So funktioniert es</span><h2>Vom ersten Kontakt bis zur Zahlung.</h2><p>Jeder Schritt baut auf dem vorherigen auf. Du bleibst im gleichen Prozess und führst vorhandene Informationen weiter.</p></div>
          <div className="v78-flow-grid">{marketingFlow.map(([number, title, description]) => <article key={number}><b>{number}</b><strong>{title}</strong><p>{description}</p></article>)}</div>
          <Link className="v78-text-link" href="/how-it-works">Ablauf im Detail ansehen →</Link>
        </section>

        <section className="v78-intro-section v782-intro-section"><span className="public-eyebrow">Funktionen</span><h2>Die wichtigsten Bereiche im Alltag.</h2><p>Drei Beispiele zeigen den roten Faden. Auf der Funktionsseite findest du alle Bereiche mit echten Ansichten aus Binso One.</p></section>

        <section className="v78-feature-showcase v782-feature-showcase">
          {spotlight.map((feature, index) => (
            <article className="v78-feature-row" key={feature.id}>
              <div className="v78-feature-copy"><span>{String(index + 1).padStart(2, '0')}</span><h2>{feature.title}</h2><p>{feature.description}</p><strong>{feature.benefit}</strong>{index === spotlight.length - 1 ? <Link href="/features">Alle Funktionen ansehen →</Link> : null}</div>
              <div className="v78-feature-shot v782-feature-shot"><MarketingScreenshot name={feature.id as 'customers' | 'time' | 'invoices'} /></div>
            </article>
          ))}
        </section>

        <section className="v78-security-section v782-security-section"><div><span className="public-eyebrow">Sicherheit</span><h2>Kundenbereich und Plattformzugang bleiben getrennt.</h2><p>Organisation, Mitgliedschaft, Rollen und Berechtigungen werden serverseitig geprüft. Der interne Binso-Admin-Zugang ist vom Kunden-Login getrennt.</p><Link href="/security">Mehr zur Sicherheit →</Link></div><div className="v78-security-points"><span>Mandantentrennung</span><span>Rollen und Berechtigungen</span><span>Getrennter Admin-Zugang</span></div></section>

        <section className="public-section v78-pricing-preview v782-pricing-preview"><div className="v78-section-heading split"><div><span className="public-eyebrow">Preise</span><h2>Passend starten. Später wechseln.</h2></div><Link href="/pricing">Preise vergleichen →</Link></div><SwipeCarousel className="public-price-preview" count={highlightedPlans.length}>{highlightedPlans.map((plan) => <article key={plan.id} className={plan.recommended ? 'recommended' : ''}><div><span>{plan.name}</span>{plan.recommended ? <small>Empfohlen</small> : null}</div><strong>{plan.monthlyPriceChf ? <>CHF {plan.monthlyPriceChf}<small> / Monat</small></> : 'Individuell'}</strong><p>{plan.description}</p><Link className="button secondary" href={`/register?plan=${plan.id}`}>14 Tage testen</Link></article>)}</SwipeCarousel></section>

        <section className="public-section v78-faq-preview v782-faq-preview"><div className="v78-section-heading"><span className="public-eyebrow">FAQ</span><h2>Was du vor dem Start wissen solltest.</h2></div><div className="public-faq-list">{marketingFaq.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div><Link className="v78-text-link" href="/faq">Alle Fragen ansehen →</Link></section>
        <PublicCta />
      </main>
    </PublicShell>
  )
}
