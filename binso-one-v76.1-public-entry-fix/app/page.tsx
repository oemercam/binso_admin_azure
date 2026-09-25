import Link from 'next/link'
import { publicMetadata } from '@/lib/config/seo'
import { planDefinitions } from '@/lib/data/plans'
import { marketingFaq, marketingFeatures, marketingFlow, publicValuePoints } from '@/lib/config/marketing-content'
import { PublicCta, PublicShell } from '@/components/public/public-shell'
import { SwipeCarousel } from '@/components/public/swipe-carousel'
import { DashboardProductVisual } from '@/components/public/product-visuals'
import { MarketingDashboardScreenshot } from '@/components/public/marketing-screenshot'

export const metadata = publicMetadata({
  title: 'Binso One',
  description: 'Kunden, Angebote, Aufträge, Zeiterfassung und Rechnungen in einer klaren Plattform für Schweizer Dienstleistungsunternehmen.',
  path: '/',
})

export default function HomePage() {
  const highlightedPlans = planDefinitions.filter((plan) => ['starter', 'business', 'professional'].includes(plan.id))

  return (
    <PublicShell light>
      <main className="public-main public-landing-v76">
        <section className="landing-v76-hero">
          <div className="landing-v76-copy">
            <span className="public-eyebrow">Binso One für Schweizer Dienstleistungsunternehmen</span>
            <h1>Kunden. Aufträge. Rechnungen.<br /><em>Ein klarer Ablauf.</em></h1>
            <p>Binso One verbindet Kunden, Angebote, Aufträge, Zeiterfassung und Rechnungen. So bleibt der Arbeitsalltag übersichtlich, ohne Informationen mehrfach zu erfassen.</p>
            <div className="landing-v76-actions">
              <Link className="button primary" href="/register">14 Tage kostenlos testen</Link>
              <Link className="button secondary" href="/how-it-works">So funktioniert es</Link>
            </div>
            <div className="landing-v76-proof" aria-label="Vorteile beim Einstieg">
              {publicValuePoints.map((item) => <span key={item}>{item}</span>)}
            </div>
          </div>
          <div className="landing-v76-product" data-marketing-shot="hero-product">
            <DashboardProductVisual />
            <div className="landing-v76-product-note"><span>Echte Anwendung</span><strong>Desktop und Mobile</strong></div>
          </div>
        </section>

        <section className="landing-v76-valuebar" aria-label="Binso One im Überblick">
          <strong>Vom ersten Kundenkontakt bis zur Rechnung.</strong>
          <span>Weniger Wechsel zwischen Werkzeugen.</span>
          <span>Klare nächste Schritte.</span>
          <span>Daten einmal erfassen.</span>
        </section>

        <section className="landing-v76-product-proof">
          <div className="landing-v76-section-copy">
            <span className="public-eyebrow">Arbeitsalltag</span>
            <h2>Alles Wichtige an einem Ort.</h2>
            <p>Du siehst, was offen ist, woran gearbeitet wird und was bereits verrechnet wurde. Binso One führt die Informationen aus den einzelnen Arbeitsschritten zusammen.</p>
            <Link href="/features">Alle Funktionen ansehen →</Link>
          </div>
          <div className="landing-v76-proof-window" data-marketing-shot="dashboard">
            <MarketingDashboardScreenshot />
          </div>
        </section>

        <section className="landing-v76-features" id="funktionen">
          <div className="landing-v76-section-head">
            <span className="public-eyebrow">Funktionen</span>
            <h2>Die Werkzeuge, die du im Alltag wirklich brauchst.</h2>
            <p>Klare Begriffe, kurze Wege und zusammenhängende Abläufe.</p>
          </div>
          <div className="landing-v76-feature-grid">
            {marketingFeatures.map((feature, index) => (
              <article key={feature.id}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <strong>{feature.benefit}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-v76-flow">
          <div className="landing-v76-section-head centered">
            <span className="public-eyebrow">Durchgängiger Ablauf</span>
            <h2>Ein Schritt baut auf dem nächsten auf.</h2>
            <p>Der Prozess bleibt verständlich, weil bereits erfasste Informationen weiterverwendet werden.</p>
          </div>
          <div className="landing-v76-flow-list">
            {marketingFlow.map(([number, title, description]) => (
              <article key={number}>
                <b>{number}</b>
                <div><strong>{title}</strong><span>{description}</span></div>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-v76-onboarding">
          <div>
            <span className="public-eyebrow">Einrichtung</span>
            <h2>Nur das Nötigste. Danach kannst du loslegen.</h2>
            <p>Die Einrichtung führt dich durch wenige kurze Schritte. Bereits bekannte Angaben sind vorausgefüllt. Alles Weitere kannst du später ergänzen.</p>
            <ul>
              <li>Keine lange Checkliste</li>
              <li>Fortschritt jederzeit sichtbar</li>
              <li>Zurückgehen ohne Datenverlust</li>
              <li>Einstellungen später änderbar</li>
            </ul>
            <Link href="/register">Konto erstellen →</Link>
          </div>
          <div className="landing-v76-onboarding-card" aria-label="Beispiel für die Einrichtung">
            <header><span>Einrichtung</span><strong>Schritt 1 von 3</strong></header>
            <i><b /></i>
            <div className="landing-v76-onboarding-fields">
              <label><span>Unternehmen</span><strong>Beispiel GmbH</strong></label>
              <label><span>Kontakt</span><strong>Max Muster</strong></label>
              <label><span>Geschäftliche E-Mail</span><strong>max@beispiel.ch</strong></label>
            </div>
            <footer><span>Du kannst diese Angaben später ändern.</span><b>Weiter</b></footer>
          </div>
        </section>

        <section className="landing-v76-security">
          <div className="landing-v76-section-copy">
            <span className="public-eyebrow">Sicherheit</span>
            <h2>Geschäftsdaten gehören in eine klar getrennte Umgebung.</h2>
            <p>Organisationen werden voneinander getrennt. Anmeldung, Mitgliedschaften und Rollen steuern den Zugriff. Relevante Plattformaktionen bleiben nachvollziehbar.</p>
            <Link href="/security">Mehr zur Sicherheit →</Link>
          </div>
          <div className="landing-v76-security-list">
            <article><span>01</span><div><strong>Mandantentrennung</strong><p>Datenzugriffe werden einer Organisation zugeordnet und serverseitig geprüft.</p></div></article>
            <article><span>02</span><div><strong>Anmeldung und Rollen</strong><p>Identität, Mitgliedschaft und Berechtigung greifen zusammen.</p></div></article>
            <article><span>03</span><div><strong>Nachvollziehbarer Betrieb</strong><p>Wichtige Aktionen und Plattformzugriffe können protokolliert werden.</p></div></article>
          </div>
        </section>

        <section className="public-section landing-pricing landing-v76-pricing">
          <div className="public-section-head split">
            <div><span>Preise</span><h2>Einfach starten und später wechseln.</h2></div>
            <Link href="/pricing">Alle Preise vergleichen →</Link>
          </div>
          <SwipeCarousel className="public-price-preview" count={highlightedPlans.length}>
            {highlightedPlans.map((plan) => (
              <article key={plan.id} className={plan.recommended ? 'recommended' : ''}>
                <div><span>{plan.name}</span>{plan.recommended ? <small>Empfohlen</small> : null}</div>
                <strong>{plan.monthlyPriceChf ? <>CHF {plan.monthlyPriceChf}<small> / Monat</small></> : 'Individuell'}</strong>
                <p>{plan.description}</p>
                <Link className="button secondary" href={`/register?plan=${plan.id}`}>14 Tage testen</Link>
              </article>
            ))}
          </SwipeCarousel>
        </section>

        <section className="public-section landing-v76-faq">
          <div className="public-section-head"><span>Häufige Fragen</span><h2>Die wichtigsten Antworten vor dem Start.</h2></div>
          <div className="public-faq-list">
            {marketingFaq.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}
          </div>
          <Link className="landing-v76-more-link" href="/faq">Alle Fragen ansehen →</Link>
        </section>

        <PublicCta />
      </main>
    </PublicShell>
  )
}
