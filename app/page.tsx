import Link from 'next/link'
import { publicMetadata } from '@/lib/config/seo'
import { planDefinitions } from '@/lib/data/plans'
import { marketingFaq } from '@/lib/config/marketing-content'
import { PublicShell } from '@/components/public/public-shell'
import { MarketingScreenshot } from '@/components/public/marketing-screenshot'

export const metadata = publicMetadata({
  title: 'Binso One',
  description: 'Binso One verbindet Kunden, Projekte, Zeiterfassung, Angebote und Rechnungen in einer klaren Plattform für Schweizer Dienstleistungsunternehmen.',
  path: '/',
})

const featureTiles = [
  ['▣', 'Projekte', 'effizient steuern'],
  ['◷', 'Zeiten', 'einfach erfassen'],
  ['▤', 'Rechnungen', 'schnell erstellen'],
  ['▥', 'Business', 'im Blick behalten'],
] as const

const trustPoints = [
  'Schweizer Fokus',
  'Klare Rollen und Berechtigungen',
  'Desktop, Mobile und PWA',
  '30 Tage ohne Zahlungsdaten testen',
] as const

export default function HomePage() {
  const highlightedPlans = planDefinitions.filter((plan) => ['starter', 'business', 'professional'].includes(plan.id))

  return (
    <PublicShell>
      <main className="v80-main">
        <section className="v81-hero v80-hero" aria-labelledby="hero-title">
          <div className="v81-hero-copy">
            <span className="v80-eyebrow">Die Business Plattform für Agenturen, Beratungen und Dienstleister</span>
            <h1 id="hero-title">Einfacher arbeiten.<br />Erfolgreicher wachsen.</h1>
            <p>Binso One verbindet Kunden, Projekte, Zeiterfassung, Angebote und Rechnungen in einer klaren Plattform.</p>
            <div className="v81-hero-actions">
              <Link className="button primary v81-primary-button" href="/register">30 Tage kostenlos testen</Link>
              <Link className="button secondary v81-secondary-button" href="/register?mode=demo"><span aria-hidden="true">▶</span> Demo ansehen</Link>
            </div>
            <div className="v81-trust-points" aria-label="Vorteile beim Start">
              <span>Keine Kreditkarte nötig</span>
              <span>In wenigen Minuten startklar</span>
              <span>Für Schweizer Unternehmen</span>
            </div>
          </div>
          <div className="v81-hero-device v80-hero-visual" aria-label="Binso One Produktansicht">
            <div className="v81-device-screen"><MarketingScreenshot name="dashboard" priority desktopOnly /></div>
            <div className="v81-device-base" aria-hidden="true" />
          </div>
        </section>

        <section className="v81-feature-strip" aria-labelledby="feature-strip-title">
          <div className="v81-strip-copy">
            <span className="v80-eyebrow">Weniger ist mehr.</span>
            <h2 id="feature-strip-title">Alle wichtigen Funktionen an einem Ort.</h2>
            <p>Übersichtlich, performant und gemacht für den Alltag in Projekten.</p>
          </div>
          <div className="v81-feature-tiles">
            {featureTiles.map(([icon, title, text]) => (
              <article key={title}><span className="v81-feature-icon" aria-hidden="true">{icon}</span><strong>{title}</strong><small>{text}</small></article>
            ))}
          </div>
        </section>

        <section className="v81-product-section v80-split" aria-labelledby="projects-title">
          <div className="v81-section-copy">
            <span className="v80-eyebrow">Projektmanagement</span>
            <h2 id="projects-title">Projekte im Griff.<br />Von der Idee bis zur Rechnung.</h2>
            <p>Plane, organisiere und steuere deine Projekte. Aufgaben, Leistungen, Budgets und Teamarbeit bleiben an einem Ort.</p>
            <Link className="v81-text-link" href="/features">Mehr zu Projekten <span aria-hidden="true">→</span></Link>
          </div>
          <div className="v81-product-image"><MarketingScreenshot name="orders" desktopOnly /></div>
        </section>

        <section className="v81-product-section is-reversed" aria-labelledby="time-title">
          <div className="v81-section-copy">
            <span className="v80-eyebrow">Zeiterfassung</span>
            <h2 id="time-title">Zeiten erfassen. Überall und ohne Aufwand.</h2>
            <p>Erfasse deine Arbeitszeit flexibel und direkt auf Kunden und Aufträge. Budgets und Verrechenbarkeit bleiben jederzeit sichtbar.</p>
            <Link className="v81-text-link" href="/features">Mehr zur Zeiterfassung <span aria-hidden="true">→</span></Link>
          </div>
          <div className="v81-product-image"><MarketingScreenshot name="time" desktopOnly /></div>
        </section>

        <section className="v81-product-section" aria-labelledby="billing-title">
          <div className="v81-section-copy">
            <span className="v80-eyebrow">Angebote und Abrechnung</span>
            <h2 id="billing-title">Schnell zur Rechnung. Alles im Blick.</h2>
            <p>Erstelle Angebote und Rechnungen direkt aus deinen Leistungen. Offene, versendete und bezahlte Vorgänge bleiben nachvollziehbar.</p>
            <Link className="v81-text-link" href="/features">Mehr zu Abrechnung und Finanzen <span aria-hidden="true">→</span></Link>
          </div>
          <div className="v81-product-image"><MarketingScreenshot name="invoices" desktopOnly /></div>
        </section>

        <section className="v81-integrations" aria-labelledby="integrations-title">
          <div className="v81-integrations-copy">
            <span className="v80-eyebrow">Integrationen</span>
            <h2 id="integrations-title">Deine Daten. Sauber verbunden.</h2>
            <p>Binso One ist für den Datenaustausch vorbereitet – mit Import, Export, API und Automationen je nach Plan.</p>
            <Link className="v81-text-link" href="/pricing">Funktionen nach Plan ansehen <span aria-hidden="true">→</span></Link>
          </div>
          <div className="v81-integration-visual" aria-label="Integrationsmöglichkeiten">
            <span className="v81-integration-node">CSV</span>
            <span className="v81-integration-node">API</span>
            <strong className="v81-integration-core">B1</strong>
            <span className="v81-integration-node">Import</span>
            <span className="v81-integration-node">Export</span>
          </div>
        </section>

        <section className="v81-trust" aria-labelledby="trust-title">
          <div>
            <span className="v80-eyebrow">Vertrauen</span>
            <h2 id="trust-title">Für den professionellen Arbeitsalltag gebaut.</h2>
          </div>
          <div className="v81-trust-grid">
            {trustPoints.map((point) => <span key={point}>{point}</span>)}
          </div>
        </section>

        <section className="v81-feedback" aria-labelledby="feedback-title">
          <div className="v81-feedback-head">
            <span className="v80-eyebrow">Kundenstimmen</span>
            <h2 id="feedback-title">Referenzen transparent veröffentlichen.</h2>
            <p>Öffentliche Kundenstimmen und Firmenlogos werden erst nach Freigabe ergänzt. So bleiben Referenzen nachvollziehbar und glaubwürdig.</p>
          </div>
          <div className="v81-feedback-cards" aria-label="Grundsätze für Kundenreferenzen">
            <article><strong>Echt statt erfunden</strong><p>Nur bestätigte Aussagen werden als Kundenstimme veröffentlicht.</p></article>
            <article><strong>Freigabe vor Veröffentlichung</strong><p>Namen, Logos und Zitate werden nur mit entsprechender Freigabe verwendet.</p></article>
          </div>
        </section>

        <section className="v81-pricing" aria-labelledby="pricing-title">
          <div className="v81-pricing-head">
            <div><span className="v80-eyebrow">Faire Preise</span><h2 id="pricing-title">Ein Plan, der zu dir passt.</h2><p>Transparent starten und bei Bedarf wachsen.</p></div>
            <Link className="v81-text-link" href="/pricing">Alle Preise <span aria-hidden="true">→</span></Link>
          </div>
          <div className="v81-plan-grid">
            {highlightedPlans.map((plan) => (
              <article key={plan.id} className={plan.recommended ? 'recommended' : ''}>
                <div><strong>{plan.name}</strong>{plan.recommended ? <small>Empfohlen</small> : null}</div>
                <p>{plan.description}</p>
                <span className="v81-plan-price">{plan.monthlyPriceChf ? <>CHF {plan.monthlyPriceChf}<small> / Monat</small></> : 'Individuell'}</span>
                <Link href={`/register?plan=${plan.id}`}>30 Tage kostenlos testen →</Link>
              </article>
            ))}
          </div>
        </section>

        <section className="v81-faq" aria-labelledby="faq-title">
          <div><span className="v80-eyebrow">FAQ</span><h2 id="faq-title">Kurz beantwortet.</h2></div>
          <div>{marketingFaq.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
        </section>

        <section className="v81-final-cta" aria-label="Binso One kostenlos testen">
          <div><span className="v80-eyebrow">Bereit für Binso One?</span><h2>Einfach starten. Ohne unnötigen Aufwand.</h2><p>30 Tage kostenlos testen. Keine Zahlungsdaten beim Start.</p></div>
          <div className="v81-final-actions"><Link className="button primary v81-primary-button" href="/register">30 Tage kostenlos testen</Link><Link className="button secondary v81-secondary-button" href="/register?mode=demo">Demo ansehen</Link></div>
        </section>
      </main>
    </PublicShell>
  )
}
