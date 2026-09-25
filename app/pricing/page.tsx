import Link from 'next/link'
import { publicMetadata } from '@/lib/config/seo'
import { PublicPageIntro, PublicShell } from '@/components/public/public-shell'
import { selfServicePlanDefinitions } from '@/lib/data/plans'
import { SwipeCarousel } from '@/components/public/swipe-carousel'
import { TRIAL_DAYS } from '@/lib/config/product'

export const metadata = publicMetadata({ title: 'Preise', description: 'Pläne und Preise von Binso One für Schweizer Dienstleistungsunternehmen vergleichen.', path: '/pricing' })

const featureLabels: Record<string, string> = {
  crm: 'Kunden und Kontakte', quotes: 'Angebote', orders: 'Aufträge', contracts: 'Verträge', time: 'Zeiterfassung',
  invoices: 'Rechnungen', finance: 'Finanzübersicht', employees: 'Mitarbeitende', audit: 'Audit und Nachvollziehbarkeit',
  expenses: 'Spesen', reminders: 'Mahnwesen', approvals: 'Freigaben', accounting: 'Buchhaltung', margin: 'Kosten und Margen',
  automations: 'Automationen', api: 'API und Integrationen', imports: 'Datenimport', exports: 'Datenexport',
}

const planBadges: Record<string, string> = {
  starter: 'Für den Einstieg',
  business: 'Am beliebtesten',
  professional: 'Für wachsende Teams',
}

export default function PricingPage() {
  return (
    <PublicShell>
      <main className="public-main public-pricing-page-v79">
        <PublicPageIntro eyebrow="Preise" title="Einfach starten. Mit dem Unternehmen wachsen." description={`Alle Pläne starten mit ${TRIAL_DAYS} Tagen Testzeit. Keine Zahlungsdaten beim Start. Du kannst später in einen passenden Plan wechseln.`} />
        <div className="pricing-demo-entry"><span>Noch unsicher?</span><p>Probiere die Business-Funktionen zuerst in einem isolierten Demo-Arbeitsbereich mit fiktiven Daten aus.</p><Link href="/register?mode=demo">Produktdemo starten →</Link></div>
        <div className="pricing-trust-row" aria-label="Vorteile der Testphase">
          <span>{TRIAL_DAYS} Tage kostenlos</span><span>Keine Zahlungsdaten zum Start</span><span>Plan später wechseln</span>
        </div>
        <SwipeCarousel className="pricing-grid public-pricing-grid pricing-grid-v79" count={selfServicePlanDefinitions.length}>
          {selfServicePlanDefinitions.map((plan) => (
            <article className={plan.recommended ? 'pricing-card pricing-card-v79 recommended' : 'pricing-card pricing-card-v79'} key={plan.id}>
              <div className="pricing-card-head">
                <div className="pricing-card-title-row"><h2>{plan.name}</h2><span className="pricing-plan-badge">{planBadges[plan.id] ?? 'Binso One'}</span></div>
                <p className="pricing-positioning">{plan.positioning}</p>
              </div>
              <strong className="pricing-price">CHF {plan.monthlyPriceChf}<small> / Monat</small></strong>
              <span className="pricing-users">{plan.includedUsers} Benutzer inklusive</span>
              <ul className="pricing-highlights">{plan.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul>
              <Link className="button primary pricing-cta" href={`/register?plan=${plan.id}`}>{TRIAL_DAYS} Tage kostenlos testen</Link>
              <details className="pricing-details">
                <summary>Alle enthaltenen Funktionen</summary>
                <ul>{plan.features.map((feature) => <li key={feature}>{featureLabels[feature] ?? feature}</li>)}</ul>
              </details>
            </article>
          ))}
        </SwipeCarousel>
        <section className="pricing-note pricing-enterprise-v79"><div><span>Enterprise</span><strong>Mehr Benutzer oder individuelle Anforderungen?</strong><p>Professional lässt sich für grössere Organisationen um Benutzergrenzen, Integrationen und vertragliche Anforderungen erweitern.</p></div><Link className="button secondary" href="/contact">Kontakt aufnehmen</Link></section>
      </main>
    </PublicShell>
  )
}
