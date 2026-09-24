import { LegalPage } from '@/components/public/legal-page'
import { appIdentity } from '@/lib/config/app-identity'

export default function PrivacyPage() {
  return (
    <LegalPage title="Datenschutzerklärung" description="Informationen zur Bearbeitung personenbezogener Daten im Zusammenhang mit Binso One. Stand: 24. September 2026.">
      <h2>1. Verantwortliche Stelle</h2>
      <p>{appIdentity.company}, {appIdentity.address.street}, {appIdentity.address.postalCode} {appIdentity.address.city}, {appIdentity.address.country}. Datenschutzanfragen können an <a href={`mailto:${appIdentity.supportEmail}`}>{appIdentity.supportEmail}</a> gerichtet werden.</p>
      <h2>2. Welche Daten wir bearbeiten</h2>
      <p>Je nach Nutzung bearbeiten wir insbesondere Konto- und Kontaktdaten, Organisations- und Geschäftsdaten, Rollen und Berechtigungen, von Nutzenden erfasste Kunden- und Auftragsdaten, Dokument- und Abrechnungsinformationen sowie technische Protokoll- und Sicherheitsdaten.</p>
      <h2>3. Zwecke der Bearbeitung</h2>
      <p>Wir bearbeiten Daten, um Binso One bereitzustellen, Benutzer zu authentisieren, Organisationen und Berechtigungen zu verwalten, Geschäftsprozesse auszuführen, Support zu leisten, Abonnemente abzurechnen, Missbrauch zu verhindern, den Betrieb zu sichern und gesetzliche Pflichten zu erfüllen.</p>
      <h2>4. Anmeldung</h2>
      <p>Die produktive Anmeldung wird über Azure App Service Authentication und eine konfigurierte Microsoft-Identitätsplattform abgewickelt. Binso One speichert keine Benutzerpasswörter. Der Identitätsdienst kann eigene Cookies und technische Informationen verarbeiten.</p>
      <h2>5. Hosting und Infrastruktur</h2>
      <p>Binso One wird auf Microsoft Azure betrieben. Dabei können Daten auf von Microsoft bereitgestellten Infrastruktur- und Datenbankdiensten verarbeitet werden. Die konkrete Region und Konfiguration richtet sich nach der produktiven Bereitstellung.</p>
      <h2>6. Zahlungen</h2>
      <p>Für kostenpflichtige Abonnemente kann Stripe als Zahlungs- und Abrechnungsdienst eingesetzt werden. Binso One verarbeitet dabei insbesondere technische Referenzen zu Kunde, Abonnement, Plan und Zahlungsstatus. Zahlungsdaten können direkt durch Stripe verarbeitet werden.</p>
      <h2>7. E-Mail und Microsoft Graph</h2>
      <p>Für bestimmte geschäftliche E-Mail-Funktionen kann Microsoft Graph eingesetzt werden. Dabei werden die für den Versand erforderlichen Empfänger-, Betreff-, Inhalts- und Dokumentinformationen verarbeitet.</p>
      <h2>8. Cookies und lokale Speicherung</h2>
      <p>Technisch notwendige Cookies oder vergleichbare Speichermechanismen können für Anmeldung, Session, Sicherheit, Darstellung und Einstellungen eingesetzt werden. Details und Auswahlmöglichkeiten findest du in der Cookie-Richtlinie.</p>
      <h2>9. Empfänger und Auftragsbearbeiter</h2>
      <p>Daten werden nur an Dienstleister oder Empfänger weitergegeben, soweit dies für den Betrieb, die Vertragserfüllung, die Abrechnung, den Support oder aufgrund gesetzlicher Pflichten erforderlich ist. Dazu können insbesondere Microsoft und Stripe gehören.</p>
      <h2>10. Auslandbearbeitung</h2>
      <p>Bei global tätigen Dienstleistern kann eine Bearbeitung ausserhalb der Schweiz nicht vollständig ausgeschlossen werden. Soweit erforderlich, werden geeignete vertragliche oder gesetzlich vorgesehene Schutzmechanismen eingesetzt.</p>
      <h2>11. Aufbewahrung</h2>
      <p>Wir speichern personenbezogene Daten nur so lange, wie dies für die jeweiligen Zwecke, vertragliche Verpflichtungen, die Systemsicherheit oder gesetzliche Aufbewahrungspflichten erforderlich ist. Geschäftsdaten können je nach Inhalt längeren gesetzlichen Aufbewahrungsfristen unterliegen.</p>
      <h2>12. Rechte betroffener Personen</h2>
      <p>Betroffene Personen können im Rahmen des anwendbaren Datenschutzrechts insbesondere Auskunft, Berichtigung und – soweit zulässig – Löschung oder Herausgabe ihrer personenbezogenen Daten verlangen. Anfragen können an die oben genannte Kontaktadresse gerichtet werden.</p>
      <h2>13. Sicherheit</h2>
      <p>Wir treffen angemessene technische und organisatorische Massnahmen zum Schutz der Daten. Dazu gehören unter anderem rollenbasierte Zugriffe, getrennte Organisationen, serverseitige Geheimnisse und verschlüsselte Verbindungen. Ein absoluter Schutz kann technisch nicht garantiert werden.</p>
      <h2>14. Änderungen</h2>
      <p>Diese Datenschutzerklärung kann angepasst werden, wenn sich Funktionen, Dienstleister oder rechtliche Anforderungen ändern. Die jeweils aktuelle Fassung wird auf dieser Seite veröffentlicht.</p>
    </LegalPage>
  )
}
