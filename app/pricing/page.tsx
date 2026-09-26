import Link from 'next/link'
import { publicMetadata } from '@/lib/config/seo'
import { PublicCta, PublicPageIntro, PublicShell } from '@/components/public/public-shell'
import { selfServicePlanDefinitions } from '@/lib/data/plans'
import { FEATURE_LABELS, PLAN_SHORT_BENEFIT } from '@/lib/data/plan-presentation'
import { TRIAL_DAYS } from '@/lib/config/product'

export const metadata = publicMetadata({ title: 'Preise', description: 'Pläne und Preise von Binso One für Schweizer Dienstleistungsunternehmen vergleichen.', path: '/pricing' })

export default function PricingPage() {
  return (
    <PublicShell>
      <main className="v80-main v812-page">
        <PublicPageIntro eyebrow="Faire Preise" title="Ein Plan, der zu dir passt." description={`Transparent starten, ${TRIAL_DAYS} Tage kostenlos testen und bei Bedarf wachsen. Keine Zahlungsdaten beim Start.`} />
        <section className="v812-pricing-grid" aria-label="Binso One Pläne">
          {selfServicePlanDefinitions.map((plan) => (
            <article className={`v812-plan-card ${plan.recommended ? 'recommended' : ''}`} key={plan.id}>
              <div className="v812-plan-head"><div><span className="v80-eyebrow pricing-plan-badge">{plan.recommended ? 'Empfohlen' : 'Binso One'}</span><h2>{plan.name}</h2></div></div>
              <p>{plan.positioning}</p><span className="v812-plan-benefit">{PLAN_SHORT_BENEFIT[plan.id as 'starter' | 'business' | 'professional']}</span>
              <strong className="v812-plan-price">CHF {plan.monthlyPriceChf}<small> / Monat</small></strong>
              <span className="v812-plan-users">{plan.includedUsers} Benutzer inklusive</span>
              <ul className="pricing-highlights">{plan.highlights.map((item) => <li key={item}>{item}</li>)}</ul>
              <Link className="button primary" href={`/register?plan=${plan.id}`}>{TRIAL_DAYS} Tage kostenlos testen</Link>
              <details><summary>Alle enthaltenen Funktionen</summary><ul>{plan.features.map((feature) => <li key={feature}>{FEATURE_LABELS[feature] ?? feature}</li>)}</ul></details>
            </article>
          ))}
        </section>
        <section className="v812-inline-cta"><div><span className="v80-eyebrow">Produktdemo</span><h2>Erst ansehen, dann entscheiden.</h2><p>Teste die Business-Funktionen mit fiktiven Beispieldaten.</p></div><Link className="button secondary" href="/register?mode=demo">Demo ansehen</Link></section>
        <PublicCta />
      </main>
    </PublicShell>
  )
}
