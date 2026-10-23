# Phase 1 — gesicherter Bestand und begrenzte Arbeitspakete

Stand: 22.10.2026. Nur Bestandsaufnahme, Sicherung und Planung. Keine neue
Implementierung, kein Push/CI-Start, Merge, Deployment oder produktive Migration.

## Gesicherte Basis und tatsächliche Nachweise

- Branch: feat/v25-revision7. Vor dieser Sicherung lokaler und PR-Head:
  864d1b534cda06706db0b67ec55a981b115891b6. PR307 ist offen und Draft.
- Aktueller geschützter Main: ba4234604ac16b2209bef70a532ccd94f4953035.
- Quality39728992678 und CodeQL39728992704 für864d1b53: erfolgreich,
  in dieser Phase über GitHub erneut gelesen.
- Full Development39726655822 auf1567eff4cf42830d58098be95022c73adeef1723:
  erfolgreich, in dieser Phase über GitHub erneut gelesen. Alle acht Browserjobs
  und die nativen PostgreSQL-/HTTP-/RLS-/Parallelgates gehören zu diesem alten Code.
- 864d1b53 war ein Dokumentationscommit. Sein zuvor gespeicherter Git-Blob-Abgleich
  belegt die gleiche868-Dateien-Quellidentität wie1567eff4.7bc770a4 und a9b7e1fc
  bleiben getrennte historische Nachweise; siehe evidence-reconciliation.md.
- Die49 zurückgebliebenen geänderten/neuen Dateien ändern den Code. Keine der
  genannten grünen CI-Qualifikationen wird auf diesen neuen Zwischenstand übertragen.

## Abbruchstand: vorhanden, noch nicht abschliessend qualifiziert

1. Zentrale Rechnungs-Readiness, fehlende Bankdaten blockieren keinen Entwurf,
   sichere Feldnavigation/Rückkehr, persönliche Einrichtungshilfe und bekannte leere
   Finanzkacheln bei Erstnutzung ausblenden. Neue lokale Migration0080.
2. Lokale Avatar-Zuschnittvorschau vor dem Upload; Abbruch ohne Upload, bisherige
   Quarantäne-/Berechtigungsregeln und serverseitiger Zuschnitt bleiben bestehen.
3. Dauerhafte Angebotsantwort-/Mitarbeitermail-Aufträge in bestehender mail_outbox,
   atomare Erfassung, eindeutiger Replay, keine Wiederholung unklarer Versuche,
   aktuelle Opt-outs und gemeinsame verifizierte Reply-To-Prüfung. Migration0081.
4. Zugehörige gezielte Tests, Native-HTTP-/Parallel- und Browserfälle ergänzt,
   vollständige Browserplanung um2560/3840px erweitert, Inventare generiert.

Vor Commit wurden alle49 Dateien byteweise in der lokalen evidence-Ablage kopiert;
SHA256-Manifest und Git-Binärdiff liegen dort ebenfalls. Die Sicherung ist ein WIP-
Commit und keine fachliche oder technische Freigabe. Keine Datei wird verworfen.

Vorhandene lokale Logs dokumentieren erfolgreiche Migrations-/RLS-/Outbox-,
Handler-/Avatar-SSR-, Daten-, QR-/PDF- und Lokalisierungsprüfungen. Die zuletzt beim
Abbruch gestartete kombinierte ESLint-/Typecheck-Prüfung hat keinen zuverlässig
übernommenen Abschlussstatus. Deshalb hier kein neuer vollständiger Grün-Status.
Die native HTTP-/sechs-Verbindungen- und neue Browserausführung dieses Pakets ist
nicht nachgewiesen. In Phase1 wurden keine Testläufe erneut gestartet.

Die vollständige Prozess-Kommandozeileninventur war lokal nicht erlaubt. Die alte
Exec-Sitzung2893 war nicht mehr erreichbar; sichtbare Node-Prozesse wurden deshalb
nicht blind beendet. Daraus folgt weder ein belegter laufender Test noch ein belegter
sauberer Abschluss. GitHub-Läufe wurden weder gestartet noch abgebrochen.

## Implementierungslücke oder fehlender Nachweis?

Register:573 Klauseln, davon3 als implementiert,58 teilweise belegt und512 weiterhin
ungeprüft hinsichtlich vollständiger Umsetzung. Diese Werte sind keine Zahl von573
getrennten Funktionen. Keine Klausel ist dadurch automatisch vollständig abgenommen.

| Einordnung | Konkreter Stand |
| --- | --- |
| Nachgewiesene verbleibende Funktion | Kundenrabatt wird gespeichert; durchgängiger expliziter Rabatt in Dokumentberechnung, Editor und PDF fehlt. Die angefragte Fachentscheidung zur Basis/Anwendung steht aus. Historische Dokumente unverändert lassen. |
| Vorhandener neuer Code, fehlende Qualifikation | Einrichtung/Readiness, Avatar-Vorschau und Antwort-Outbox sind im gesicherten WIP vorhanden. Alte Restberichte dürfen sie nicht mehr pauschal als fehlend ausgeben. Pakete1–3 qualifizieren diesen Code, statt ihn neu zu schreiben. |
| Code und externe Integration gemeinsam offen | Verifizierte Zustell-/Bounce-Ereignisse und kontrollierte Auflösung unklarer Sendungen sind nicht vollständig angeschlossen. Outbox-Code allein beweist keine Provider-Zustellung oder garantierte Hintergrundausführung. |
| Code und Betriebsvertrag gemeinsam offen | Bestehende Beobachtungsquellen besitzen noch keine durchgehend nachgewiesene Benachrichtigungs-/Eskalationsanbindung für alle geforderten Betriebsereignisse. Keine neue Infrastruktur aus diesem Plan ableiten. |
| Noch nicht abschliessend klassifiziert |512 Klauseln. Darunter bedingte Steuer-/UID-Regeln, vollständiger Seiten-/Rollen-/KPI-Abgleich und Persistenz-/Fehlerzustände. Ohne begrenzte Code-/Nachweisprüfung weder als implementiert noch als fehlend deklarieren. |
| Fehlende automatisierte Abnahme | Neue native und Browserfälle;2560/3840px sind erst geplant. Echten Browserzoom125/150/200% nicht durch Viewport oder deviceScaleFactor ersetzen. |
| Externe/manuelle Abnahme | Physische Geräte/PWA/Tastatur, tatsächliche Entra-Policy, Mailzustellung, rechtliche Übersetzungen/Freigaben, Provider/DNS, isolierter Restore und Betriebs-Retention. Unbekannt bedeutet nicht automatisch fehlende Ressource. |

## Konkrete Paketliste

Schätzung pro Paket, inklusive gezielter Prüfung und Commit; keine Zusage für eine
Gesamtfertigstellung aller ungeprüften Klauseln. Obergrenze60 Minuten: wenn der
Befund grösser ist, vor Umsetzung weiter teilen. Kein Anschlussauftrag automatisch.

| Nr. / Paket | Betroffene Module | Fehlende Funktion / Nachweis | Priorität | Abhängigkeit | Aufwand | Erforderliche Tests | Abschlusskriterium |
| --- | --- | --- | --- | --- | --- | --- | --- |
|1 Readiness qualifizieren | business-readiness, documents, Firma-/Dokumenteinstellungen, Dashboard,0080 | Code vorhanden; Feldfokus/Rückkehr, Erstnutzung, native Rollen/RLS und Race-Verhalten noch am neuen SHA nachweisen | P0 | Gesicherter WIP, isolierte Migration |40–60min | Bestehender gezielter Readiness-Contract; native HTTP; ein Browserablauf Entwurf→fehlende Angabe→Save→Rückkehr, direktes Issue negativ | Fehlende Bank blockiert keinen Entwurf; echtes Issue bleibt serverseitig gesperrt; keine automatische Ausstellung; tatsächliche CI-Nachweise und Commit |
|2 Avatar-Vorschau qualifizieren | avatar-upload, Avatar, Profil, profile-image | Code vorhanden; neue Picker-/Preview-/Fehlerabläufe noch in Browser-CI offen | P1, Uploadschutz P0 | Gesicherter WIP; vorhandene Scanner-Contracts |20–40min | Kein POST bei Auswahl/Abbruch; explizite Übernahme; Quarantäne/Fehler erhalten Altbild; SSR und Bildnormalisierung | Neue Browserfälle erfolgreich; keine neue Uploadlogik oder Foundation; reale Geräte separat offen |
|3 Antwort-Outbox qualifizieren | public-offers, versions/send, mail-identity,0081 | Code vorhanden; aktuelle Native-Parallel-/Rollenqualifikation und Betriebsgrenzen fehlen | P0 | Gesicherter WIP, isolierte0081 |40–60min | Sechs physische PostgreSQL-Verbindungen; ein Ereignis/Providerclaim; Replay, Audit-Rollback, queued/failed/accepted/uncertain, Opt-out und Reply-To | Aktueller CI-Nachweis; keine Blindwiederholung; keine echte Testmail; Commit und Statusprotokoll |
|4 Rabattregel festlegen | Kundenstandard, gemeinsamer Dokumentvertrag | Unentschieden: Dokument- oder Positionsrabatt, Basis vor MwSt., Kundenstandard, Änderbarkeit | P1 | Fachliche Antwort erforderlich |20–30min | Verbindliche Zahlenbeispiele, gemischte Steuersätze, Rundung, historische Gegenbeispiele | Fachregel dokumentiert und freigegeben; noch kein Preis-/Bestandsdaten-Eingriff |
|5 Rabattberechnung und Persistenz | money, Dokument-Repository/DTO, nötige additive Migration | Zentrale serverseitige Rabattberechnung und stabile Draft-Persistenz fehlen | P1, Finanzintegrität P0 |4 |40–60min | Positive/negative Beträge, Rundung, Rollen/RLS, Wiederholung/Rollback, bestehende Dokumente unverändert | Ein zentraler fachlich geprüfter Rechenvertrag; isolierte Migration; eigener Commit; UI folgt separat |
|6 Rabatt in Editor und PDF | gemeinsamer Angebots-/Rechnungseditor, Defaults, PDF/Snapshot | Durchgehende sichtbare Anwendung derselben Rabattregel fehlt | P1 |5 |40–60min | Gezielter Editorablauf, API-/Summen-/PDF-Parität, historische Bytes, Nullrabatt | Neue Entwürfe/PDFs identisch berechnet; alte Versionen unverändert; CI und Commit |
|7 Providervertrag verifizieren | vorhandener Graph-/Mailweg und Zustellmetadaten | Tatsächlicher authentifizierter Zustell-/Bounce-/Reconciliation-Vertrag unbekannt | P0, extern abhängig | Vorhandener lesender Zugriff; keine neue Zustimmung |20–40min | Lesende Konfigurations-/Metadatenprüfung; keine echte Mail ohne Freigabe | Exakter unterstützter Ereignisvertrag oder konkreter Blocker; keine erfundene Signatur/Providerfunktion |
|8 Zustellereignisse normalisieren | vorhandene Versandzustände und Delivery-Service | Persistente authentifizierte Ereignisverarbeitung noch nicht vollständig | P0 |7 und bestätigter Vertrag |40–60min | Gültig/ungültig, falscher Tenant, Replay, Reihenfolge, unveränderte Ereignis-ID und Audit-Rollback | Zentraler Adapter mit Negativtests; keine Produktivkonfiguration; Commit |
|9 Kontrollierte Versandklärung | Delivery-Historie/API und bestehendes Aktionsmenü | Sicherer beleggebundener Bedienweg für unklare Versände unvollständig | P0 |7–8; verbindliche Berechtigungen |40–60min | Kein automatischer Resend, fremde/alte Belege, Rollen/Step-up, Doppelbedienung | Unbekannt bleibt unbekannt ohne Beleg; zulässige Auflösung auditierbar; zielgerichtete CI und Commit |
|10 Betriebsereignisse anbinden | bestehende observability-/Job-/Auditquellen | Geforderte Benachrichtigungs-/Eskalationswege nicht vollständig angeschlossen | P0, extern abhängig | Vorhandener freigegebener Kanal/Betriebsvertrag |40–60min je Ereignisgruppe | Echtes internes Fixtureereignis, Dedup, Fehler und Rechte; keine produktive Testaktion | Eine definierte Ereignisgruppe nutzt vorhandenen Kanal mit Nachweis; sonst konkreter externer Blocker |
|11 Restregister begrenzt klassifizieren | Höchstens3–5 Routen oder eine klar definierte Regelgruppe |512 unbekannte Klauseln: Implementierungsbefund fehlt, nicht512 belegte Codefehler | Zuerst P0 | Bestehendes Register und konkrete Code-/Testreferenzen |30–60min je Gruppe | Nur relevante vorhandene Nachweise; gezielte Negativfälle bei Sicherheits-/Datenrisiko | Jede ausgewählte Klausel hat belegten Ist-Status und Test-/Blockerzuordnung; neue Defekte werden eigene Pakete |
|12 Desktop-Nachweise schliessen | bestehende QA-Planung und gemeinsame Layout-Owner |2560/3840px noch nicht ausgeführt; echter Zoom separat offen | P1 | Stabiles qualifiziertes Paket; Browserwerkzeug |20–40min je begrenzter Seitenfamilie | Vorhandene CI-Breiten; echter125/150/200%-Zoom, Fokus, Überlauf, Screenshots | Tatsächlich geprüfte Methode/Seiten dokumentiert; Geräteemulation nicht als physische Abnahme ausgeben |

Paket11 ist wiederholbar, kein erneuter56-Kapitel-Masterlauf: zuerst Identity/
Registrierung/Reset und Sicherheitszustände; danach Rechnungs-/Zahlungsregeln,
Kunden/Angebote, Zeit/Ausgaben, Support/Einstellungen und Operatorvarianten.
Pro Auftrag feste Klauseln und höchstens3–5 Routen benennen. Gefundene grössere
Implementierungslücken werden vor Codebeginn geteilt. Keine pauschale Freigabe
für die restlichen Seiten aus einer Stichprobe ableiten.

## Externe Abnahmen — keine behaupteten fehlenden App-Funktionen

- Physische iPhone-/iPad-/Android-PWA, OS-Tastatur und Assistenztechnik: pro Gerät
  höchstens einen vereinbarten20–60min-Testblock, nur bei tatsächlichem Zugang.
- Entra-Conditional-Access, bestehende Provider/DNS/Scanner/Billing/Push: lesend
  verifizieren; zusätzliche Rechte, Secrets und produktive Änderungen separat.
- Juristische und muttersprachliche Prüfung: tatsächliche Fachfreigabe erforderlich.
- Wiederherstellung und Betriebs-Retention: eigener freigegebener isolierter
  Betriebsauftrag; ein vorhandener Backup-GET oder Cleanup-Code ist kein Live-Beweis.

## Verbindlicher schneller Ablauf ab dem nächsten Paket

1. Genau ein Paket mit konkreten Dateien/Klauseln, Erfolgskriterien und20–60min wählen.
2. Vorhandenen Stand verwenden. Keine neue Gesamtinventur oder Parallel-Foundation.
3. Nur notwendige gezielte lokale Prüfungen; Fehler ursächlich beheben. Keine Gates deaktivieren.
4. Am Paketende Änderungen prüfen und committen; vollständige Pflichtprüfungen
   am abgeschlossenen Paket über GitHub CI, nicht nach jeder Einzeländerung.
5. Commit, tatsächliche Checks, offene Punkte berichten und das Paket beenden.
   Keine zusätzlichen Optimierungen oder nächste Pakete automatisch anschliessen.
6. PR307 bleibt bis belegbarer technischer Abnahme Draft. Merge, produktive
   Migration und Deployment bleiben separat freizugeben.
