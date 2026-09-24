import { LegalPage } from '@/components/public/legal-page'
import { createPublicMetadata } from '@/lib/config/seo'

export const metadata = createPublicMetadata({
  title: 'Cookie-Richtlinie',
  description: 'Informationen zu Cookies und vergleichbaren Speichermechanismen bei Binso One.',
  path: '/legal/cookies',
  keywords: ['Binso One Cookies'],
})

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie-Richtlinie" description="Wie Binso One Cookies und vergleichbare Speichermechanismen verwendet. Stand: 24. September 2026.">
      <h2>Technisch notwendige Funktionen</h2>
      <p>Binso One benötigt technische Mechanismen für Anmeldung, Session, Sicherheit und Einstellungen. Diese Funktionen sind erforderlich, damit die Anwendung zuverlässig und sicher betrieben werden kann.</p>
      <h2>Lokale Einstellungen</h2>
      <p>Bestimmte Einstellungen, beispielsweise Darstellungs- oder Cookie-Präferenzen, können lokal im Browser gespeichert werden. Diese Speicherung dient nicht automatisch der Erstellung eines personenbezogenen Nutzungsprofils.</p>
      <h2>Anmeldung</h2>
      <p>Der eingesetzte Microsoft-basierte Identitätsdienst kann während Anmeldung und Session eigene technisch notwendige Cookies setzen. Art und Dauer können sich nach der jeweiligen Identity-Konfiguration richten.</p>
      <h2>Statistik</h2>
      <p>Die öffentliche Cookie-Auswahl enthält eine Kategorie für optionale Statistikfunktionen. Im aktuellen Produktstand ist keine solche Statistikfunktion aktiviert. Wird später eine optionale Analysefunktion eingeführt, soll sie erst nach entsprechender Auswahl aktiviert werden.</p>
      <h2>Einstellungen ändern</h2>
      <p>Die Cookie-Auswahl kann über „Cookie-Einstellungen“ im Footer erneut geöffnet werden. Browser bieten zusätzlich eigene Funktionen zum Löschen gespeicherter Cookies und Website-Daten.</p>
    </LegalPage>
  )
}
