import Link from 'next/link'
import { planDefinitions } from '@/lib/data/plans'
import { PublicCta, PublicShell } from '@/components/public/public-shell'

const modules = [
  ['Kunden', 'Kontakte und Firmen an einem Ort verwalten.'],
  ['Angebote', 'Angebote schnell erstellen und sauber weiterführen.'],
  ['Aufträge', 'Arbeit, Zuständigkeiten und Status übersichtlich organisieren.'],
  ['Zeiterfassung', 'Arbeitszeit direkt auf Kunden und Aufträge erfassen.'],
  ['Rechnungen', 'Leistungen übernehmen, Rechnungen erstellen und nachverfolgen.'],
  ['Mitarbeitende', 'Teams, Rollen und Zugriffe zentral verwalten.'],
  ['Verträge', 'Verträge, Laufzeiten und wiederkehrende Abläufe im Blick behalten.'],
  ['Finanzen', 'Offene Beträge und wichtige Kennzahlen kompakt überblicken.'],
]

const workflow = ['Kunde', 'Angebot', 'Auftrag', 'Zeit und Leistung', 'Rechnung', 'Zahlung']

export default function HomePage() {
  const highlightedPlans = planDefinitions.filter((plan) => ['starter', 'business', 'professional'].includes(plan.id))
  return (
    <PublicShell>
      <main className="public-main">
        <section className="public-hero">
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
          <div className="public-hero-preview" aria-label="Beispielhafter Ablauf in Binso One">
            <div className="preview-window-head"><span /><span /><span /></div>
            <div className="preview-window-body">
              <div className="preview-sidebar"><b>One</b><i /><i /><i /><i /><i /></div>
              <div className="preview-content">
                <span>Übersicht</span>
                <strong>Heute im Fokus</strong>
                <div className="preview-metrics"><i /><i /><i /></div>
                <div className="preview-lines"><i /><i /><i /><i /></div>
              </div>
            </div>
          </div>
        </section>

        <section className="public-section public-workflow-section">
          <div className="public-section-head">
            <span>Durchgängiger Ablauf</span>
            <h2>Vom ersten Kontakt bis zur bezahlten Rechnung.</h2>
            <p>Binso One verbindet die Arbeitsschritte, die im Alltag zusammengehören.</p>
          </div>
          <div className="public-workflow">
            {workflow.map((item, index) => <div key={item}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item}</strong></div>)}
          </div>
        </section>

        <section className="public-section" id="funktionen">
          <div className="public-section-head split">
            <div><span>Funktionen</span><h2>Alles Wichtige für den täglichen Betrieb.</h2></div>
            <Link href="/features">Alle Funktionen ansehen →</Link>
          </div>
          <div className="public-module-grid">
            {modules.map(([title, text]) => <article key={title}><span>{title}</span><p>{text}</p></article>)}
          </div>
        </section>

        <section className="public-section public-two-column">
          <div className="public-section-head">
            <span>Einfach starten</span>
            <h2>Kein langes Einrichtungsprojekt.</h2>
            <p>Registrieren, Unternehmen einrichten und direkt mit den ersten echten Geschäftsdaten arbeiten.</p>
          </div>
          <div className="public-steps">
            <div><b>01</b><strong>Konto erstellen</strong><p>Mit deiner geschäftlichen E-Mail sicher anmelden.</p></div>
            <div><b>02</b><strong>Unternehmen einrichten</strong><p>Nur die Angaben erfassen, die für den Start benötigt werden.</p></div>
            <div><b>03</b><strong>Direkt arbeiten</strong><p>Ersten Kunden anlegen und den Geschäftsablauf starten.</p></div>
          </div>
        </section>

        <section className="public-section public-trust">
          <div className="public-section-head"><span>Sicherheit</span><h2>Geschäftsdaten gehören in eine kontrollierte Umgebung.</h2></div>
          <div className="public-trust-grid">
            <article><strong>Mandantentrennung</strong><p>Organisationen und Berechtigungen werden getrennt verwaltet.</p></article>
            <article><strong>Sichere Anmeldung</strong><p>Identität und Anmeldung werden über Microsoft-basierte Authentisierung abgesichert.</p></article>
            <article><strong>Nachvollziehbare Prozesse</strong><p>Rollen, Zugriffe und kritische Vorgänge werden bewusst gesteuert.</p></article>
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
