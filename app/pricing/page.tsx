import Link from 'next/link'
import { PublicPageIntro, PublicShell } from '@/components/public/public-shell'
import { planDefinitions } from '@/lib/data/plans'

const featureLabels: Record<string, string> = {
  crm: 'Kunden und Kontakte',
  quotes: 'Angebote',
  orders: 'Aufträge',
  contracts: 'Verträge',
  time: 'Zeiterfassung',
  invoices: 'Rechnungen',
  finance: 'Finanzübersicht',
  employees: 'Mitarbeitende',
  audit: 'Erweiterte Nachvollziehbarkeit',
  imports: 'Datenimport',
  exports: 'Datenexport',
}

export default function PricingPage() {
  return (
    <PublicShell>
      <main className="public-main">
        <PublicPageIntro eyebrow="Preise" title="Einfach starten. Mit dem Unternehmen wachsen." description="Wähle den Plan nach deinem tatsächlichen Bedarf. Die Registrierung startet ohne direkte Zahlung." />
        <section className="pricing-grid public-pricing-grid">
          {planDefinitions.map((plan) => (
            <article className={plan.recommended ? 'pricing-card recommended' : 'pricing-card'} key={plan.id}>
              <div className="pricing-card-head">
                <div><h2>{plan.name}</h2>{plan.recommended ? <span>Empfohlen</span> : null}</div>
                <p>{plan.description}</p>
              </div>
              <strong className="pricing-price">{plan.monthlyPriceChf ? <>CHF {plan.monthlyPriceChf}<small> / Monat</small></> : 'Individuell'}</strong>
              <small>{plan.includedUsers} Benutzer inklusive</small>
              <ul>{plan.features.map((feature) => <li key={feature}>{featureLabels[feature] ?? feature}</li>)}</ul>
              <Link className="button primary" href={plan.id === 'enterprise' ? '/contact' : `/register?plan=${plan.id}`}>{plan.id === 'enterprise' ? 'Kontakt aufnehmen' : '14 Tage testen'}</Link>
            </article>
          ))}
        </section>
        <section className="pricing-note"><strong>Noch unsicher?</strong><p>Du kannst mit einem passenden Plan starten und später wechseln. Bei Enterprise-Anforderungen klären wir Integrationen, Verwaltung und Support individuell.</p></section>
      </main>
    </PublicShell>
  )
}
