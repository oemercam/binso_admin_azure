import { publicMetadata } from '@/lib/config/seo'
import { LegalPage } from '@/components/public/legal-page'
import { DPA_VERSION, legalCompany } from '@/lib/legal/legal-config'

export const metadata = publicMetadata({ title: 'Auftragsbearbeitung', description: 'Auftragsbearbeitungsvereinbarung für Binso One.', path: '/legal/dpa' })

export default function DpaPage() {
  return (
    <LegalPage title="Auftragsbearbeitungsvereinbarung" description={`AVV für Geschäftskunden von Binso One. Version: ${DPA_VERSION}.`}>
      <h2>1. Gegenstand und Geltung</h2>
      <p>Diese Auftragsbearbeitungsvereinbarung gilt ergänzend zu den AGB, soweit {legalCompany.legalName} im Rahmen von Binso One Personendaten im Auftrag eines Geschäftskunden bearbeitet. Der Geschäftskunde ist Verantwortlicher, Binso GmbH Auftragsbearbeiterin. Abweichende individuelle Vereinbarungen gehen dieser Standard-AVV vor.</p>
      <h2>2. Gegenstand, Dauer und Zweck</h2>
      <p>Gegenstand der Bearbeitung ist die technische Bereitstellung von Binso One einschliesslich Hosting, Speicherung, Anzeige, Bearbeitung, Übermittlung im Auftrag des Kunden, Sicherung, Support, Fehlerbehebung und Daten-Lifecycle. Die Bearbeitung dauert grundsätzlich für die Laufzeit des jeweiligen Vertrags und eine technisch oder rechtlich erforderliche Nachlaufzeit.</p>
      <h2>3. Datenarten und betroffene Personen</h2>
      <p>Je nach Nutzung können insbesondere Stamm-, Kontakt-, Kommunikations-, Vertrags-, Auftrags-, Leistungs-, Zeit-, Rechnungs-, Zahlungsstatus-, Dokument- und Protokolldaten bearbeitet werden. Betroffene Personen können insbesondere Mitarbeitende, Kunden, Interessenten, Lieferanten, Ansprechpartner und weitere Geschäftskontakte des Kunden sein.</p>
      <h2>4. Weisungen</h2>
      <p>Binso GmbH bearbeitet Auftragsdaten nur im Rahmen des Vertrags, der Produktfunktionen und dokumentierter Weisungen des Kunden, ausser eine gesetzliche Pflicht verlangt eine andere Bearbeitung. Hält Binso GmbH eine Weisung für datenschutzrechtlich problematisch, kann sie den Kunden darauf hinweisen und die Ausführung bis zur Klärung aussetzen, soweit dies rechtlich zulässig und zum Schutz der Daten erforderlich ist.</p>
      <h2>5. Vertraulichkeit und Zugriff</h2>
      <p>Zugriffe auf Auftragsdaten werden auf diejenigen Personen und Systeme beschränkt, die sie für Betrieb, Support, Sicherheit oder die Vertragserfüllung benötigen. Mitarbeitende und beigezogene Personen werden zu angemessener Vertraulichkeit verpflichtet.</p>
      <h2>6. Technische und organisatorische Massnahmen</h2>
      <p>Binso GmbH setzt dem Risiko angemessene Schutzmassnahmen ein. Dazu gehören insbesondere mandantenbezogene Datenisolation, rollenbasierte Berechtigungen, Authentisierung über konfigurierte Identitätsdienste, verschlüsselte Übertragung, serverseitige Geheimnisse, Datenbankzugriffskontrollen, Audit- und Sicherheitsprotokollierung, sichere Softwarebereitstellung sowie geregelte Betriebs- und Wiederherstellungsprozesse. Die Massnahmen werden entsprechend technischer Entwicklung und Risiko weiterentwickelt.</p>
      <h2>7. Unterauftragsbearbeiter</h2>
      <p>Der Kunde ermächtigt Binso GmbH, für die Leistungserbringung Unterauftragsbearbeiter einzusetzen. Die aktuelle Liste ist unter <a href="/legal/subprocessors">Unterauftragsbearbeiter</a> veröffentlicht. Neue oder ersetzte wesentliche Unterauftragsbearbeiter werden in angemessener Form bekannt gemacht. Soweit ein sachlich begründeter datenschutzrechtlicher Einwand nicht anderweitig gelöst werden kann, können die Parteien die betroffene Leistung oder den Vertrag nach den anwendbaren Vertragsbedingungen beenden.</p>
      <h2>8. Auslandbearbeitung</h2>
      <p>Erfolgt eine Bekanntgabe in Staaten ohne anerkannt angemessenes Datenschutzniveau, setzt Binso GmbH – soweit erforderlich – anerkannte Standarddatenschutzklauseln oder andere nach schweizerischem Datenschutzrecht zulässige Garantien ein. Die bekannten Länder bzw. Ländergruppen werden in der Unterauftragsbearbeiter-Liste ausgewiesen.</p>
      <h2>9. Unterstützung des Kunden</h2>
      <p>Binso GmbH unterstützt den Kunden im angemessenen Umfang bei der Erfüllung datenschutzrechtlicher Pflichten, insbesondere bei Anfragen betroffener Personen, Informationspflichten, Datensicherheitsfragen und – soweit auf die konkrete Bearbeitung anwendbar – bei der Beurteilung von Datenschutzrisiken. Zusatzaufwand ausserhalb des üblichen Produktsupports kann nach vorgängiger Abstimmung verrechnet werden.</p>
      <h2>10. Datenschutzverletzungen</h2>
      <p>Binso GmbH informiert den Kunden ohne unangemessene Verzögerung über bestätigte Verletzungen der Datensicherheit, welche dessen Auftragsdaten betreffen, soweit eine Information erforderlich ist. Die Meldung enthält die zu diesem Zeitpunkt verfügbaren Angaben über Art, mögliche Folgen und getroffene oder geplante Massnahmen.</p>
      <h2>11. Rückgabe, Export und Löschung</h2>
      <p>Binso One stellt für berechtigte Organisationsinhaber Daten-Lifecycle- und Exportfunktionen bereit. Nach Vertragsende oder einer bestätigten Löschanfrage werden Auftragsdaten nach Ablauf der vorgesehenen technischen Karenz gelöscht oder anonymisiert, soweit keine gesetzliche Pflicht, berechtigte Nachweiszwecke oder andere zulässige Gründe eine weitere Aufbewahrung verlangen. Solche Restdaten werden nur noch für den betreffenden Zweck aufbewahrt.</p>
      <h2>12. Nachweise und Prüfungen</h2>
      <p>Binso GmbH stellt dem Kunden auf angemessene Anfrage Informationen zur Verfügung, die für den Nachweis der Einhaltung dieser AVV erforderlich sind. Prüfungen sollen vorrangig durch vorhandene Dokumentation, Sicherheitsnachweise und Auskünfte erfolgen. Weitergehende Audits sind vorgängig abzustimmen, auf den erforderlichen Umfang zu beschränken und dürfen Sicherheit, Vertraulichkeit oder Rechte anderer Kunden nicht beeinträchtigen.</p>
      <h2>13. Rangfolge</h2>
      <p>Bei Widersprüchen gehen zwingendes Datenschutzrecht und anschliessend diese AVV den allgemeinen Regelungen der AGB vor, soweit der Widerspruch die Auftragsbearbeitung betrifft.</p>
      <h2>14. Kontakt</h2>
      <p>Fragen zu dieser AVV können an <a href={`mailto:${legalCompany.email}`}>{legalCompany.email}</a> gerichtet werden.</p>
    </LegalPage>
  )
}
