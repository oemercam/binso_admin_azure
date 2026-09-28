import { publicMetadata } from '@/lib/config/seo'
import { LegalPage } from '@/components/public/legal-page'
import { LEGAL_VERSION, legalCompany, legalProviders } from '@/lib/legal/legal-config'

export const metadata = publicMetadata({ title: 'Datenschutz', description: 'Datenschutzhinweise von Binso One und Binso GmbH.', path: '/legal/privacy' })

export default function PrivacyPage() {
  return (
    <LegalPage title="Datenschutzerklärung" description={`Informationen zur Bearbeitung personenbezogener Daten im Zusammenhang mit Binso One. Stand: ${LEGAL_VERSION}.`}>
      <h2>1. Verantwortliche Stelle</h2>
      <p>{legalCompany.legalName}, {legalCompany.address}. E-Mail: <a href={`mailto:${legalCompany.email}`}>{legalCompany.email}</a>, Telefon: <a href={legalCompany.phoneHref}>{legalCompany.phoneDisplay}</a>.</p>
      <p>Für Personendaten, welche Geschäftskunden in Binso One über ihre eigenen Kunden, Mitarbeitenden, Lieferanten oder sonstigen Personen erfassen, ist grundsätzlich der jeweilige Geschäftskunde Verantwortlicher. Binso GmbH bearbeitet solche Daten im Rahmen der vereinbarten Leistungen als Auftragsbearbeiterin. Die Einzelheiten sind in der <a href="/legal/dpa">Auftragsbearbeitungsvereinbarung</a> geregelt.</p>

      <h2>2. Welche Daten wir bearbeiten</h2>
      <p>Je nach Nutzung bearbeiten wir insbesondere Konto- und Kontaktdaten, Firmen- und Organisationsdaten, Rollen und Berechtigungen, Registrierungs- und Abonnementdaten, Kunden-, Lieferanten-, Mitarbeitenden-, Offert-, Auftrags-, Zeit-, Rechnungs- und Dokumentdaten, Support- und Kommunikationsinhalte sowie technische Protokoll-, Geräte-, Browser-, Sicherheits- und Fehlerdaten.</p>

      <h2>3. Herkunft der Daten</h2>
      <p>Wir erhalten Daten direkt von Nutzenden und Geschäftskunden, aus den von ihnen in Binso One erfassten Geschäftsdaten, von angebundenen Identitäts- und Zahlungsdiensten sowie aus technischen Betriebs- und Sicherheitsprotokollen. Werden Daten über Drittpersonen durch einen Geschäftskunden erfasst, ist dieser für die erforderliche Information und die Rechtmässigkeit der Erfassung verantwortlich.</p>

      <h2>4. Zwecke der Bearbeitung</h2>
      <p>Wir bearbeiten Personendaten zur Bereitstellung und Weiterentwicklung von Binso One, zur Registrierung und Authentisierung, zur Verwaltung von Organisationen, Rollen und Berechtigungen, zur Ausführung der vom Kunden genutzten Geschäftsprozesse, für Support und Kommunikation, Abonnement- und Zahlungsabwicklung, Systemsicherheit, Missbrauchs- und Betrugsprävention, Fehleranalyse, Betrieb, Nachweis- und Auditfunktionen sowie zur Erfüllung gesetzlicher Pflichten.</p>

      <h2>5. Anmeldung und Benutzerkonto</h2>
      <p>In der produktiven Azure-Umgebung erfolgt die Authentisierung über Azure App Service Authentication mit einer konfigurierten Identitätsplattform. Welche Anmeldeart angeboten wird, hängt von der produktiven Konfiguration ab. Binso One erhält dabei insbesondere eine technische Benutzerkennung, Name, E-Mail-Adresse und gegebenenfalls Rollen- oder Berechtigungsinformationen. Passwörter des externen Identitätsdienstes werden nicht in Binso One gespeichert.</p>

      <h2>6. Hosting, Datenbank und Betrieb</h2>
      <p>Binso One wird auf Microsoft Azure betrieben und verwendet serverseitige Datenbanken für Konto-, Organisations-, Geschäfts-, Abonnement-, Audit- und Betriebsdaten. Die produktive Azure-Region wird durch Binso GmbH festgelegt. Technische Betriebsdaten können für Sicherheit, Diagnose und Fehlerbehebung verarbeitet werden.</p>

      <h2>7. Zahlungen und Abonnemente</h2>
      <p>Für kostenpflichtige Self-Service-Abonnemente kann Stripe eingesetzt werden. Binso One übermittelt dabei die für Checkout und Abonnementverwaltung erforderlichen Angaben, insbesondere Organisationsreferenz, E-Mail-Adresse des Abonnementinhabers, gewählten Plan sowie technische Abonnementreferenzen. Zahlungsinstrumente wie Kartendaten werden im Stripe-Checkout durch Stripe und nicht durch Binso One erfasst. Binso One speichert Zahlungs- und Abonnementstatus sowie technische Stripe-Referenzen.</p>

      <h2>8. E-Mail-Versand</h2>
      <p>Sofern der E-Mail-Versand aktiviert ist, verwendet Binso One Microsoft Graph. Dabei werden die für den Versand erforderlichen Empfängeradressen, Betreffzeilen, Nachrichteninhalte und gegebenenfalls erzeugte Dokumentanhänge an Microsoft übermittelt. Der Versand kann unter anderem Einladungen, Geschäftsdokumente und systembezogene Nachrichten betreffen.</p>

      <h2>9. Cookies und lokale Speicherung</h2>
      <p>Technisch notwendige Cookies und vergleichbare Browser-Speicher können für Authentisierung, Session, Sicherheit, Darstellung, PWA-Betrieb, Navigation und Einstellungen verwendet werden. Auf der öffentlichen Website ist optionale Statistik standardmässig deaktiviert und wird nur aktiviert, wenn sie technisch eingerichtet und entsprechend ausgewählt wurde. Weitere Angaben enthält die <a href="/legal/cookies">Cookie-Richtlinie</a>.</p>

      <h2>10. Empfänger und Unterauftragsbearbeiter</h2>
      <p>Personendaten werden nur an Empfänger weitergegeben, wenn dies für die Bereitstellung, Vertragserfüllung, Abrechnung, Sicherheit, Support oder aufgrund gesetzlicher Pflichten erforderlich ist. Zu den eingesetzten bzw. je nach Funktion möglichen Unterauftragsbearbeitern gehören insbesondere Microsoft und Stripe. Die aktuelle Übersicht ist unter <a href="/legal/subprocessors">Unterauftragsbearbeiter</a> veröffentlicht.</p>

      <h2>11. Bekanntgabe ins Ausland</h2>
      <p>Bei global tätigen Technologie- und Zahlungsdienstleistern kann eine Bearbeitung ausserhalb der Schweiz stattfinden. Die jeweils betroffenen Länder bzw. Ländergruppen sind in der Unterauftragsbearbeiter-Liste beschrieben. Liegt für einen Empfängerstaat kein vom Bundesrat anerkanntes angemessenes Datenschutzniveau vor, stützen wir die Bekanntgabe insbesondere auf anerkannte Standarddatenschutzklauseln oder andere nach dem Schweizer Datenschutzrecht zulässige Garantien bzw. Ausnahmen.</p>

      <h2>12. Aufbewahrung und Löschung</h2>
      <p>Wir bewahren Personendaten nur so lange auf, wie dies für den jeweiligen Zweck, den Vertrag, die Systemsicherheit, Nachweisinteressen oder gesetzliche Pflichten erforderlich ist. Vertrags- und abrechnungsrelevante Geschäftsunterlagen werden grundsätzlich während der gesetzlichen Aufbewahrungsdauer von zehn Jahren aufbewahrt, soweit eine solche Pflicht anwendbar ist. Sicherheits- und Auditdaten werden so lange gespeichert, wie sie für Nachweis, Missbrauchsprävention und Betrieb erforderlich sind. Für Löschanfragen einer Organisation sieht Binso One einen geregelten Daten-Lifecycle mit einer vorgesehenen Karenz von 30 Tagen vor; gesetzlich oder vertraglich aufzubewahrende Daten werden davon ausgenommen und anschliessend zweckgebunden gesperrt bzw. weiter aufbewahrt.</p>

      <h2>13. Datenausgabe und Vertragsende</h2>
      <p>Berechtigte Organisationsinhaber können über die in Binso One vorgesehenen Daten-Lifecycle-Funktionen eine Datenausgabe, Vertragsbeendigung oder Löschung beantragen. Umfang, Format und technische Verfügbarkeit richten sich nach den im Produkt bereitgestellten Exportfunktionen und gesetzlichen Aufbewahrungspflichten.</p>

      <h2>14. Rechte betroffener Personen</h2>
      <p>Betroffene Personen können im Rahmen des anwendbaren Datenschutzrechts insbesondere Auskunft über ihre Personendaten, Berichtigung unrichtiger Daten, Löschung soweit keine Aufbewahrungspflicht oder ein anderer zulässiger Grund entgegensteht sowie gegebenenfalls Herausgabe oder Übertragung ihrer Daten verlangen. Anfragen können an <a href={`mailto:${legalCompany.email}`}>{legalCompany.email}</a> gerichtet werden. Betrifft die Anfrage Daten, für welche ein Binso-One-Geschäftskunde verantwortlich ist, kann die Anfrage an diesen Kunden verwiesen oder in dessen Auftrag bearbeitet werden.</p>

      <h2>15. Automatisierte Einzelentscheidungen</h2>
      <p>Binso One trifft im derzeitigen Produktstand keine automatisierten Einzelentscheidungen mit rechtlichen oder ähnlich erheblichen Auswirkungen auf betroffene Personen.</p>

      <h2>16. Datensicherheit</h2>
      <p>Wir setzen angemessene technische und organisatorische Massnahmen ein, darunter rollen- und mandantenbezogene Zugriffskontrollen, serverseitige Geheimnisse, verschlüsselte Übertragung, Protokollierung sicherheitsrelevanter Vorgänge sowie technische Schutzmechanismen gegen unberechtigte Zugriffe. Kein technisches System kann einen absoluten Schutz gewährleisten.</p>

      <h2>17. Dienstleister im Überblick</h2>
      {legalProviders.map((provider) => <p key={provider.name}><strong>{provider.name}:</strong> {provider.services} {provider.countries}</p>)}

      <h2>18. Änderungen</h2>
      <p>Diese Datenschutzerklärung wird angepasst, wenn sich Funktionen, Datenbearbeitungen, Dienstleister oder rechtliche Anforderungen wesentlich ändern. Die aktuelle Fassung und ihr Stand werden auf dieser Seite veröffentlicht.</p>
    </LegalPage>
  )
}
