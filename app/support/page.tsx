import Link from 'next/link'
import { PublicPageIntro, PublicShell } from '@/components/public/public-shell'
import { appIdentity } from '@/lib/config/app-identity'

export default function SupportPage() {
  return (
    <PublicShell>
      <main className="public-main public-main-narrow">
        <PublicPageIntro eyebrow="Support" title="Hilfe, wenn du sie brauchst." description="Wähle den passenden Einstieg für Fragen zur Nutzung, Anmeldung, Abrechnung oder einem technischen Problem." />
        <section className="public-support-grid">
          <article><span>01</span><h2>Fragen zur Nutzung</h2><p>Für allgemeine Fragen zu Funktionen und Abläufen findest du die wichtigsten Antworten direkt im FAQ.</p><Link href="/faq">FAQ öffnen →</Link></article>
          <article><span>02</span><h2>Technischer Support</h2><p>Wenn eine Funktion nicht wie erwartet arbeitet, sende uns eine kurze Beschreibung mit dem betroffenen Bereich.</p><a href={`mailto:${appIdentity.supportEmail}?subject=Binso%20One%20Support`}>Support kontaktieren →</a></article>
          <article><span>03</span><h2>Abrechnung und Abo</h2><p>Bei Fragen zu Plan, Rechnung oder Zahlungsstatus kannst du uns ebenfalls direkt kontaktieren.</p><a href={`mailto:${appIdentity.supportEmail}?subject=Binso%20One%20Abrechnung`}>Abrechnung kontaktieren →</a></article>
        </section>
        <section className="public-support-note"><strong>Für eine schnelle Bearbeitung</strong><p>Nenne möglichst deine Organisation, den betroffenen Bereich und was du unmittelbar vor dem Problem gemacht hast. Keine Passwörter oder Zugangsdaten senden.</p></section>
      </main>
    </PublicShell>
  )
}
