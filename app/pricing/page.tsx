import Link from 'next/link'
import { PublicPageIntro, PublicShell } from '@/components/public/public-shell'
import { selfServicePlanDefinitions } from '@/lib/data/plans'
import { SwipeCarousel } from '@/components/public/swipe-carousel'
import { createPublicMetadata } from '@/lib/config/seo'

export const metadata = createPublicMetadata({
  title: 'Preise und Pläne',
  description: 'Starter, Business und Professional für Schweizer Dienstleistungsunternehmen. Binso One 14 Tage ohne Zahlungsdaten testen.',
  path: '/pricing',
  keywords: ['KMU Software Preise Schweiz', 'Business Software Preise', 'Binso One Preise'],
})

const featureLabels: Record<string, string> = {
  crm: 'Kunden und Kontakte',
  quotes: 'Angebote',
  orders: 'Aufträge',
  contracts: 'Verträge',
  time: 'Zeiterfassung',
  invoices: 'Rechnungen',
  finance: 'Finanzübersicht',
  employees: 'Mitarbeitende',
  audit: 'Audit und Nachvollziehbarkeit',
  expenses: 'Spesen',
  reminders: 'Mahnwesen',
  approvals: 'Freigaben',
  accounting: 'Buchhaltung',
  margin: 'Kosten und Margen',
  automations: 'Automationen',
  api: 'API und Integrationen',
  imports: 'Datenimport',
  exports: 'Datenexport',
}

export default function PricingPage() {
  return (
    <PublicShell>
      <main className="public-main">
        <PublicPageIntro eyebrow="Preise" title="Einfach starten. Mit dem Unternehmen wachsen." description="Wähle den Plan nach deinem tatsächlichen Bedarf. Die Registrierung startet mit 14 Tagen Testphase und ohne direkte Zahlung." />
        <SwipeCarousel className="pricing-grid public-pricing-grid" count={selfServicePlanDefinitions.length}>
          {selfServicePlanDefinitions.map((plan) => (
            <article className={plan.recommended ? 'pricing-card recommended' : 'pricing-card'} key={plan.id}>
              <div className="pricing-card-head">
                <div><h2>{plan.name}</h2>{plan.recommended ? <span>Empfohlen</span> : null}</div>
                <p>{plan.positioning}</p>
              </div>
              <strong className="pricing-price">{plan.monthlyPriceChf ? <>CHF {plan.monthlyPriceChf}<small> / Monat</small></> : 'Individuell'}</strong>
              <small>{plan.includedUsers} Benutzer inklusive</small>
              <p className="pricing-plan-description">{plan.description}</p>
              <ul>{plan.features.map((feature) => <li key={feature}>{featureLabels[feature] ?? feature}</li>)}</ul>
              <Link className="button primary" href={`/register?plan=${plan.id}`}>14 Tage kostenlos testen</Link>
            </article>
          ))}
        </SwipeCarousel>
        <section className="pricing-note"><strong>Grössere oder spezielle Anforderungen?</strong><p>Enterprise ist kein viertes Standardpaket. Wir erweitern Professional bei Bedarf um individuelle Benutzergrenzen, Integrationen und Support.</p><Link href="/contact">Enterprise besprechen →</Link></section>
      </main>
    </PublicShell>
  )
}
