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
    title: 'Alles Wichtige auf einen Blick.',
    copy: 'Kunden, Angebote, Aufträge, Zeiten und Rechnungen durchgängig verbunden.',
  },
  {
    title: 'Alle Kundeninformationen an einem Ort.',
    copy: 'Zentrale Kundenübersicht',
  },
  {
    title: 'Von der Anfrage direkt in die Umsetzung.',
    copy: 'Direkte Übernahme in Aufträge',
  },
] as const

export default function HomePage() {
  return (
    <PublicShell>
      <main className="v816-home v822-home">
        <section className="v816-hero v822-hero" aria-labelledby="hero-title">
          <div className="v816-inner v816-hero-grid v822-hero-grid">
            <div className="v816-hero-copy v822-hero-copy">
              <span className="v80-eyebrow">Für Schweizer Dienstleistungsunternehmen</span>
              <h1 id="hero-title">Dein Unternehmen. Eine Plattform.</h1>
              <p>Vom Kunden über Angebot und Auftrag bis zur Rechnung. Klar aufgebaut, schnell erfassbar und ohne unnötigen Ballast.</p>
              <div className="v816-actions">
                <Link className="v816-button v816-button-primary" href="/register?mode=trial">30 Tage kostenlos testen <span>→</span></Link>
                <Link className="v816-button v816-button-secondary" href="/register?mode=demo"><span className="v816-play">▶</span> Demo ansehen</Link>
              </div>
            </div>
            <div className="v816-laptop v822-hero-product" aria-label="Binso One Produktansicht">
              <div className="v816-laptop-screen"><MarketingScreenshot name="dashboard" priority /></div>
            </div>
          </div>
        </section>

        <section className="v822-benefits" aria-labelledby="benefits-title">
          <div className="v816-inner">
            <div className="v822-section-heading">
              <span className="v80-eyebrow">Für Schweizer Dienstleistungsunternehmen</span>
              <h2 id="benefits-title">Weniger Administration. Mehr Zeit für die eigentliche Arbeit.</h2>
            </div>
            <div className="v822-benefit-grid">
              {benefits.map((benefit) => (
                <article key={benefit.title}>
                  <h3>{benefit.title}</h3>
                  <p>{benefit.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="v822-workflow" aria-labelledby="workflow-title">
          <div className="v816-inner">
            <div className="v822-section-heading v822-section-heading-compact">
              <span className="v80-eyebrow">So funktioniert es</span>
              <h2 id="workflow-title">Ein klarer Ablauf für dein Unternehmen.</h2>
            </div>
            <ol className="v822-flow" aria-label="Ein klarer Ablauf für dein Unternehmen.">
              {workflow.map((step, index) => (
                <li key={step}>
                  <span>{step}</span>
                  {index < workflow.length - 1 ? <b aria-hidden="true">→</b> : null}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="v822-product" aria-labelledby="product-title">
          <div className="v816-inner">
            <div className="v822-section-heading">
              <span className="v80-eyebrow">Produkt</span>
              <h2 id="product-title">Alles Wichtige auf einen Blick.</h2>
              <p>Kunden, Angebote, Aufträge, Zeiten und Rechnungen durchgängig verbunden.</p>
            </div>
            <div className="v822-product-stage">
              <MarketingScreenshot name="dashboard" />
            </div>
          </div>
        </section>

        <section className="v822-scenes" aria-labelledby="scenes-title">
          <div className="v816-inner">
            <div className="v822-section-heading v822-section-heading-compact">
              <span className="v80-eyebrow">Funktionen</span>
              <h2 id="scenes-title">Vom Kunden bis zur Rechnung.</h2>
            </div>
            <div className="v822-scene-grid">
              <article className="v822-scene v822-scene-wide">
                <div className="v822-scene-copy">
                  <small>Projektmanagement</small>
                  <h3>Von der Anfrage direkt in die Umsetzung.</h3>
                </div>
                <MarketingScreenshot name="orders" />
              </article>
              <article className="v822-scene">
                <div className="v822-scene-copy">
                  <small>Zeiterfassung</small>
                  <h3>Zeit per Timer oder manuell erfassen</h3>
                </div>
                <MarketingScreenshot name="time" />
              </article>
              <article className="v822-scene">
                <div className="v822-scene-copy">
                  <small>Abrechnung</small>
                  <h3>Schnell zur Rechnung. Alles im Blick.</h3>
                </div>
                <MarketingScreenshot name="invoices" />
              </article>
            </div>
            <div className="v822-scenes-link">
              <Link href="/features">Funktionen <span>→</span></Link>
            </div>
          </div>
        </section>

        <section className="v822-trust" aria-labelledby="trust-title">
          <div className="v816-inner">
            <div className="v822-section-heading v822-section-heading-compact">
              <span className="v80-eyebrow">Sicherheit</span>
              <h2 id="trust-title">Zugriff passend zur Aufgabe.</h2>
              <p>Berechtigungen werden serverseitig und nachvollziehbar gesteuert.</p>
            </div>
            <div className="v822-trust-grid">
              <div><strong>Schweiz</strong><span>Für Schweizer Dienstleistungsunternehmen</span></div>
              <div><strong>Datenschutz</strong><span>Datenzugriff</span></div>
              <div><strong>Desktop, Mobile und PWA</strong><span>Tenant-Kontext</span></div>
            </div>
          </div>
        </section>

        <section className="v822-final">
          <div className="v816-inner">
            <div className="v816-price-cta v820-final-cta v822-final-cta">
              <div>
                <span className="v80-eyebrow">Bereit zum Start?</span>
                <h2>Binso One in Ruhe ausprobieren.</h2>
                <p>Starte kostenlos oder sieh dir zuerst die Produktdemo mit Beispieldaten an.</p>
              </div>
              <div className="v816-actions">
                <Link className="v816-button v816-button-primary" href="/register?mode=trial">30 Tage kostenlos testen →</Link>
                <Link className="v816-button v816-button-secondary" href="/pricing">Preise</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </PublicShell>
  )
}
