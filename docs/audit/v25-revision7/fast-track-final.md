# V25 Fast-Track — Pakete7–12

Auftrag begonnen22.10.2026 um13:02Europe/Zurich; harte Obergrenze15:02.
Früherer Abschluss ist zulässig. Keine erneute Gesamtanalyse, keine Vollmatrix.
Branch `feat/v25-revision7`, PR307 bleibt Draft. Ausgangsstand und saubere
Arbeitskopie: `38754fad7b2c1922653b725ad61d14de47cd6577`.

## Verifizierter Paket6-Ausgangsstand

Am Beginn erneut über GitHub gelesen, alle erfolgreich an diesem SHA:

- [Quality39765711852](https://github.com/oemercam/binso_admin_azure/actions/runs/39765711852): Tests, native PostgreSQL-Parallelfälle, echte HTTP-/Rollen-/RLS-Prüfung, Lint, Typen, Security/Audit, Scanner, Build und exakter Artefakt-Smoke.
- [Rabatt-Browser39765711820](https://github.com/oemercam/binso_admin_azure/actions/runs/39765711820): Paket6 Desktop/Mobile einschliesslich des korrigierten Auswahlmenüs.
- [CodeQL39765711817](https://github.com/oemercam/binso_admin_azure/actions/runs/39765711817), [Avatar39765711886](https://github.com/oemercam/binso_admin_azure/actions/runs/39765711886), [Readiness39765711578](https://github.com/oemercam/binso_admin_azure/actions/runs/39765711578).

Der normale Quality-Browser-Matrixjob war scopebedingt ausgelassen; die separat
aufgeführten Paket-Browser sind tatsächliche Nachweise. Keine Vollmatrixbehauptung.
Neue Fast-Track-Quellen benötigen ihre eigenen Pflichtprüfungen.

## Tatsächlicher Paketumfang

| Paket | Ergebnis / Änderung | Prüfung und Grenze |
| --- | --- | --- |
|7 Provider | [Verifizierter Vertrag](../../architecture/v25-mail-provider-contract.md): Graph-MIME-SendMail, lokale Kennungen, Graph202, vorhandenes Mail.Send und vier konfigurierte App-Einstellungen lesend bestätigt | Keine echte Mail, keine neuen Rechte. Kein Mail.Read oder unterstützter korrelierbarer Zustellereignisvertrag. Exchange-RBAC/Trace gesondert offen |
|8 Zustellereignisse | **Extern blockiert**, ausdrücklich keine neue Implementierung | Authentifizierbare Subscription-/NDR-/Trace-Quelle und sichere Auftragskorrelation fehlen. Keine fingierte Graph-Signatur |
|9 Unklare Zustände | Bestehende No-Resend-/Audit-/RLS-Verträge qualifiziert; keine neue Statusmutation | Unveränderte Versandpfade mit grünem Basis-Quality-Nachweis: sending/uncertain/historisch failed bleiben gesperrt, neue Kennung umgeht dies nicht. Kontrollierte Auflösung ohne echten Providerbeleg bleibt blockiert |
|10 Betriebsereignisse | Konkrete Lücke geschlossen: document_deliveries fehlte neben mail_outbox in den bestehenden Mailalarmen. Vorhandene Alarm-IDs/Kanäle weiterverwendet; additive Migration0083 erlaubt nur Plattform-SELECT, keine neuen Schreibrechte | Lokale echte Migrationen/PGlite: Tenantgrenzen, Plattform-Read-only, Demoausschluss, Statussemantik, personenfreie Aggregate, Recovery, stale/fehlende Daten und DB-Ausfall erfolgreich. Keine Alarmzustellung behauptet |
|11 P0-Stichprobe | Genau sechs bestehende Registerklauseln präzisiert, keine neue573-Klausel-Analyse | Login/Sitzung, Rechnungszahlungen, Dateidownload, Dokumentversand, Betreiber-Monitoring. Native Basisbelege wiederverwendet, neue Monitoring-Policy separat geprüft; zusammengesetzte Pflichten bleiben teilweise belegt |
|12 Responsive | Begrenzter neuer Modus im bestehenden Browser-Harness, gleiche SSR-Session-/API-Fixtures; separater CI-Workflow | Vier repräsentative Routen, fünf Breiten, vier Sprachen, Hell/Dunkel: maximal160 Route/Breite/Sprache/Theme-Fälle plus Sidebar-/Dialoginteraktionen. Vor erfolgreichem CI ausdrücklich ausstehend |

## Paket10 — genaue Semantik und Betriebsblocker

- `mail_outbox` bleibt unverändert. `document_deliveries.not_attempted` zählt als
  definitiv nicht versendet, historisches `failed` weiter als `uncertain`.
- Unterbrochene Dokumentversände zählen erst nach fünf Minuten seit Reservierung.
  Frisches sending sowie sent/accepted lösen dadurch keinen Fehler aus.
- Eine spätere abgeschlossene Providerannahme desselben Mandanten, Dokuments,
  Dokumenttyps, Empfängers und Versandzwecks erledigt den Alarm eines früheren
  `not_attempted`. Eine Mahnung erledigt keinen Dokumentversandfehler.
  `sending`/`uncertain`/historisch failed werden dadurch nicht freigegeben.
- Bestehende read-only Monitoring-Transaktion, Server-Operatorberechtigung und
  maskierte Billing-/Auditwerte bleiben erhalten. Kein Empfänger/Payload im JSON.
- Migration0083 ist ausschliesslich isoliert geprüft; keine produktive Migration.
  Rollback im eigenen Freigabepaket: App-Zugriff zurücknehmen und nur diese neue
  SELECT-Policy entfernen; bestehende Tenantpolicy und Ledgers unverändert lassen.
- Im tatsächlich zugeordneten Produktions-Ressourcenkreis wurden vier Ressourcen
  gefunden, keine Microsoft.Insights-/OperationalInsights-Ressource. Dies ist
  **keine** Aussage über sämtliche Abonnemente, andere Ressourcengruppen oder
  mögliche externe Dienste. Freigegebener Alarmempfänger, Eskalation und echter
  Zustelltest fehlen. Keine neue Monitoring-Plattform angelegt.
- Fehlgeschlagene Billing-Webhooks und Datenbankausfall sind im vorhandenen
  Monitoring erfasst; wiederholte Auth-Fehler, Migrations-/Deploymentereignisse
  und persistente Alarmhistorie sind nicht vollständig angebunden. Kein
  Hintergrundjob-/Scheduler-Nachweis aus einer sichtbaren Queue abgeleitet.

## Paket11 — begrenzte Registerqualifikation

| Klausel | Implementierungsbefund | Offene Abnahme |
| --- | --- | --- |
|R7-28-003 | Gemeinsamer Login, Rolle/Mandant aus aktiver DB-Mitgliedschaft nach Authentifizierung: implementiert und technisch geprüft | Keine pauschale Geräte-/Identity-Gesamtfreigabe |
|R7-36-001 | Ausgewählte Rollen-/Tenant-/Datei-/Finanz-/Auditgrenzen geprüft | Gesamte zusammengesetzte Sicherheits-/Retentionpflicht nicht vollständig abgenommen |
|R7-36-004 | Mail-/DB-/Billing-Messquellen und lokale Monitoring-Erweiterung teilweise belegt | Externe Alerts/Eskalation, tatsächlicher Restore/RPO/RTO und operativer Rollback offen |
|R7-38-038 | Acht Rollen, private GET-Routen,80 zulässige Create-Fälle und konkrete negative Writes im Basis-HTTP-Gate belegt | Übrige Schreib-/Status-/Operator-Kombinationen nicht pauschal abgenommen |
|R7-45-005 | Bestehende Zahlungen/Teilzahlung/Gutschrift/Überzahlung/Refund, Replay/RLS/Audit und unverändertes Rechnungsvolumen belegt | Nicht sämtliche Fach-/Steuer-/Altdatenkonstellationen geprüft |
|R7-54-004 | Private Draft-/Session-Fences und Wiederaufnahme mit Replay-Kennung vorhanden und geprüft | Reale PWA-Hintergrund-/Gerätefälle und alle Formulare offen |

Die unveränderten Fachpfade werden nicht erneut implementiert. Herkunft sind
die tatsächlich gelesenen Checks-/Buildjob-Logs des Basis-Quality-Laufs, nicht
eine Annahme aus alten Berichten. Neue Migration und Monitoringquellen sind
gesondert vom identischen Basiscode zu qualifizieren. Registerquelle bleibt
`evidence.json`; vorhandener Generator aktualisiert JSON/CSV und die betroffenen
Quellzeilenreferenzen. Keine Originalklausel oder Priorität geändert. Aktuelle Projektion:573 Klauseln,
4 implementiert,62 teilweise belegt,507 hinsichtlich Umsetzung ungeprüft. Diese
507 sind keine507 nachgewiesenen Defekte; alle Prioritäten bleiben im Register.

## Paket12 — Methode und ausdrückliche Lücken

Routen: `/dashboard`, `/rechnungen`, `/kunden/customer-one`, `/rechnungen/neu`.
Breiten1280/1440/1920/2560/3840px bei1000px Höhe; echte Anwendung im vorhandenen
isolierten SSR-Testserver, synthetische Fachdaten, keine Produktion. DE/EN/FR/IT
und Hell/Dunkel müssen am tatsächlichen HTML-Lang/Theme geprüft werden.
Stichprobe misst Überlauf, Shared-Grid-Grenzen, Header-/Feld-/Footer-Geometrie,
ein-/ausgeklappte Sidebar und regulär anklickbare Auswahl im Rabattdialog.
Screenshots sind Nachweise zur Sichtung, keine automatische Originalfreigabe.

Browserzoom125/150/200% **nicht getestet**. Viewport und DPR sind kein Zoombeleg.
Physische iPhone-/Android-PWA, OS-Tastatur, Assistenztechnik und menschliche
visuelle/fachliche Vier-Sprachen-Abnahme bleiben separat manuell. Mobile
Bottom-Navigation und blauer FAB werden nicht geändert. Keine Vollmatrix.

## Lokale Checks und Abschlussgrenzen

Erfolgreich: observability-test mit allen Migrationen, Typecheck, gezieltes ESLint,
vorhandener migration-test (inklusive Finanz-/Versand-/Readiness-/Auditverträge),
Localization-Coverage, Revision7-Registervertrag und Workflow-Sicherheitsvertrag.
Syntaxprüfungen der neuen/erweiterten Browserdateien erfolgreich. Der vorhandene
Foundation-Nachweis wird nach den letzten Quelländerungen neu generiert/geprüft.
Native neue CI-/Browserergebnisse werden erst nach tatsächlichem Erfolg gezählt.

P0-Folgearbeiten: beleggebundener Provider-/Zustellvertrag und kontrollierte
Klärung; Alarm-/Eskalationskanal; isolierter realer Restore und Betriebs-Retention;
übrige nicht geprüfte Write-/Operator-Sicherheitskombinationen.
P1/P2: noch ungeprüfte Registerklauseln und ausstehende Fach-/Sprach-/UX-/Geräte-
Abnahmen bleiben offen. Ungeprüft bedeutet keine nachgewiesene fehlende Funktion.
Keine globale V25-Fertigmeldung aus dieser Stichprobe ableiten.

Kleinster nächster Schritt: bestehender Betreiberkanal, Empfänger und eine
verifizierbare Provider-Lesequelle ausdrücklich bestimmen; zunächst ein
kontrolliertes internes Alarmereignis mit Zustellbeleg, keine Kundenmail.
Grosse Restbefunde bleiben eigenständige Folgepakete.

Kein Merge, keine Produktivmigration/Deployment, keine neuen externen Rechte,
keine echten Kundenmails, keine Änderung anderer PRs und kein V26.

### Erster Responsive-CI-Lauf

Lauf39770194971 aufce239d32 stoppte nach den ersten DE/Light/1280px-
Aufnahmen am erwarteten Formular-Verwerfschutz: Der neue Test wartete nach
Abbrechen direkt auf ein geschlossenes geändertes Rabattformular. Er prüft jetzt
zusätzlich den tatsächlich geforderten Bestätigungsdialog und verwirft erst nach
ausdrücklichem Klick. Produktcode, Guard und Erwartungen an die Geometrie bleiben
unverändert. Dieser fehlgeschlagene Lauf ist kein bestandener Paket12-Nachweis.
