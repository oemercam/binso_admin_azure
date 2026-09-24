import Link from 'next/link'
import { planDefinitions } from '@/lib/data/plans'
import { PublicCta, PublicShell } from '@/components/public/public-shell'
import {
  BusinessFlowVisual,
  DashboardProductVisual,
  FeatureStoryVisual,
  LandingProofVisual,
  OnboardingVisual,
} from '@/components/public/product-visuals'

export default function HomePage() {
  const highlightedPlans = planDefinitions.filter((plan) => ['starter', 'business', 'professional'].includes(plan.id))

  return (
    <PublicShell>
      <main className="public-main public-landing-v703">
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <span className="public-eyebrow">Die Business-Plattform für Dienstleistungsunternehmen</span>
            <h1>Dein Unternehmen.<br />Eine Plattform.</h1>
            <p>Binso One verbindet Kunden, Angebote, Aufträge, Zeiterfassung, Rechnungen, Mitarbeitende und Finanzen in einem durchgängigen Arbeitsablauf.</p>
            <div className="landing-hero-actions">
              <Link className="button primary" href="/register">Kostenlos starten</Link>
              <Link className="button secondary" href="/features">Funktionen ansehen</Link>
            </div>
            <div className="landing-hero-meta" aria-label="Vorteile beim Einstieg">
              <span>14 Tage testen</span>
              <span>Keine Zahlung bei der Registrierung</span>
              <span>Für Desktop, Mobile und PWA</span>
            </div>
          </div>
          <DashboardProductVisual />
        </section>

        <section className="landing-statement">
          <span>Einfach. Übersichtlich. Durchgängig.</span>
          <h2>Weniger Administration.<br />Mehr Zeit fürs Geschäft.</h2>
          <p>Wichtige Informationen bleiben dort, wo sie gebraucht werden. Aus einer Anfrage wird ein Angebot, aus dem Angebot ein Auftrag und aus erfassten Leistungen eine Rechnung.</p>
        </section>

        <section className="landing-showcase" aria-labelledby="landing-showcase-title">
          <div className="landing-showcase-copy">
            <span>Alles im Blick</span>
            <h2 id="landing-showcase-title">Eine Oberfläche für den täglichen Betrieb.</h2>
            <p>Dashboard, Kunden, Aufträge, Zeiten und Finanzen greifen ineinander. So musst du Informationen nicht in mehreren Werkzeugen zusammensuchen.</p>
            <Link href="/features">Funktionen im Detail →</Link>
          </div>
          <LandingProofVisual />
        </section>

        <section className="landing-feature-stories" id="funktionen">
          <div className="public-section-head centered">
            <span>Die wichtigsten Bereiche</span>
            <h2>Von der Kundenanfrage bis zur Zahlung.</h2>
            <p>Binso One bildet die zentralen Abläufe eines Dienstleistungsunternehmens in einer gemeinsamen Arbeitsumgebung ab.</p>
          </div>
          <FeatureStoryVisual />
        </section>

        <section className="landing-flow-section">
          <div className="public-section-head centered">
            <span>Ein durchgängiger Prozess</span>
            <h2>Arbeitsschritte bauen aufeinander auf.</h2>
            <p>Daten werden weitergeführt statt doppelt erfasst. Das macht Abläufe nachvollziehbar und reduziert unnötige Handarbeit.</p>
          </div>
          <BusinessFlowVisual />
        </section>

        <section className="landing-onboarding-section">
          <div className="landing-onboarding-copy">
            <span>Einfach starten</span>
            <h2>Kein langes Einrichtungsprojekt.</h2>
            <p>Registrieren, Unternehmen einrichten und direkt mit dem ersten Kunden starten. Die wichtigsten Schritte führen dich strukturiert in Binso One ein.</p>
            <Link href="/how-it-works">So funktioniert Binso One →</Link>
          </div>
          <OnboardingVisual />
        </section>

        <section className="public-section public-trust landing-trust">
          <div className="public-section-head centered"><span>Sicherheit und Betrieb</span><h2>Für Geschäftsdaten entwickelt.</h2></div>
          <div className="public-trust-grid">
            <article><strong>Getrennte Organisationen</strong><p>Daten und Berechtigungen werden je Unternehmen getrennt verwaltet.</p></article>
            <article><strong>Sichere Anmeldung</strong><p>Die Anmeldung wird über eine Microsoft-basierte Identitätslösung abgesichert.</p></article>
            <article><strong>Klare Zugriffsrechte</strong><p>Rollen und Zugriffe werden zentral gesteuert und nachvollziehbar verwaltet.</p></article>
          </div>
          <Link href="/security">Mehr zu Sicherheit und Datenschutz →</Link>
        </section>

        <section className="public-section landing-pricing">
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

        <section className="public-section public-faq-preview landing-faq">
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
