import { publicMetadata } from '@/lib/config/seo'
import { LegalPage } from '@/components/public/legal-page'
import { TERMS_VERSION, legalCompany } from '@/lib/legal/legal-config'

export const metadata = publicMetadata({ title: 'AGB', description: 'Allgemeine Geschäftsbedingungen für Binso One.', path: '/legal/terms' })

export default function TermsPage() {
  return (
    <LegalPage title="Allgemeine Geschäftsbedingungen" description={`Allgemeine Geschäftsbedingungen für Binso One. Version: ${TERMS_VERSION}.`}>
      <h2>1. Anbieterin und Geltungsbereich</h2>
      <p>Diese AGB regeln die Nutzung der Software-as-a-Service-Plattform Binso One durch Unternehmen und Organisationen. Anbieterin und Vertragspartnerin ist {legalCompany.legalName}, {legalCompany.address}, UID {legalCompany.uid}. Individuell vereinbarte Vertragsbedingungen gehen diesen AGB vor.</p>

      <h2>2. Vertragsabschluss</h2>
      <p>Ein kostenloser Testzugang begründet noch kein kostenpflichtiges Abonnement. Vor dem Start eines kostenpflichtigen Self-Service-Abonnements werden der gewählte Plan, Preis und die wesentlichen Konditionen angezeigt. Der kostenpflichtige Vertrag kommt zustande, wenn die berechtigte Person den zahlungspflichtigen Bestellvorgang im Checkout abschliesst und die Bestellung elektronisch bestätigt wird. Bei individuell vereinbarten Enterprise-Leistungen kommt der Vertrag nach Massgabe der jeweiligen individuellen Vereinbarung zustande.</p>

      <h2>3. Registrierung und Vertretungsberechtigung</h2>
      <p>Registrierende Personen müssen richtige und vollständige Angaben machen und berechtigt sein, die angegebene Organisation zu vertreten oder für sie ein Konto einzurichten. Zugänge dürfen nur berechtigten Personen erteilt werden. Die Kundschaft ist für die Verwaltung ihrer Benutzer, Rollen und organisatorischen Berechtigungen verantwortlich.</p>

      <h2>4. Leistungsumfang und Pläne</h2>
      <p>Der Leistungsumfang richtet sich nach dem gewählten Plan und den im Produkt oder in einer individuellen Vereinbarung ausgewiesenen Leistungen. Binso GmbH darf Funktionen weiterentwickeln, verbessern oder technisch ersetzen. Wesentliche, dauerhaft nachteilige Änderungen an bezahlten Kernleistungen werden nicht ohne angemessene Vorankündigung vorgenommen, sofern nicht Sicherheits-, Rechts- oder zwingende Betriebsgründe eine kurzfristigere Änderung erfordern.</p>

      <h2>5. Testphase</h2>
      <p>Wird eine kostenlose Testphase angeboten, gelten die bei Registrierung ausgewiesene Dauer und der ausgewiesene Funktionsumfang. Ohne ausdrückliche Aktivierung eines kostenpflichtigen Abonnements erfolgt keine automatische kostenpflichtige Verlängerung allein aufgrund des Testzugangs.</p>

      <h2>6. Preise, Steuern und Zahlung</h2>
      <p>Es gelten die beim Abschluss ausgewiesenen oder individuell vereinbarten Preise. Preise werden in Schweizer Franken ausgewiesen; die steuerliche Behandlung richtet sich nach der jeweiligen Preisangabe und den gesetzlichen Vorgaben. Für Self-Service-Abonnemente kann Stripe die Zahlungsabwicklung übernehmen. Rechnungs- oder Zahlungsinformationen des Zahlungsdienstleisters ergänzen die Vertragsunterlagen.</p>

      <h2>7. Zahlungsverzug und Sperrung</h2>
      <p>Bei überfälligen Zahlungen kann Binso GmbH nach angemessener Mahnung Funktionen einschränken oder den Zugang vorübergehend in einen eingeschränkten bzw. schreibgeschützten Zustand versetzen. Zwingende gesetzliche Rechte sowie offene Zahlungsansprüche bleiben vorbehalten. Sicherheitsbedingte Sperrungen können ohne vorgängige Mahnung erfolgen, wenn dies zum Schutz von Kunden, Daten oder Systemen erforderlich ist.</p>

      <h2>8. Laufzeit, Verlängerung und Kündigung</h2>
      <p>Laufzeit und Abrechnungsperiode richten sich nach dem gewählten Plan. Self-Service-Abonnemente können über die bereitgestellte Abonnementverwaltung zum Ende der laufenden Abrechnungsperiode gekündigt werden, soweit beim Abschluss nichts anderes ausgewiesen wird. Bereits fällige Entgelte werden durch die Kündigung nicht rückwirkend aufgehoben. Für Enterprise-Verträge gelten die individuell vereinbarten Laufzeiten und Kündigungsregeln.</p>

      <h2>9. Planwechsel</h2>
      <p>Upgrades können je nach Abrechnungsmodell sofort oder zum ausgewiesenen Zeitpunkt wirksam werden. Downgrades werden grundsätzlich zum nächsten dafür vorgesehenen Abrechnungszeitpunkt wirksam. Die Kundschaft ist dafür verantwortlich, vor einem Downgrade zu prüfen, ob Benutzer-, Speicher- oder Funktionslimits eingehalten werden. Binso GmbH löscht Geschäftsdaten nicht allein aufgrund eines Planwechsels ohne entsprechende Produktregel oder vorgängige Information.</p>

      <h2>10. Zulässige Nutzung</h2>
      <p>Binso One darf nur rechtmässig und entsprechend dem vereinbarten Zweck genutzt werden. Unzulässig sind insbesondere unberechtigte Zugriffe auf fremde Konten oder Daten, Umgehung von Sicherheits- oder Berechtigungsmechanismen, absichtliche Überlastung oder Störung des Dienstes, Einschleusen schädlicher Inhalte sowie eine Nutzung, die Rechte Dritter verletzt. Gesetzlich zwingend erlaubte Handlungen bleiben vorbehalten.</p>

      <h2>11. Kundendaten und Verantwortung</h2>
      <p>Die Kundschaft behält ihre Rechte an den von ihr eingebrachten Geschäftsdaten und ist für deren Rechtmässigkeit, Richtigkeit sowie zulässige Nutzung verantwortlich. Sie stellt sicher, dass sie Personendaten und sonstige Inhalte in Binso One bearbeiten darf und erforderliche Informationen gegenüber betroffenen Personen erteilt.</p>

      <h2>12. Auftragsbearbeitung und Datenschutz</h2>
      <p>Die Bearbeitung personenbezogener Daten wird in der <a href="/legal/privacy">Datenschutzerklärung</a> beschrieben. Soweit Binso GmbH Personendaten im Auftrag eines Geschäftskunden bearbeitet, gilt ergänzend die <a href="/legal/dpa">Auftragsbearbeitungsvereinbarung</a>. Die eingesetzten Unterauftragsbearbeiter sind unter <a href="/legal/subprocessors">Unterauftragsbearbeiter</a> aufgeführt.</p>

      <h2>13. Datenausgabe und Datenlöschung</h2>
      <p>Binso One stellt je nach Produktumfang Export- und Daten-Lifecycle-Funktionen bereit. Vor Vertragsende ist die Kundschaft dafür verantwortlich, benötigte Daten rechtzeitig zu exportieren. Nach einer bestätigten Löschanfrage oder nach Vertragsende dürfen Daten nach Ablauf einer angemessenen technischen Karenz gelöscht werden, soweit keine gesetzlichen Aufbewahrungspflichten, offenen Ansprüche oder zulässigen Nachweiszwecke entgegenstehen.</p>

      <h2>14. Verfügbarkeit, Wartung und Änderungen</h2>
      <p>Binso GmbH betreibt Binso One mit angemessener Sorgfalt. Wartung, Sicherheitsmassnahmen, Releases, Störungen bei Infrastrukturpartnern oder Ereignisse ausserhalb des angemessenen Einflussbereichs können zu vorübergehenden Einschränkungen führen. Verbindliche Verfügbarkeits-, Reaktions- oder Wiederherstellungswerte gelten nur, wenn sie ausdrücklich in einer SLA oder Individualvereinbarung zugesichert wurden.</p>

      <h2>15. Support</h2>
      <p>Support wird über die ausgewiesenen Supportkanäle und entsprechend dem gebuchten Leistungsumfang erbracht. Support umfasst keine Rechts-, Steuer- oder Buchhaltungsberatung. Die Kundschaft bleibt für die fachliche Prüfung ihrer Geschäftsvorgänge, Dokumente und Buchungen verantwortlich.</p>

      <h2>16. Rechte an Binso One</h2>
      <p>Alle Rechte an Binso One, der Software, Benutzeroberfläche, Dokumentation, Marke, technischen Konzepten und Weiterentwicklungen verbleiben bei Binso GmbH oder den jeweiligen Lizenzgebern. Für die Vertragsdauer erhält die Kundschaft ein nicht ausschliessliches, nicht übertragbares Recht, Binso One im vereinbarten Umfang für die eigene Organisation zu nutzen. Rechte an eigenen Kundendaten werden dadurch nicht übertragen.</p>

      <h2>17. Gewährleistung und Haftung</h2>
      <p>Binso GmbH erbringt die Leistungen mit der für professionelle SaaS-Dienste angemessenen Sorgfalt. Zwingende gesetzliche Haftung bleibt unberührt. Soweit gesetzlich zulässig, ist die Haftung für leichte Fahrlässigkeit und für mittelbare Schäden, Folgeschäden, entgangenen Gewinn oder Schäden aus vom Kunden zu verantwortenden fehlerhaften Eingaben, unzulässigen Integrationen oder fehlenden kundenseitigen Sicherungsmassnahmen ausgeschlossen. Eine weitergehende Haftungsbegrenzung aus einer Individualvereinbarung bleibt vorbehalten.</p>

      <h2>18. Preis- und Vertragsänderungen</h2>
      <p>Preisänderungen oder wesentliche Änderungen dieser AGB für laufende kostenpflichtige Verträge werden mit angemessener Vorlaufzeit mitgeteilt und grundsätzlich erst für eine zukünftige Abrechnungsperiode wirksam, soweit nicht zwingende rechtliche oder sicherheitsbedingte Gründe eine frühere Anpassung erfordern. Ist eine Änderung für die Kundschaft wesentlich nachteilig und nicht zwingend erforderlich, bleiben die vertraglich vorgesehenen Kündigungsrechte unberührt.</p>

      <h2>19. Übertragung und Beizug Dritter</h2>
      <p>Binso GmbH darf zur Leistungserbringung geeignete Dienstleister und Unterauftragsbearbeiter beiziehen. Eine Übertragung des Vertrags als Ganzes erfolgt nur im gesetzlich zulässigen Rahmen und unter Wahrung berechtigter Interessen der Kundschaft.</p>

      <h2>20. Schlussbestimmungen</h2>
      <p>Sollte eine Bestimmung dieser AGB ganz oder teilweise unwirksam sein, bleiben die übrigen Bestimmungen davon unberührt. Es gilt Schweizer Recht. Für Streitigkeiten mit Geschäftskunden sind, soweit gesetzlich zulässig und keine abweichende Individualvereinbarung besteht, die ordentlichen Gerichte am Sitz der Binso GmbH zuständig.</p>

      <h2>21. Kontakt</h2>
      <p>Vertragliche und rechtliche Anfragen können an <a href={`mailto:${legalCompany.email}`}>{legalCompany.email}</a> gerichtet werden.</p>
    </LegalPage>
  )
}
