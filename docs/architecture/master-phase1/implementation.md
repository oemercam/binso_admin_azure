# Master Implementation Phase 1 — Arbeitsstand

Basis: Main `fc596c4e67e354d464fb8eac2221ebb1ad013096`, 24. Oktober 2026.
Verbindlicher neuer Auftrag: [vollständige nachgereichte Masterdatei](source.md),
Kapitel 1–12. Der zuerst gelieferte, abgebrochene Text bleibt als
[historische Quelle](source-truncated.md) erhalten. Der referenzierte Global UX Master V6 liegt hier nicht als
vollständige zusätzliche Quelle vor; die konkreten Werte stehen aber in der vollständigen Masterdatei. Explizite Regeln dieses Auftrags ersetzen
widersprechende ältere Darstellungsregeln; übrige Sicherheitsgrenzen bleiben.

## Ist-Soll-Matrix vor Umsetzung

| Bereich | Ist | Beleg | Soll / Arbeitspaket |
|---|---|---|---|
| Zentrale Foundation | Teilweise vorhanden | `app/design-system/manifest.json`, `theme.css`, `components/ui.tsx`, `binso-ux.tsx` | AP1: neue Schriftstufen, Radien und Icons im bestehenden Owner; keine zweite Bibliothek |
| Header, Orientierung | Teilweise vorhanden | `components/app-shell.tsx`, `app-chrome.tsx`, `lib/page-orientation.ts` | AP1: Hauptseitenbeschreibung, Detail-/Listenheader nach neuer Regel |
| Navigation V2 | Fehlend | `components/app-shell.tsx` führt Finanzen als dritten Hauptpunkt | AP1: Übersicht/Kunden/Aufträge/Zeit/Mehr; vorhandene Zugriffsprüfung, Dock-Geometrie und FAB erhalten |
| Mehr / persönliches Konto | Teilweise vorhanden | `app-shell.tsx`, `settings-navigation.tsx`, `header-panel-content.tsx` | AP1: verbindliche Kategorien, persönliche Ziele getrennt, bestehende Deep Links erhalten |
| Suche / Filter / Sortierung | Bereits vorhanden, Sichtprüfung offen | `components/records.tsx`, `select-control.tsx`, `binso-ux.tsx` | AP2: ein Löschzugang, fokuserhaltend, verankerte einfache Auswahl und zentrale komplexe Filter prüfen |
| Kundenliste / Dossier | Teilweise vorhanden | `components/pages/customers.tsx` | AP2: Firma/Status/Kontakt, drei Tabs, Kontakte in Übersicht, Entwicklung aus UI entfernen; Daten behalten |
| Dokumentlisten | Teilweise vorhanden | `components/document-list.tsx` | AP2: striktes zweizeiliges Layout, vollständiger Betrag |
| Positionseditor | Teilweise vorhanden | `components/documents.tsx`, `lib/document-lines.ts` | AP3: kompakte Positionen, Griff/Reihenfolge, Wischen + zugängliche Alternative; bisheriges Positionsmenü ersetzen |
| Formulare / Dirty State | Bereits vorhanden, neue Abnahme offen | `use-dirty-snapshot`, `form-snapshot`, `use-dialog-focus`, `binso-ux` | AP3: komplexe Bearbeitung ohne verschachtelte Sheets, echte Eingabe-/Speicher-/Rückkehrpfade prüfen |
| Finanzen / Berichte | Teilweise vorhanden | `components/pages/finance.tsx`, `statistics.tsx`, `cash-overview.tsx` | AP4: vier KPI, horizontale Vergleiche, kompakte Accordions; Berechnungen erhalten |
| Zeit / Mehrfachfreigaben | Teilweise vorhanden | `components/pages/time.tsx`, Zeit-API und Repositories | AP4: eindeutige Status/Buttons, vorhandene Übergänge/Audit und Mehrfachauswahl prüfen |
| Versionen / Versand | Bereits vorhanden, Darstellung prüfen | `components/documents.tsx`, Outbox-/Dokument-Repositories | AP4: reale PDF-Versionen/Ereignisse, keine erfundene Zustell-/Lesebestätigung |
| Registrierung / Einladungen / Sessions / TOTP / Passkeys | Bereits vorhanden, Regression nötig | `app/api/auth`, `lib/server/{session,totp,passkeys,invitations}.ts` | AP5: vorhandene Architektur verwenden, Entzug und Alternativpfade prüfen |
| Verpflichtende Admin-MFA | Teilweise vorhanden | `lib/server/operator/{entra,session}.ts` prüft Entra-Identität und Rollen, bisher keinen expliziten MFA-Claim | AP5: serverseitiger Nachweis, keine lokale Parallel-Anmeldung; reale Entra-Policy/Claimauslieferung braucht externe Abnahme |
| Firmenweite Mitarbeiter-MFA | Fehlend | `lib/server/session.ts`, `app/api/auth/mfa/route.ts` setzen Pflicht bisher auf false | AP5: mandantensichere zentrale Policy, Enrollment-Zugang, API-Sperren, Abschaltsperre und sämtliche Anmeldepfade |
| In-App-Benachrichtigungen | Bereits vorhanden | `lib/server/repositories/notifications.ts`, persönliche Read-Marker | AP6: Ereignisse/Idempotenz/Berechtigungen und Lokalisierung prüfen |
| Browser-/PWA-Push | Technisch blockierte Zustellung, Implementierung fehlt | `config/notification-channels.ts` ist bewusst `push:false`; keine Subscription-/Senderstrecke | AP6: bestehende Benachrichtigungskette erweitern; Zustellung erst mit realer Schlüssel-/Providerkonfiguration und Geräteberechtigung bestätigen |
| DE/FR/IT/EN | Teilweise vorhanden | zentraler Katalog: 3527 Einträge, Templates/Pluralregeln; UI verwendet zentralen Übersetzer | AP7: fachliche Begriffe, Zeit-/Zahlenformate und aktuelle Lücken prüfen |
| TR global | Fehlend ausser Teilbereichen | `lib/locales/index.ts` gibt für TR ausser Zeitraumtexten den deutschen Ursprung zurück | AP7: vorhandenen Katalog um Türkisch erweitern, keinen zweiten Übersetzer; fehlende Einträge sichtbar erfassen |
| Sprachwahl | Bereits vorhanden | `components/locale-switcher.tsx`, `use-language-preference` | AP7: zentrale rahmenlose Codes, fünf native Namen, sichere Wiederherstellung und Popupgeometrie prüfen |
| Rechtliche Übersetzungen | Technisch/fachlich blockiert, soweit nicht freigegeben | bestehende versionierte Rechtsquellen und Freigaberegister | Keine ungeprüften Rechtstexte veröffentlichen oder Versionsnummern erfinden |
| Responsive / echte Geräte | Teilweise automatisiert, Geräte ungeprüft | vorhandene Chromium-/WebKit-/PWA-Suiten | AP8: 320/360/390/430/768/1024/1440, Hell/Dunkel, echte Seiten und Rollen; physische Geräte nur bei tatsächlicher Ausführung abhaken |

## Offene Entscheidungen / Grenzen

- Mobile Feldschrift: ausdrücklich bestätigt: Mobile 16 px gegen iOS-Fokuszoom,
  Desktop 14 px. Diese Ausnahme ergänzt die Tabelle der Masterdatei.
- Der zunächst fehlende Rest ist durch die vollständige Masterdatei geklärt.
- Keine produktiven Datenänderungen, Pushes, Releases oder Deployments durch diesen Auftrag.
- Quellinventur und bestandene Tests sind keine globale visuelle oder reale Geräteabnahme.

## Nachweise

Die Zeilen oben beschreiben den Ausgangszustand, nicht bereits abgeschlossene
Arbeitspakete. Ausgeführte Änderungen und Prüfungen werden hier je Paket ergänzt.

## Lokaler Umsetzungsstand – 24. Oktober 2026

Branch `feat/master-phase1-20261024`, Ausgangscommit
`fc596c4e67e354d464fb8eac2221ebb1ad013096`. Änderungen sind lokal und uncommitted.
**Phase 1 ist insgesamt noch nicht vollständig umgesetzt oder abgenommen.**

| Paket | Tatsächlich geändert | Stand / Grenze |
|---|---|---|
| AP1 Foundation | Bestehende Tokens für 18/14/13/12/11-px-Rollen, 20-px-KPI, 16-px-Sheettitel, 16-px-Kartenradius; Desktopfelder 14 px, mobile Felder 16 px; Suchfeldhöhe zentral vereinheitlicht | Implementiert; repräsentative Browsermessungen, keine globale Geräteabnahme |
| AP1 Navigation | Zentraler V2-Katalog, zugriffsgefilterte Hauptziele und feste Mehr-Kategorien; bestehende Dock-/FAB-Geometrie und Material bewahrt; Hilfe als abgeleitete Linkseite | Implementiert; historischer CSS-Owner und bestehende SVG-Pfade unabhängig gegen Ausgangscommit geprüft, inklusive negativer Proben |
| AP1 Konto/Header | Persönliche Konto-/Sitzungsziele, fachliche Ziele in Unternehmenseinstellungen, kompakter Haupt-/Detailheader, vorhandene Popover auf Desktop für Aktionsauswahl | Implementiert; noch keine vollständige Rollen-/Gerätematrix |
| AP2 Kunden | Liste ohne KPI/Ort, Firmenname/Status/Kontakt; Dossier Übersicht/Dokumente/Verlauf, Kontakte in Übersicht, Entwicklung nur aus UI entfernt; Kontaktimport im Detailheader | Implementiert; reale mobile Liste und Dossier geprüft, leere Testkontakte, keine globale Abnahme |
| AP2 Dokumentlisten | Nummer/Status oben, Firma/Datum und vollständiger Betrag unten im vorhandenen ListRow | Implementiert; vollständige Sprach-/Langtext-Browsermatrix offen |
| AP3 Dokumenteditor | Umfangreiche Bearbeitung als Seite; kompakte Positionszeilen, Haltegriff, Pfeiltasten, Wischaktionen, Alternativen im Positionsformular; vorhandene Summen/Quellen unverändert | Implementiert; Reorder-/Quellschutz und echte Positionsformularabläufe geprüft; echte Touch-Gesten/physische Geräte noch offen |
| AP3 Dirty State | Bestehender zentraler Schutz; Seite und kleines Positionsformular getrennt; einheitlich Weiter bearbeiten/Verwerfen | Mobile Browserfälle unverändert/geändert/zurückgesetzt geprüft; weitere Fehler-/Browser-Zurück-Kombinationen offen |
| AP4 Finanzen | Vorhandene Vergleichsbalken auch in Finanzübersicht; keine Nullwert-Tracks; unbekannte Daten werden nicht als vollständige Werte erfunden | Implementiert, Rechenlogik unverändert; bestehender Finanzregressionstest bestanden |
| AP4 Zeit | Start/Fortsetzen blau, Pause neutral, Stoppen rot; Suchwerkzeuge nur in Einträgen; tatsächliche Review-Status inklusive Zurückweisung; getrennte Mehrfachauswahl | Implementiert; gemeinsame Einzel-/Sammeltransition, atomare Transaktion und Audit mit realer Datenbank getestet |
| AP5 Betreiber-MFA | Expliziter Entra-MFA-Nachweis an Identität und bestehende Session gebunden; direkte produktive Operator-Session/API-Zugriffe ohne Nachweis gesperrt | Code und Claim-Gegenproben geprüft; echte Entra-Claim-/Conditional-Access-Konfiguration extern ungeprüft, vor einem Deployment nachzuweisen |
| AP5 Firmen-MFA | Migration 0105, zentrale mandantensichere Policy mit frischer Authentifizierung, Enrollment-Zugang, Sperre gewöhnlicher APIs/Opt-out/alternativer Sessions | Implementiert und mit tatsächlichem RBAC/RLS/Audit in isoliertem PostgreSQL/PGlite geprüft; keine produktive Migration |
| AP6 Benachrichtigungen | Vorhandene In-App-/E-Mail-Strecken bewahrt | Keine vollständige neue Ereignisabnahme. **Web-Push-Subscription, Sender und Dispatch sind noch nicht implementiert**, fehlende externe Konfiguration/Zustellnachweise ebenfalls offen. Push bleibt wahrheitsgemäss nicht verfügbar |
| AP7 Sprachen | Neue Meldungen in EN/FR/IT/TR; bestehender Übersetzer unterstützt einen tatsächlichen vierten Katalogwert für Türkisch; V2-Ziele auf Türkisch | Teilweise. 110 von 3566 App-Katalogeinträgen mit TR, **3456 ohne TR**, alle 13 allgemeinen Templates noch ohne TR. Zeitraumkatalog separat bereits fünfsprachig. Kein vollständiges Türkisch behauptet |
| AP7 Formate/Recht | Bestehende zentrale Formatierung und freigegebene Rechtsquellen beibehalten | Weitere hart auf de-CH gesetzte Anzeigeaufrufe und vollständige Sprach-/Rechtsabnahme offen |
| AP8 Abnahme | Tatsächliche lokale Anwendung mit separater `binso_phase1_ui_test`; Dashboard und Kundenliste bei sieben Breiten in Hell/Dunkel gemessen | Repräsentative Prüfung bestanden; alle Rollen/Sprachen/Seiten, echte iOS-PWA und vollständige Browser-/Release-Matrix offen |

### Konkrete Browsernachweise

- Die neue lokale Vorschau verwendet Port 3101 und die tatsächlichen Komponenten;
  Port 3100 aus dem alten Checkout ist kein Nachweis dieser Änderungen.
- Mobile Positionsfelder: drei Text-/Zahlfelder mit **16 px / 48 px**; Desktop:
  dieselben drei Felder mit **14 px / 48 px**. Checkboxen sind keine Textfelder.
- Im Positionseditor genau ein Dialog, kein äusseres gestapeltes Dokument-Sheet.
- Unverändertes Positionsformular schliesst ohne Nachfrage. Geänderte Beschreibung
  löst Verwerfen-Dialog aus. Auf den Ausgangswert zurückgesetzte Beschreibung
  schliesst wieder ohne Nachfrage. Geänderter Seitenentwurf ist separat geschützt.
- Mobile Kundenliste und Dossier: V2-Ziele, drei Register, keine horizontalen
  Überläufe in den gemessenen 390-px-Ansichten. Testdaten ausschliesslich lokal.
- Lokale Screenshots liegen im Workspace unter `phase1-evidence/`.
- Der erfolgreiche Produktions-Build läuft für die sichtbare Vorschau unter
  `http://127.0.0.1:3101/kunden`; die Testherkunft ist konsistent konfiguriert.
- Dashboard/Kunden: 28 Messungen (320/360/390/430/768/1024/1440, Hell/Dunkel),
  keine horizontalen Überläufe; vier gleich hohe KPI-Karten. Kundensuchfeld
  durchgehend 48 px, Text 16 px bis 760 und 14 px darüber.
- Reale Sortierauswahl öffnet am Icon, Name Z–A ändert die Reihenfolge und zeigt
  eine eigene Rücksetzzeile. Such-X leert den Text und erhält den Eingabefokus.
- Tatsächliche Finanzübersicht bei Nullwerten: keine Balkentracks. Timeransicht:
  keine Listen-Suchwerkzeuge. Diese Stichproben ersetzen keine Gesamtmatrix.

### Ausgeführte Prüfungen

Bestanden: `registration-test` einschliesslich tatsächlicher Firmen-MFA- und
Sammelzeit-API-Gegenproben; `phase1-identity-test`, `phase1-time-status-test`,
`document-lines-test`, `document-presentation-test` (PDF/QR/Summen/Minutenbindung),
`finance-analysis-final-test`, `navigation-contract-test`,
`navigation-foundation-test`, `app-workspace-test`, `module-profile-test`,
`ui-foundation-test`, `global-ux-startup-test`, `task-focused-ux-test`,
`creation-chrome-test`, `operator-contract-test`, `ux-master-v5-test`,
`theme-selfcheck`, `auth-integrity-test`, `localization-test`,
`localization-coverage-test`, `check-css-architecture` und
`foundation-integration-test`. Gezielte TypeScript-/Lint-Prüfungen ebenfalls
bestanden. Neue Security-/Zeitprüfungen sind in die reguläre Testkette aufgenommen.

Veraltete UX-Quellannahmen wurden konkret aktualisiert: V2-Katalog statt alter
hartcodierter Navigationslinks, tatsächliche Lucide-Imports im Renderer-Test,
Positionsformular öffnen/übernehmen statt entfernter Inline-Eingabe,
Desktop-Referenzschrift 14 statt 15 px. Negative Berechtigungs-, Icon-, Material-,
Geometrie- und Datenintegritätsproben bleiben aktiv. Kein Gate deaktiviert und
keine Bildreferenz pauschal neu erzeugt.

Der erste abschliessende Build/Code-Check fand einen Fehler in der neuen
Kontaktimport-Steuerung; er wurde korrigiert. Wiederholter vollständiger Lint-Lauf
und Produktions-Build bestanden. Im abschliessenden fokussierten Lauf bestand
die strenge Inventarprüfung zunächst wegen eines nach der Katalogformatierung
veralteten Quellfingerprints nicht. Das aktuelle Inventar wurde ohne Änderung
der Abnahmestände aktualisiert; dieselbe Prüfung bestand danach unverändert.
**Keine vollständige Test-/Browsermatrix und keine globale
visuelle Freigabe vorhanden.**

Weitere tatsächlich beobachtete offene UX-Punkte: Die Darstellungsseite hat
noch einen wiederholten Abschnittstitel und zeigt beim ersten Laden kurz den
allgemeinen Einstellungs-Fallback. Nicht als behoben oder global abgenommen
ausgeben. Web-Push und die übrigen TR-Texte sind Implementierungslücken, nicht
lediglich fehlende externe Nachweise. Der Stand wird zur visuellen Prüfung
gezeigt; keine Produktionsfreigabe ableiten.

Die Desktop-Bildaufnahme im schmalen In-App-Browser wird beim breiten Viewport vom Browser hochskaliert und ist dadurch weich. Layout-/Schriftmasse stammen aus dem tatsächlichen DOM, nicht aus nachbearbeiteten Bildern. Für eine scharfe Desktop-Sichtfreigabe ist ein entsprechend breites Browserfenster erforderlich.

## Zeitfenster 24.10.2026, 14:40–14:55 UTC
Ergänzt: Web-Push-Gerätefreigabe mit web-push 3.6.7, Erweiterung der bestehenden Geräte-Tabelle (0106), Verschlüsselung der Endpunkte/Schlüssel, mandanten- und sitzungsgebundene Registrierung, erlaubte Browser-Push-Hosts, explizite Themenpräferenzen, Service-Worker-Empfang und generischer Benachrichtigungstext. Operator-Versand ist über die bestehende MFA/Rollenprüfung geschützt. Fehlende VAPID-Konfiguration bleibt sichtbar deaktiviert. Provider-Annahme ist kein Zustellnachweis; unklare Sendefehler werden nicht blind wiederholt. Nach einem Prozessabbruch zwischen Versand und Transaktionsabschluss bleibt eine mögliche Wiederholung bestehen (stabiler Tag/Topic).
Zusätzlich: doppelten Darstellung-Titel entfernt, zentrale Einstellungsüberschriften beim ersten Laden präzisiert, Datumsdarstellung in Benachrichtigungen und Sicherheit an die gewählte Sprache gebunden. Neue Push-Texte in EN/FR/IT/TR ergänzt.
Nachweis: registration-test mit tatsächlichen Migrationen, eingeschränkter Datenbankrolle, Registrierung, SSRF-Abwehr, verschlüsselter Speicherung, privatem Payload, Wiederholungsvermeidung und 410-Bereinigung erfolgreich. Netzwerkversand im Test durch einen Sink ersetzt; keine externen Pushs. Build und gezielter Lint siehe .qa-phase1/push-build.log und push-lint.log.
Offen: automatischer Hintergrund-Dispatcher/Scheduler, produktive VAPID-Konfiguration, tatsächlicher iPhone/iPad-PWA-Empfang und Gerätefreigabe, vollständige TR-Bestandsübersetzung (weiterhin mehrere tausend Texte und Templates), erneute visuelle Gesamtprüfung und vollständige Phase-1-Abnahme. Keine GitHub-Aktion und kein Deployment. Diese Ergänzung ersetzt keine frühere offene Abnahme durch eine Behauptung.

## Folgeauftrag: Hintergrundversand, höchstens 30 Minuten, ohne Tests/Abnahme

Auf ausdrücklichen Wunsch: nur Codeanpassungen und Anbindungsdokumentation; keine weiteren Übersetzungen. `instrumentation.ts`, `lib/server/push-worker.ts` und `push-config.ts` ergänzen einen explizit aktivierbaren serverseitigen Versandlauf ohne neuen öffentlichen Cron-Endpunkt. Der Versand beansprucht Gerät/Nachricht vor Netzwerkzugriff dauerhaft und führt Provider-I/O ausserhalb der Datenbanktransaktion aus; unterbrochene Aufträge werden unklar statt erneut gesendet. Neue Migration 0107 ergänzt Lebenszyklusdaten und VAPID-Gerätebindung; sie wurde hier nicht angewandt. Gerätefreigabe berücksichtigt Schlüsselwechsel und die ursprüngliche iOS-Benutzeraktion, Abmeldung bleibt ohne Versandkonfiguration möglich. Spesen- und Sicherheitspräferenzen sind über die bestehende Einstellung erreichbar. Der geschützte Operator-Endpunkt liefert Konfigurations-/Prozess-/Ledgerstatus und auditiert manuelle Versandanforderungen.

Damit sind Hintergrundversand und Konfigurationsanbindung im Code ergänzt. Die vorher dokumentierte Möglichkeit automatischer Wiederholung nach Transaktionsrollback wird durch vorab festgeschriebene Claims ersetzt; ein Abbruch kann dafür eine unklare oder ausgebliebene Zustellung hinterlassen. Keine Exactly-once-Gerätegarantie.

**Für diesen Folgeauftrag keinerlei Tests, Lint, Typprüfung, Build, Migration oder Browser-/Geräteabnahme ausgeführt.** Frühere grüne Nachweise sind für den neuen Code nicht gültig. Die bestehende Live-Vorschau bleibt beim zuletzt gebauten Stand. Keine GitHub-Aktion, kein Deployment und keine produktive Konfiguration geändert. Aktivierung und verbleibende Grenzen stehen in [push-background.md](push-background.md).

Bearbeitungszeit dieses Folgeauftrags: Beginn 15:04 UTC, Codeabschluss innerhalb des 30-Minuten-Limits. Abschluss bleibt ausdrücklich ungeprüft; kein automatischer Versand wurde gestartet.

## Produktive Aktivierung angefragt: Releasevorbereitung am 24.10.2026

Der Nutzer hat Azure als Ziel der Aktivierung/Migration ausdrücklich gewählt. Der neue Stand liegt auf `feat/master-phase1-20261024`, basiert auf dem produktiv bestätigten Main `fc596c4e67e354d464fb8eac2221ebb1ad013096` und umfasst die bereits lokal erarbeiteten Phase-1-UX-/Navigations-/MFA-/Zeitfreigabeänderungen plus Web Push. Keine Änderung dieser Abnahmegrenzen: Übersetzungen bleiben unvollständig, echte iPhone/iPad-Abnahme bleibt offen, bisheriges eingeschränktes Releaseprofil `development` wird nicht stillschweigend zur vollständigen Produktionsabnahme.

Azure wurde ausschliesslich lesend geprüft: Produktions-App läuft, Always On ist bereits aktiv, Datenbank- und stabiler Anwendungsschlüssel vorhanden, keine Web-Push-Einstellungen vorhanden. Ein neues VAPID-Paar ist nur in einer von Git ignorierten lokalen Konfigurationsdatei vorbereitet; weder Schlüssel noch private QA-Ausgaben gehören zum Commit. Noch keine produktive Einstellung geschrieben, Migration ausgeführt oder Nachricht gesendet.

Releasevorbereitung: vollständiger Lint und Typprüfung bestanden; Produktions-Build bestanden (vor den abschliessenden kleinen Versand-/Testadapterkorrekturen; exakter Kandidaten-Build bleibt CI-Pflicht). Lokalisierungs-Render-/Copy-Prüfung bestanden. Tatsächliche Migrationen 0105–0107 und die eingeschränkte Runtime-Prüfung liefen in einem frischen lokalen PostgreSQL-16-Container erfolgreich. Reale PostgreSQL-API-/RLS-Prüfungen bestehen einschliesslich konkurrierender Versand-Claims, unklarer Netzwerkantwort, unterbrochenem Claim ohne Neuversand und 410-Gerätebereinigung. Kein externer Provider kontaktiert.

Dabei korrigiert: SELECT-FOR-UPDATE wertet zurückgegebene Zeilen aus; der PGlite-Testadapter bildet SELECT-Zeilen wie PostgreSQL ab. Der bestehende Einstellungen-Rendervertrag bindet die tatsächliche neue Gerätekomponente ein und verlangt alle zentral definierten Präferenzen mit eindeutigen zugänglichen Namen.

Der lokale breite Paketlauf ist **nicht vollständig grün**: zuerst fehlte im isolierten Render-Test die neue Komponente (behoben und gezielt erneut bestanden); weitere bestehende Gates benötigen Bash/Python bzw. Unix-Sockets und scheitern in dieser Windows-Umgebung. Diese Gates bleiben unverändert und müssen in Linux-CI bestehen. Keine erfolgreichen Gesamtprüfungen oder Gerätefreigaben daraus ableiten. Vor produktivem Merge/Migration/Deployment gilt weiterhin die Exact-SHA-Freigabe aus AGENTS.md. Nach erfolgreichem Deployment erfolgt die separate, ausdrücklich beauftragte Push-Konfiguration mit dem vorbereiteten Paar; private Werte bleiben ausgeblendet. Persönliche Gerätefreigaben werden niemals automatisch gesetzt.

CI-Korrekturen nach dem ersten Releasekandidaten: Die Anwendung bleibt gegenüber 51cee9dc unverändert. Isolierte Statistik-/Migrations-/Zeitfreigabe-Adapter binden die vorhandenen tatsächlichen Abhängigkeiten ein. Der gemeinsame Browservertrag verlangt die ausdrücklich freigegebenen 11 px für Navigation und Badges, mit Gegenproben für zu kleine bzw. zu grosse Werte; Clipping, Touchflächen, Tastatur, Material und Farben bleiben geprüft. Die Hilfeseite ist im separaten Phase-1-Routenzusatz sowie in Chromium-/WebKit-Full-QA erfasst und bleibt nicht abgenommen. Ausführbare Style-Werte und deren Beschreibungen folgen den dokumentierten Phase-1-Tokens; statische Komponentenregister wurden aktualisiert, ohne Abnahmestände/Evidenz zu erhöhen. Betroffene lokale Verträge und Lint bestehen; Linux-CI und abschliessende Exact-SHA-Freigabe des korrigierten Kandidaten bleiben erforderlich.

Weitere Browservertragskorrekturen: Dokumentbeträge werden ausdrücklich in der zweiten Zeile geprüft, einschliesslich negativer Gegenproben für Überlappung, Clipping, dritte Zeile und fehlenden Status. Dokumenteditoren sind die freigegebenen Vollseiten; Positionseditoren werden auf Desktop/Mobile über denselben zentralen Zeilenauslöser geprüft. Rabatt-/Minuten-Persistenz, Wiederholungsvermeidung und Konfliktschutz bleiben unverändert geprüft. Kunden-Tastaturtests folgen Übersicht/Dokumente/Verlauf und vollständig antippbaren Kontakten; Bestätigungen verwenden den zentralen Verwerfen-Text. Gezielt ausgeführte Verträge und Lint bestanden; neue CI-Browserausführung bleibt erforderlich. Kein Anwendungscode und keine produktive Konfiguration wurden dabei geändert.

Lokale Browsernachweise für die Vertragskorrekturen: Rechnungsbereitschaft, Rabatteditor (Desktop/Mobile mit Persistenz, Fehler/Wiederholung und stale Revision), Profilbilder sowie Kundendossier einschliesslich Tastatur, Nur-Lesen und Leerzuständen bestanden. Die deutsche helle Desktop-Stichprobe bestand 20 Fälle auf fünf Breiten (1280–3840 px). Keine Geräteabnahme oder vollständige Sprachmatrix daraus ableiten. Erneute Linux-CI bleibt vor Merge erforderlich; technische Inventar-Fingerprints wurden nach den Skriptänderungen neu erzeugt.

Vollständiger Releasevorlauf 132c5111: Build, Scanner, Verträge, CodeQL und die separaten Rabatt-/Rechnungs-/Profil-/Desktop-Sprachstichproben bestanden; der vollständige Browserlauf scheiterte und ist ausdrücklich kein Releasebeleg. Weitere alte Erwartungen betrafen Navigation V2 (Aufträge direkt, Finanzen unter Mehr), Vergleichsbalken statt Monatsdiagramm in Finanzen sowie die Formularaktionen nach Schritt eins. Diese Verträge wurden ohne Verlust der Betrags-/Zeitraum-/Persistenz-/Tastaturprüfungen angepasst; Monatsbuckets bleiben am tatsächlichen Dashboard geprüft. Die Benachrichtigungsfixture liefert die vorhandene Kanalfähigkeitsantwort, die neue Sicherheitsansicht eine unveränderte optionale Testpolicy.

Zusätzlich tatsächlich gefundene Darstellungs-/Fokuskorrekturen: allgemeine Kontext-/Kompaktlisten-Textregeln überschreiben Status-Badges nicht mehr; useDialogFocus merkt den echten Auslöser vor inert und lässt vorübergehenden Body-Fokus den Rückgabepunkt nicht ersetzen. Ein Test führt den tatsächlichen Hook gegen synchronen inert-Fokusverlust aus. Kein Finanz-, Berechtigungs-, MFA- oder Migrationscode wurde dabei geändert. Lokaler Finanzlauf und vorhandene vier Sprach-/Persistenzprüfungen auf Mobile/Tablet/Desktop bestanden. Abschliessender Browserlauf, CI und neue Exact-SHA-Freigabe der kleinen Anwendungskorrekturen bleiben erforderlich. Keine produktive Änderung ausgeführt.

Nachkorrektur aus tatsächlichen Prozessläufen: Ein verworfener Positionsdialog darf die Wiederherstellung des Vollseiten-Dokuments nicht löschen; Browsernachweis inklusive Neuladen bestanden. Die zentrale Fokusverwaltung speichert den Auslöser vor Hintergrundsperren, ignoriert Body-Zwischenzustände, erhält ihn beim responsiven Panelwechsel und gibt Fokus erst nach allen Sperren-Aufräumschritten zurück. Die Menüregression bestand nach der nachgelagerten Rückgabe auf allen sieben eingebauten Breiten; der zusätzliche mobile Panel-Neustart wird mit tatsächlichem Hook und React-Steuerelementen geprüft. Dies erweitert die Nachkorrektur gegenüber 132c5111 um Entwurfserhalt und zentralen Fokus, ohne Geschäfts-/MFA-/Migrationslogik zu ändern. Abschliessende Linux-Vollprüfung und Exact-SHA-Freigabe bleiben offen.

Abschliessende gezielte Nachkorrektur-Prüfungen: tatsächlicher Fokus-Hook inklusive responsiver Neuinitialisierung und externer Header-Sperre bestanden; 16 echte React-Steuerelementefälle mit expliziter Fokusrückgabe an Suche und Benachrichtigungen bestanden. Entwurfsownership, Architektur-Fingerprint und Lint bestanden. Anwendung zuletzt vollständig gebaut; danach nur die im gezielten Hook-/React-Test geprüfte Auslöser-Referenz ergänzt. Der neue Kandidat benötigt weiterhin vollständigen Build/Browsernachweis in Linux-CI und eine neue Freigabe vor produktiven Schritten. Kein Merge, produktive Migration, Deployment oder Push-Aktivierung durchgeführt.

Release-Nachlauf a5f6cfda: Alle acht Browserjobs des vollständigen Linux-Laufs sowie des PR-Laufs bestanden. Die nachgelagerte Messauswertung meldete ausschliesslich 710 alte Navigationsziel-Vergleiche (Finanzen statt ausdrücklich freigegebenem Aufträge) und 484 identische Such-/Filterhöhen-Vergleiche (tatsächlich 48/44 px bei exakt gleicher vertikaler Mitte). Eine separate Phase-1-Zielreferenz erhält sämtliche historischen Geometriewerte; v4 bleibt unverändert archiviert. Der Kontrollvertrag folgt den expliziten Feld-/Touchhöhen. Gegenfälle prüfen alte Ziele, veränderte Dockhöhe/-position, zu kleine/grosse und versetzte Filter, Reihenfolge und Tabs. Keine Anwendung, Migration, Berechtigung oder Finanzberechnung verändert; vollständige CI und Exact-SHA-Freigabe des neuen Kandidaten erforderlich. Keine Produktion geändert.

Gezielte Nachprüfung der Messverträge: tatsächlicher Chromium-Browserlauf inklusive neuer Navigations-/Höhen-Gegenfälle, Registry-/Quellenidentitäts-/Report-Gegenprüfungen, Navigation-V2-Vertrag und Lint bestanden. Die absichtlich manipulierten Quellen im Report-Test werden weiterhin abgewiesen. Keine historischen Referenzdateien überschrieben; kein Akzeptanzstatus angehoben.
