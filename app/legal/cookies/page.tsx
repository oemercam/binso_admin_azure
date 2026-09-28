import { publicMetadata } from '@/lib/config/seo'
import { LegalPage } from '@/components/public/legal-page'
import { LEGAL_VERSION } from '@/lib/legal/legal-config'

export const metadata = publicMetadata({ title: 'Cookies', description: 'Informationen zu Cookies und Browser-Speicherung bei Binso One.', path: '/legal/cookies' })

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie- und Speicher-Richtlinie" description={`Cookies und vergleichbare Browser-Speicherung bei Binso One. Stand: ${LEGAL_VERSION}.`}>
      <h2>Technisch notwendige Speicherung</h2>
      <p>Binso One verwendet technisch notwendige Cookies oder vergleichbare Mechanismen, soweit sie für Anmeldung, Session, Sicherheit und den zuverlässigen Betrieb erforderlich sind. Cookies des eingesetzten Identitätsdienstes werden durch dessen technische Konfiguration bestimmt.</p>
      <h2>Lokaler Browser-Speicher</h2>
      <p>Binso One verwendet lokalen Browser-Speicher unter anderem für Darstellungspräferenzen wie das Theme, die installierte PWA bzw. Build-Erkennung, Cookie-Präferenzen und – in lokalen Entwicklungs- oder Demo-Szenarien – Produktzustände. Session-Speicher kann beispielsweise für die Wiederherstellung der Scrollposition verwendet werden. Diese Speicherungen dienen nicht dazu, ein Werbeprofil zu erstellen.</p>
      <h2>Optionale Statistik</h2>
      <p>Die öffentliche Website enthält eine Einstellung für optionale Statistik. Im Standardzustand ist diese Funktion deaktiviert. Erst wenn eine solche Statistikfunktion produktiv eingerichtet und durch die nutzende Person entsprechend ausgewählt wurde, darf sie aktiviert werden.</p>
      <h2>Cookie-Einstellungen</h2>
      <p>Die Auswahl für optionale Funktionen kann über „Cookie-Einstellungen“ im Footer erneut geöffnet und geändert werden. Technisch notwendige Funktionen können nicht deaktiviert werden, wenn dadurch Anmeldung, Sicherheit oder Kernfunktionen der Anwendung nicht mehr funktionieren würden.</p>
      <h2>Browser-Einstellungen</h2>
      <p>Cookies und Website-Daten können zusätzlich über die Funktionen des verwendeten Browsers gelöscht oder eingeschränkt werden. Dadurch können gespeicherte Einstellungen verloren gehen oder einzelne Funktionen eingeschränkt sein.</p>
    </LegalPage>
  )
}
