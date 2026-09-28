import Link from 'next/link'
import { publicMetadata } from '@/lib/config/seo'
import { PublicShell } from '@/components/public/public-shell'
import { MarketingScreenshot } from '@/components/public/marketing-screenshot'

export const metadata = publicMetadata({
  title: 'Binso One',
  description: 'Binso One verbindet Projektmanagement, Zeiterfassung, Abrechnung und CRM in einer klaren Plattform für Schweizer Dienstleistungsunternehmen.',
  path: '/',
})

const workflow = ['Kunde', 'Angebot', 'Auftrag', 'Zeit', 'Rechnung'] as const

const benefits = [
  {
    number: '01',
    title: 'Ein durchgängiger Ablauf',
    copy: 'Informationen werden einmal erfasst und über den gesamten Geschäftsprozess weiterverwendet.',
  },
  {
    number: '02',
    title: 'Weniger Administrationsaufwand',
    copy: 'Kunden, Aufträge, Zeiten und Rechnungen bleiben miteinander verbunden und schnell auffindbar.',
  },
  {
    number: '03',
    title: 'Klar auf jedem Gerät',
    copy: 'Binso One ist für Desktop, Mobile und PWA mit denselben klaren Abläufen aufgebaut.',
  },
] as const

export default function HomePage() {
  return (
    <PublicShell>
      <main className="v816-home v822-home v823-home">
        <section className="v816-hero v822-hero v823-hero" aria-labelledby="hero-title">
          <div className="v816-inner v816-hero-grid v822-hero-grid v823-hero-grid">
            <div className="v816-hero-copy v822-hero-copy v823-hero-copy">
              <span className="v80-eyebrow">Binso One</span>
              <h1 id="hero-title">Geschäft führen. Einfacher.</h1>
              <p>Eine Plattform für Kunden, Angebote, Aufträge, Zeiterfassung und Rechnungen – entwickelt für Schweizer Dienstleistungsunternehmen.</p>
              <div className="v816-actions v823-hero-actions">
                <Link className="v816-button v816-button-primary" href="/register?mode=trial">30 Tage kostenlos testen <span>→</span></Link>
                <Link className="v816-button v816-button-secondary" href="/sign-in">Anmelden</Link>
              </div>
              <Link className="v823-demo-link" href="/register?mode=demo">Demo ansehen <span>→</span></Link>
            </div>
            <div className="v816-laptop v822-hero-product v823-hero-product" aria-label="Binso One Produktansicht">
              <div className="v816-laptop-screen"><MarketingScreenshot name="dashboard" priority /></div>
            </div>
          </div>
        </section>

        <section className="v822-benefits v823-benefits" aria-labelledby="benefits-title">
          <div className="v816-inner">
            <div className="v822-section-heading v823-section-heading">
              <span className="v80-eyebrow">Warum Binso One</span>
              <h2 id="benefits-title">Alles Wichtige gehört zusammen.</h2>
              <p>Statt isolierter Einzellösungen verbindet Binso One die täglichen Abläufe in einer gemeinsamen Arbeitsumgebung.</p>
            </div>
            <div className="v822-benefit-grid v823-benefit-grid">
              {benefits.map((benefit) => (
                <article key={benefit.title}>
                  <span className="v823-benefit-number">{benefit.number}</span>
                  <h3>{benefit.title}</h3>
                  <p>{benefit.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="v822-workflow v823-workflow" aria-labelledby="workflow-title">
          <div className="v816-inner v823-workflow-layout">
            <div className="v822-section-heading v822-section-heading-compact v823-section-heading">
              <span className="v80-eyebrow">Ein Prozess</span>
              <h2 id="workflow-title">Vom ersten Kontakt bis zur Rechnung.</h2>
              <p>Ein klarer Ablauf ohne Medienbrüche und ohne doppelte Datenerfassung.</p>
            </div>
            <ol className="v822-flow v823-flow" aria-label="Ein klarer Ablauf für dein Unternehmen.">
              {workflow.map((step, index) => (
                <li key={step}>
                  <span><small>{String(index + 1).padStart(2, '0')}</small><span className="v823-flow-label">{step}</span></span>
                  {index < workflow.length - 1 ? <b aria-hidden="true">→</b> : null}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="v822-product v823-product" aria-labelledby="product-title">
          <div className="v816-inner">
            <div className="v823-product-intro">
              <div className="v822-section-heading v823-section-heading">
                <span className="v80-eyebrow">Übersicht</span>
                <h2 id="product-title">Dein Unternehmen auf einen Blick.</h2>
              </div>
              <p>Wichtige Informationen und nächste Schritte sind direkt sichtbar – ohne unnötige Ebenen und ohne überladene Dashboards.</p>
            </div>
            <div className="v822-product-stage v823-product-stage">
              <MarketingScreenshot name="dashboard" />
            </div>
          </div>
        </section>

        <section className="v822-scenes v823-scenes" aria-labelledby="scenes-title">
          <div className="v816-inner">
            <div className="v822-section-heading v822-section-heading-compact v823-section-heading">
              <span className="v80-eyebrow">Im Alltag</span>
              <h2 id="scenes-title">Die wichtigsten Aufgaben. Klar getrennt.</h2>
            </div>
            <div className="v822-scene-grid v823-scene-grid">
              <article className="v822-scene v822-scene-wide v823-scene v823-scene-featured">
                <div className="v822-scene-copy v823-scene-copy">
                  <div><small>01 · Projektmanagement</small><h3>Von der Anfrage direkt in die Umsetzung.</h3></div>
                  <p>Aufträge bündeln Kundenbezug, Leistung und Fortschritt an einem Ort.</p>
                </div>
                <MarketingScreenshot name="orders" />
              </article>
              <article className="v822-scene v823-scene">
                <div className="v822-scene-copy v823-scene-copy">
                  <div><small>02 · Zeiterfassung</small><h3>Zeit schnell und nachvollziehbar erfassen.</h3></div>
                </div>
                <MarketingScreenshot name="time" />
              </article>
              <article className="v822-scene v823-scene">
                <div className="v822-scene-copy v823-scene-copy">
                  <div><small>03 · Abrechnung</small><h3>Aus geleisteter Arbeit wird eine Rechnung.</h3></div>
                </div>
                <MarketingScreenshot name="invoices" />
              </article>
            </div>
            <div className="v822-scenes-link v823-scenes-link">
              <Link href="/features">Alle Funktionen ansehen <span>→</span></Link>
            </div>
          </div>
        </section>

        <section className="v822-trust v823-trust" aria-labelledby="trust-title">
          <div className="v816-inner v823-trust-layout">
            <div className="v822-section-heading v822-section-heading-compact v823-section-heading">
              <span className="v80-eyebrow">Vertrauen</span>
              <h2 id="trust-title">Für den professionellen Einsatz aufgebaut.</h2>
              <p>Klare Zugriffe, nachvollziehbare Berechtigungen und eine Oberfläche für Desktop, Mobile und PWA.</p>
            </div>
            <div className="v822-trust-grid v823-trust-grid">
              <div><strong>Schweizer Fokus</strong><span>Für Schweizer Dienstleistungsunternehmen entwickelt.</span></div>
              <div><strong>Klare Zugriffe</strong><span>Berechtigungen werden serverseitig und rollenbasiert gesteuert.</span></div>
              <div><strong>Überall nutzbar</strong><span>Ein konsistentes Erlebnis auf Desktop, Mobile und als PWA.</span></div>
            </div>
          </div>
        </section>

        <section className="v822-final v823-final">
          <div className="v816-inner">
            <div className="v816-price-cta v820-final-cta v822-final-cta v823-final-cta">
              <div>
                <span className="v80-eyebrow">Bereit zum Start?</span>
                <h2>Binso One 30 Tage kostenlos testen.</h2>
                <p>Keine Zahlungsdaten beim Start. In Ruhe ausprobieren und danach entscheiden.</p>
              </div>
              <div className="v816-actions">
                <Link className="v816-button v816-button-primary" href="/register?mode=trial">Kostenlos starten →</Link>
                <Link className="v816-button v816-button-secondary" href="/pricing">Preise ansehen</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </PublicShell>
  )
}
