import Link from 'next/link'
import { planDefinitions } from '@/lib/data/plans'
import { PublicCta, PublicShell } from '@/components/public/public-shell'
import { BusinessFlowVisual, DashboardProductVisual, FeatureVisualGrid, OnboardingVisual } from '@/components/public/product-visuals'

export default function HomePage() {
  const highlightedPlans = planDefinitions.filter((plan) => ['starter', 'business', 'professional'].includes(plan.id))

  return (
    <PublicShell>
      <main className="public-main">
        <section className="public-hero public-hero-visual">
          <div className="public-hero-copy">
            <span className="public-eyebrow">Business-Plattform für Schweizer Unternehmen</span>
            <h1>Dein Unternehmen.<br />Eine Plattform.</h1>
            <p>Kunden, Angebote, Aufträge, Zeiten, Rechnungen und Mitarbeitende in einer klaren Arbeitsumgebung verwalten.</p>
            <div className="public-hero-actions">
              <Link className="button primary" href="/register">Kostenlos starten</Link>
              <Link className="button secondary" href="/features">Funktionen ansehen</Link>
            </div>
            <small>14 Tage testen. Noch keine Zahlung bei der Registrierung.</small>
          </div>
          <DashboardProductVisual />
        </section>

        <section className="public-section public-workflow-section">
          <div className="public-section-head">
            <span>Durchgängiger Ablauf</span>
            <h2>Vom ersten Kontakt bis zur bezahlten Rechnung.</h2>
            <p>Binso One verbindet die Arbeitsschritte, die im Alltag zusammengehören. Daten werden weitergeführt statt mehrfach erfasst.</p>
          </div>
          <BusinessFlowVisual />
        </section>

        <section className="public-section" id="funktionen">
          <div className="public-section-head split">
            <div><span>Funktionen</span><h2>Alles Wichtige für den täglichen Betrieb.</h2></div>
            <Link href="/features">Alle Funktionen ansehen →</Link>
          </div>
          <FeatureVisualGrid />
        </section>

        <section className="public-section public-onboarding-section">
          <div className="public-section-head">
            <span>Einfach starten</span>
            <h2>Kein langes Einrichtungsprojekt.</h2>
            <p>Registrieren, die wichtigsten Angaben erfassen und direkt mit dem ersten Kunden loslegen.</p>
          </div>
          <OnboardingVisual />
        </section>

        <section className="public-section public-trust">
          <div className="public-section-head"><span>Sicherheit</span><h2>Geschäftsdaten gehören in eine kontrollierte Umgebung.</h2></div>
          <div className="public-trust-grid">
            <article><strong>Getrennte Organisationen</strong><p>Daten und Berechtigungen werden je Unternehmen getrennt verwaltet.</p></article>
            <article><strong>Sichere Anmeldung</strong><p>Die Anmeldung wird über eine Microsoft-basierte Identitätslösung abgesichert.</p></article>
            <article><strong>Klare Zugriffsrechte</strong><p>Rollen und Zugriffe werden zentral gesteuert und nachvollziehbar verwaltet.</p></article>
          </div>
          <Link href="/security">Mehr zu Sicherheit und Datenschutz →</Link>
        </section>

        <section className="public-section">
          <div className="public-section-head split">
            <div><span>Preise</span><h2>Ein Plan, der mit deinem Unternehmen mitwächst.</h2></div>
            <Link href="/pricing">Alle Preise vergleichen →</Link>
          </div>
          <div className="public-price-preview">
            {highlightedPlans.map((plan) => (
              <article key={plan.id} className={plan.recommended ? 'recommended' : ''}>
                <div><span>{plan.name}</span>{plan.recommended ? <small>Empfohlen</small> : null}</div>
                <strong>{plan.monthlyPriceChf ? <>CHF {plan.monthlyPriceChf}<small> / Monat</small></> : 'Individuell'}</strong>
                <p>{plan.description}</p>
                <Link className="button secondary" href={`/register?plan=${plan.id}`}>14 Tage testen</Link>
              </article>
            ))}
          </div>
        </section>

        <section className="public-section public-faq-preview">
          <div className="public-section-head"><span>Häufige Fragen</span><h2>Die wichtigsten Antworten vor dem Start.</h2></div>
          <div className="public-faq-list">
            <details><summary>Für wen ist Binso One gedacht?</summary><p>Für Dienstleistungsunternehmen und Teams, die Kunden, Angebote, Aufträge, Zeit, Rechnungen und interne Abläufe zentral verwalten möchten.</p></details>
            <details><summary>Muss ich bei der Registrierung bereits Zahlungsdaten angeben?</summary><p>Nein. Die Registrierung und der Einstieg in die Testphase erfolgen ohne sofortige Zahlung.</p></details>
            <details><summary>Kann ich Binso One auch als PWA auf dem Smartphone verwenden?</summary><p>Ja. Binso One ist für Desktop, Mobile und eine installierte PWA ausgelegt.</p></details>
          </div>
          <Link href="/faq">Alle Fragen ansehen →</Link>
        </section>

        <PublicCta />
      </main>
    </PublicShell>
  )
}
