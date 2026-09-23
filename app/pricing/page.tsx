'use client'

import { useRouter } from 'next/navigation'
import { planDefinitions } from '@/lib/data/plans'

export default function PricingPage() {
  const router = useRouter()
  return (
    <main className="public-product-page">
      <section className="public-product-shell">
        <div className="public-product-head">
          <span>Business Platform</span>
          <h1>Einfach starten. Mit dem Unternehmen wachsen.</h1>
          <p>Kontakte, Firmen, Angebote, Aufträge, Zeiten und Rechnungen in einer durchgängigen Arbeitsumgebung.</p>
        </div>
        <div className="pricing-grid">
          {planDefinitions.map((plan) => (
            <article className="pricing-card" key={plan.id}>
              <div><h2>{plan.name}</h2><p>{plan.description}</p></div>
              <strong>{plan.monthlyPriceChf ? `CHF ${plan.monthlyPriceChf} / Monat` : 'Individuell'}</strong>
              <small>{plan.includedUsers} Benutzer inklusive</small>
              <ul>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
              <button className="button primary" onClick={() => router.push(`/register?plan=${plan.id}`)}>{plan.id === 'enterprise' ? 'Kontakt aufnehmen' : '14 Tage testen'}</button>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
