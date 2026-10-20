# Gemeinsame App-Abnahme: Kunden-App und One Admin

Stand: 20.10.2026, Europe/Zurich. Geprüfte Codebasis:
`c7c95585aafd380db2c70d8a7c27fbd93bdde914`, Branch
`ux/role-business-flow-consistency`, [Draft-PR #296](https://github.com/oemercam/binso_admin_azure/pull/296).
Aufbau auf dem unveränderten offenen PR #295. Diese Abnahmeplanung integriert keinen PR.

**Gesamtstatus: NICHT ABGENOMMEN.** Lokale Teilnachweise bestehen; Quality ist
fehlgeschlagen. Vollständige Sicht-, Geräte- und Leistungsnachweise fehlen.
Diese Aussage betrifft den genannten Entwicklungsstand, nicht automatisch den
ausgelieferten Produktionsstand. Die produktive Build-SHA wurde hier nicht geprüft.

## Umfang und bestehende Regeln

Die Kunden-App umfasst die Geschäftsseiten ab `/dashboard`, nicht nur `/portal`.
`/portal` und `/portal/login` leiten nach `/login`, `/portal/registrieren` nach
`/registrieren` weiter. One Admin umfasst `/operator`, sämtliche Abschnitte,
Detailansichten und Entra-Anmeldung. Authentifizierung, öffentliche Einstiege,
Offline-, Vorschau- und Fehlerzustände gehören ebenfalls zur Prüfung.

[Routen- und Unteransichtsmatrix](app-acceptance-routes.md) ordnet alle 76 vorhandenen
Seitenrouten sowie die konkreten Operator-Varianten zu. Die Catch-all-Route ist
kein Nachweis für ihre einzelnen Abschnitte. Auch modale Bearbeitung, Tabs,
PDF-/Dateivorschau und Aktionen benötigen eigene Prüfschritte.

Dies ist ein Prüfprotokoll, keine neue UX-Foundation und keine neue Berechtigungsregel.
Massgebend bleiben [AGENTS](../../AGENTS.md), die [UX-Rangfolge](ux-current-approval.md),
[V25.1](v25-1-requirements.md), die [bestehende Abnahme](v25-1-acceptance.md) und
[Rollen-/Geschäftsabläufe](role-business-flow-consistency.md). Navigation und blauer
Plus-Button bleiben eingefroren. Fehlende Originalreferenzen, insbesondere
Operator/Dark-/Fehlerzustände, sind als abgeleitete Ansichten zu kennzeichnen.

## Status und Nachweisführung

| Status | Bedeutung |
| --- | --- |
| BESTANDEN | Konkreter Fall am genannten SHA, Gerät/Browser, Rolle und Datenzustand ausgeführt; Erwartung erfüllt; Nachweis verlinkt |
| TEILNACHWEIS | Quell-, Komponenten-, SQL- oder Emulationstest deckt einen abgegrenzten Teil ab; keine vollständige Seiten-/Gerätefreigabe |
| FEHLGESCHLAGEN | Erwartung nachweislich verletzt; Fehler und Reproduktion dokumentiert |
| OFFEN | Noch nicht ausgeführt oder kein belastbarer Nachweis vorhanden |
| BLOCKIERT | Ausführung durch benannte technische Voraussetzung blockiert; zählt nicht als Erfolg |
| NICHT ANWENDBAR | Für genau diesen Fall begründet, z. B. keine Schreibaktion auf einer Rechtsseite; niemals pauschal für ein Portal |

Pro Ausführung erfassen: Fall-ID und Route/Tab/Aktion, Quell-SHA und tatsächlich
ausgelieferte Build-SHA, Umgebung, Zeitpunkt, Prüfer, Rolle, synthetischer Tenant,
Gerät/OS/Browser-Version, Viewport/Zoom/Theme, Eingangsbedingungen, Schritte,
Soll/Ist, Status, redigierter Screenshot/Video/Trace/Messdatei und Fehlerverweis.
Screenshots ohne Route/Zustand/Viewport oder alte CI-Erfolge sind keine aktuelle Abnahme.
Keine Tokens, Cookies, personenbezogenen Produktivdaten oder Secrets in Nachweisen.

## Rollen und Testbestand

| Bereich | Verbindliche Testidentitäten und Gegenfälle |
| --- | --- |
| Kunden-App | owner, admin, finance, hr, project_manager, member, reader; manager als bestehender Alias separat prüfen |
| One Admin | platform_owner, platform_admin, platform_support, platform_billing, platform_auditor; unbekannte Rolle und abgelaufene Session |
| Trennung | Zwei synthetische Tenants A/B; identische Namen und fremde IDs; zugewiesener/nicht zugewiesener Mitarbeiter; widerrufene Zuordnung; kein Operatorzugriff durch eine Tenant-Adminrolle |
| Zustände | Kein Bestand, Normalbestand, über 1000 Datensätze, lange Namen/Nummern, grosse/negative/Null-Beträge, mehrere Währungen, langsame/ausgefallene API, Offline, Read-only, Teilrechte |
| Dokumente | Entwurf, versendet, angenommen/abgelehnt/abgelaufen, Teilzahlung, bezahlt, überfällig, Gutschrift/Rückerstattung, storniert; erlaubte Übergänge anhand bestehender Serverlogik |
| Dateien | Synthetische saubere Datei, Quarantäne, abgewiesener Typ/Grösse, Scan-Ausfall, unberechtigter Download |

Rechteerwartungen werden unabhängig aus dem freigegebenen Rollenkonzept festgelegt
und gegen UI **und** API/RLS geprüft. Nicht lediglich dieselbe Produktionsfunktion
als Testoracle verwenden. Read-only muss Direktaufrufe und Schreibrequests einschliessen.
Operator- und Kundensitzung dürfen keine Daten/Cacheinhalte gegenseitig übernehmen.
Echte SSO-/Mail-/Zahlungsaktionen sind keine stillschweigend freigegebenen Tests.

## Wiederverwendbare Prüffälle

Jede anwendbare Route/Unteransicht aus der Routenmatrix durchläuft diese Profile.
Ein gemeinsamer Komponententest ersetzt nicht die Prüfung ihrer tatsächlichen Einbettung.

| ID | Konkrete Abnahmebedingung | Nachweis / Umfang |
| --- | --- | --- |
| G01 | Seitenziel und wichtigste Informationen passen zur Rolle; keine unnötigen Stammdaten-/Aktionsduplikate | Rollenrendering und echte Listen-/Detailansicht |
| G02 | Header, Titel, Status, Abstände, Ausrichtungen, Touchziele, Schrift/Zoom und lange Inhalte folgen bestehenden zentralen Ownern | Gleich grosse Referenz-/Ist-Viewports; Light/Dark/System |
| G03 | Start, Laden, leer, Fehler mit Retry, kein Zugriff, Read-only, Offline und partielle Daten sind unterscheidbar | Verzögerte/fehlerhafte synthetische Antworten; keine falschen Nullwerte oder fremden Zwischeninhalte |
| G04 | Tab/Enter/Space/Escape, sichtbarer Fokus, Screenreader-Namen, Kontrast und reduzierte Bewegung funktionieren | Tastatur und echter Screenreader; automatische Checks allein reichen nicht |
| N01 | Vorwärts, Header-Zurück, Browser-/System-Zurück, iOS-Wischgeste und Deep Link behalten den richtigen Kontext | Detail → Liste mit Suchtext, Filter und Scrollposition; vorwärts keine falsche Restaurierung |
| N02 | Navigation/Plus folgen dem bestehenden Freeze; aktive Ziele lesbar, keine Überdeckung am unteren Rand | Portrait/Querformat, kurze/lange Seite, PWA, Keyboard, Chat und Dialog |
| L01 | Suche/Filter/Sortierung wirken vor Pagination, Rücksetzen funktioniert, Gesamtzahlen stimmen | Null Treffer, 50er-Seitengrenze und Datensatz jenseits 1000; Datensatz nach Mutation erreichbar |
| F01 | Erstellen/Bearbeiten folgt FormSheet; Feldabstände, Pflichtfelder, Beispiele, Defaults und Fehlerowner stimmen | Ungültig blockiert/fokussiert; gültig genau einmal speichern; Ziel nach Speicherung prüfen |
| F02 | X/Abbrechen/Zurück fragen nur bei tatsächlichen Änderungen; Abbruch verwirft nichts ungefragt | Unberührt, geändert, Speichern fehlgeschlagen, wieder öffnen, Sessionablauf |
| F03 | Gemeinsame Auswahl öffnet passend im sichtbaren Viewport; Suche/Paging behält Auswahl/Fokus | Sheet im Sheet, lange Auswahl, Keyboard offen; kein zweites natives Auswahlfenster |
| D01 | Detail zeigt Identität, fachlich wichtigen Inhalt und Status; Stammdaten/PDF/weitere Daten erreichbar | Lange Rechnungsnummer, reduzierte Rolle, fehlende optionale Daten; keine erfundenen Werte |
| A01 | Erlaubte Aktionen sind auffindbar; Busy/Fehler/Replay verhindern Doppelschreiben | Doppeltippen, verlorene Antwort, Retry, Zustandswechsel; keine zusätzlichen Aktionsowner |
| R01 | Fremde IDs/Tenants, fehlende Rollen und widerrufene Zuordnungen sind serverseitig gesperrt | UI plus echte authentifizierte HTTP-/RLS-Prüfung mit positivem Kontrollfall |
| R02 | Login/Logout/MFA, Sessionablauf, Accountwechsel und Rückkehr führen zu passenden sicheren Ansichten | Keine alten Tenantdaten aus Cache; Entra separat prüfen |
| K01 | Kennzahl benennt Datenquelle, Zeitraum, Währung und Vollständigkeit korrekt | Fakturiertes Volumen ≠ Zahlungseingang ≠ Forderungsbestand ≠ Kontostand/Gewinn |
| K02 | Diagramm und Drilldown verwenden dieselben Summen/Filter; Zahlen ohne Farbe verständlich | Gutschrift, Rückerstattung, Teilzahlung, Null/negativ, Tastatur und grosse Werte |
| C01 | Chat nutzt verfügbaren Raum; Composer eine Zeile, wächst begrenzt; letzte Nachricht erreichbar | Tastatur öffnen/schliessen, Rotation, Hintergrund/Rückkehr, Fehler und Wiederholung |
| P01 | Richtige App-Identität, Name, Icon, Startziel und Scope bei Installation/Start | Kunden-App und One Admin separat real installieren; beide auf demselben Gerät prüfen |
| P02 | Kalt-/Warmstart und Hintergrundwechsel sind stabil, ohne Logo-/Layoutsprünge | Bildschirmaufnahme vom OS-Start bis Inhalt; langsames Netz, Themewechsel, Sessionablauf |
| P03 | Update/Offline/Rückkehr verlieren keinen Entwurf und zeigen keine fremden/gecacheten privaten Daten | Alter/offener Client + neuer Build, kontrollierter SW-Lebenszyklus, Logout offline |
| P04 | Dateien/PDF/Download/externe Links kehren korrekt in die jeweilige App zurück | iOS-PWA und Android real; keine unerwartete dauerhaft externe Navigationskette |
| M01 | Safe Areas, Overscroll, Scrollsperren, Sticky-Header, Keyboard und Rotation ohne Überdeckung/Ruckeln | Echtes iPhone Safari/PWA, Android, Tablet; Bildschirmaufnahme, nicht nur Screenshot |
| M02 | Seitenwechsel und Datenbereitschaft getrennt messen; warme Rückkehr ohne unnötigen vollständigen Neustart | Netz-/Gerätprofil, mindestens 20 Wiederholungen je Referenzablauf, Rohwerte/Median/p95 und Requestzahl |

G = gemeinsame Darstellung/Zustände, N = Navigation, L = Liste, F = Formular,
D = Detail/Vorschau, A = Aktion, R = Rechte, K = Kennzahlen, C = Chat,
P = PWA-Lebenszyklus, M = mobile Bedienung/Leistung. Für jeden Fall tatsächliche
Anwendbarkeit protokollieren. Auth/öffentliche Seiten sind kein Vorwand, R02/N01 wegzulassen.

Für M02 zusätzlich Cache kalt/warm, TTFB/Datenbereit, Layoutverschiebungen,
Netzwerkfehler und Serverantwortzeiten erfassen. Vorhandene QA-Grenzen bleiben
verbindlich. Neue gerätespezifische Zeitbudgets erst anhand der Messung festlegen
und freigeben; hier werden keine ungemessenen Millisekundenversprechen eingeführt.

## Geschäftsabläufe mit eigenständiger Abnahme

| ID | Ablauf und zwingende Gegenfälle | Status am Basis-SHA |
| --- | --- | --- |
| E01 | Registrierung → Verifikation → Login/MFA → Übersicht → Logout; ungültiger/verbrauchter Link, Fehler/Retry, erlaubte Rückkehr | Lokale Teilnachweise; echte Zustellung/SSO/Geräte OFFEN |
| E02 | Kunde mit Pflichtkontakt → Dossier → Kontakte/Stammdaten → Angebot → Annahme → Auftrag; Abbruch, Duplikat, Defaults und unveränderte vereinbarte Konditionen | Prozess-/SQL-TEILNACHWEIS; durchgehende visuelle Abnahme OFFEN |
| E03 | Mitarbeiter zuweisen → Zeit starten/pausieren/beenden → eigene Tagesarbeit → unabhängige Freigabe; fremder Kunde, widerrufene Zuordnung, Eigenfreigabe negativ | Workforce-/Prozess-TEILNACHWEIS; Geräte OFFEN |
| E04 | Monatsrapport 198 Stunden → Datei/Scan → Einreichen → Rückweisung/Korrektur → unabhängige Freigabe | Prozess-TEILNACHWEIS; echter mobiler Upload/Keyboard OFFEN |
| E05 | Freigegebene Zeiten/Spesen → Rechnung → PDF → Teilzahlung → bezahlt → Gutschrift/Rückerstattung; Replay/Überzahlung/Doppelabrechnung negativ | Prozess-/Finanz-TEILNACHWEIS; vollständige UI-Abnahme OFFEN |
| E06 | Spese → Nachweis → Einreichen → unabhängige Genehmigung → Erstattung → passende Finanzanzeige | Prozess-TEILNACHWEIS; reale Zustellung/Provider nicht ausgeführt |
| E07 | Kunden-Supportfall → Operator-Antwort/interne Notiz → Kundensicht → Abschluss → explizites Wiederöffnen | Jeweilige API-TEILNACHWEISE; durchgehende Zwei-App-Abnahme OFFEN; interne Notiz nie kundensichtbar |
| E08 | One Admin: Tenant suchen → Detail/Tabs → zurück; Audit-/Abo-/Sperraktion mit passender Rolle und atomarem Audit | Operator-Vertrag TEILNACHWEIS; gesamte Oberflächenabnahme OFFEN; ausschliesslich isolierter Tenant |
| E09 | Persönliche Einstellung → zurück mit Position; organisatorische Einstellung nur berechtigt; Fehler/Abbruch/Sessionwechsel | Navigation-/Rollen-TEILNACHWEIS; alle Einstellungsunterseiten OFFEN |
| E10 | Zwei installierte Apps → jeweiliger Start/Login → Hintergrund → Deep Link/Datei → Rückkehr → Logout/Update | OFFEN; Identitäts-/Scope-Abgrenzung siehe B03 |

## Geräte- und Betriebsprofile

| Profil | Erforderlicher Durchlauf | Aktueller Nachweis |
| --- | --- | --- |
| iPhone Safari + installierte Kunden-PWA + One Admin | Kalt/Warm, Keyboard, Scroll, Safe Areas, Rotation, Dateiauswahl/PDF, Hintergrund, SSO-Rückkehr, Update | OFFEN; kein physisches Gerät geprüft |
| iPad Safari + PWA | Portrait/Querformat, Touch/Tastatur, Split View, Dialog-/Listengeometrie | OFFEN |
| Android Chrome + beide installierten Apps | Installation/Scope, System-Zurück, Keyboard, Dateien, Offline/Update | OFFEN |
| Windows Edge/Chrome/Firefox | Unterstützte Versionen aus package.json, schmal/Tablet/Desktop, 200%-Zoom, Keyboard, Screenreader | Isolierte Edge-Controlfälle aus Implementierung: TEILNACHWEIS |
| macOS Safari | Unterstützte Version, Keyboard/Fokus, Dateivorschau, Layout | OFFEN |
| WebKit-/Chromium-Emulation | Bestehende vollständige CI-Matrix einschliesslich Operator-Varianten | Am Basis-SHA übersprungen; OFFEN, kein Ersatz für reale Installation |

Alle Profile mit beiden Oberflächen, erlaubten/abgewiesenen Rollen, Light/Dark/System
und DE; FR/IT/EN für lange Labels, Formularfehler und Authentifizierung zusätzlich.
Keine Behauptung über sämtliche Hardware: tatsächlich unterstützte Versionen aus
`package.json` protokollieren, repräsentative Geräte und bekannte Grenzen benennen.

## Tatsächliche Nachweise und Blockaden

| ID | Ergebnis am Basis-SHA | Überprüfbarer Nachweis |
| --- | --- | --- |
| V01 | BESTANDEN, begrenzter Testumfang | Am 20.10. erneut ausgeführt: permission-selfcheck, operator-contract-test, pwa-preview-test, pwa-lifecycle-test, navigation-return-test, qa-acceptance-test; alle Exit 0. Befehle: `node scripts/<Name>.mjs` nach Runtime-Aktivierung. Synthetische Operator-Auditfehler sind erwartete Negativfälle. |
| V02 | TEILNACHWEIS, nicht erneut ausgeführt | Implementierungsbericht role-business-flow-consistency.md: Typecheck/Lint/Build, Prozess-/Statistik-/Workforce-/Controltests. Keine neue Vollabnahme aus diesem Bericht ableiten. |
| V03 | CodeQL BESTANDEN | [Run 39339859070](https://github.com/oemercam/binso_admin_azure/actions/runs/39339859070), completed/success für c7c95585 |
| B01 | Quality FEHLGESCHLAGEN | [Run 39339859022](https://github.com/oemercam/binso_admin_azure/actions/runs/39339859022): checks/pnpm test meldet `ReferenceError: tenantCan is not defined`; kein grünes Gesamttestergebnis. |
| B02 | Authentifizierter HTTP-Gate FEHLGESCHLAGEN | Derselbe Run, build/Authenticated tenant, role and session HTTP gate: project_manager GET `/api/finance/overview?include=workspace`, Ist 200, erwartet 403, api-tenant-postgres-test.mjs:87. API-Teilansicht wurde legitim geändert; unabhängigen Rechtevertrag einschliesslich fehlender Accounting-Daten prüfen, nicht lediglich auf 200 umstellen. |
| B03 | PWA-Scope-/Identitätsprüfung OFFEN, konkreter Risikokandidat | `manifest-app.webmanifest`: Start /dashboard, Scope /; `manifest-admin.webmanifest`: Start /operator, Scope /operator. Zusätzlich altes `manifest-portal.webmanifest`: Start /portal, Scope /portal, aber Weiterleitung nach /login ausserhalb des Scopes. Überlappung, manifest-Auswahl und bestehende Installationen auf echtem Gerät prüfen. Noch kein nachgewiesener Gerätefehler, keine Änderung erfolgt. |
| B04 | Browserabnahme BLOCKIERT | Quality-Job browser übersprungen; PostgreSQL-Parallelgate ebenfalls übersprungen. Erfolgreiche Build-Kompilation und ux-compliance-Job ersetzen diese Nachweise nicht. |
| B05 | Geräte-/Leistungs-/A11y-Abnahme OFFEN | Keine neue reale Installation, physische iPhone-/Android-/iPad-Prüfung, Screenreader-Sitzung oder belastbare p95-Messreihe ausgeführt. Windows-WebKit-Overscroll-Fehler aus Implementierung bleibt offen. |

CI ist an PR-Head c7c95585 gebunden; GitHub verwendet für PR-Läufe zusätzlich
einen synthetischen Merge-Commit (im Build-Log 3c5a408acd0d7ec5b286905a7287ce364a5c776d).
Ein Nachfolgelauf benötigt seine eigenen SHA-/Artefaktbezüge. Keine CI-Reruns oder
Test-/Anwendungsänderungen wurden im Rahmen dieser Matrix ausgeführt.

## Ausführungsreihenfolge und Abschlussbedingung

1. B01/B02 gezielt ursächlich beheben und mit positiven sowie negativen Rollenfällen
   erneut prüfen; keine Schutztests abschwächen. PR #295-Abhängigkeit sichtbar halten.
2. Pflicht-Quality/CodeQL/PostgreSQL- und Browserprüfungen am resultierenden SHA
   bestehen lassen; Fehlzustände und offene Nachweise im Protokoll aktualisieren.
3. Isolierte produktionsnahe Testumgebung mit genau diesem qualifizierten Build,
   synthetischen Tenants/Rollen und erlaubten Testintegrationen bereitstellen.
   Nutzung von Production, neue Infrastruktur oder externe Testnachrichten sind
   durch diese Abnahmeplanung nicht freigegeben.
4. Routen-/Unteransichtsmatrix und E01–E10 mit Geräteprofilen abarbeiten. Bei Fehlern
   genaue Fall-ID erfassen und gezielt korrigieren, nicht pauschal neue Baselines akzeptieren.
5. Vor Schlussfreigabe müssen alle anwendbaren Pflichtfälle BESTANDEN sein.
   Keine FEHLGESCHLAGEN/OFFEN/BLOCKIERT-Fälle in Sicherheit, Datenkonsistenz,
   Kernabläufen oder erforderlichen Geräteprofilen. Restliche ausdrücklich akzeptierte
   nicht blockierende Einschränkungen einzeln dokumentieren; offene Pflichtfälle
   werden durch Risikoakzeptanz nicht automatisch grün.

Erst danach lautet das Ergebnis: «Kunden-App und One Admin am geprüften Build
für die dokumentierten Geräte, Rollen und Abläufe abgenommen». Keine pauschale
Garantie für jede Hardware. Produktionsmerge/-deployment bleiben separat freizugeben.

## Bearbeitung B01/B02 vom 20.10.2026

Die oben aufgeführten fehlgeschlagenen Runs bleiben historische Nachweise des
Basis-SHA. Ihre Fehler werden nicht durch eine Dokumentationsänderung als bestanden markiert.

- B01: Der isolierte Testharness von `ux-regression-test.mjs` führte die tatsächliche
  EmployeeForm ohne ihren neuen `tenantCan`-Import aus. Er erhält nun die tatsächliche
  Berechtigungsfunktion. Der extrahierte DocumentPage-Save-Handler erhält auch seinen
  hinzugekommenen `sourceLoading`-Zustand. Positive Speicher-/Replay-/Retryfälle bleiben
  erhalten; neue Gegenfälle prüfen, dass Source-/Kunden-Ladefehler und ausstehende
  Antworten keine Dokumente speichern. Der vollständige UX-Regressionsskript ist lokal
  erfolgreich, ebenso ESLint für beide geänderten Testskripte.
- B02: Der unabhängige authentifizierte HTTP-Vertrag trennt jetzt explizit den
  berechtigten Teil-Arbeitsplatz von Accounting. Owner/Admin/Finance behalten Cash;
  Auftragsleitung/Manager/Reader erhalten keine Accounting-Daten oder Cash-Snapshots.
  Auftragsleitung/Manager erhalten weiterhin keine Rechnungs-/Überfälligkeitsdaten.
  HR und Member werden vom Arbeitsplatz abgewiesen. Normal-, Cash- und Kundenkontext
  sowie ein fremder Tenant sind getrennte Gegenfälle. Der echte PostgreSQL-/HTTP-Lauf
  ist nach der Korrektur noch durch CI nachzuweisen; keine lokale Produktivdatenbank.
- Keine Änderung an Produktionsrollen, API-Verhalten, UX oder Pflicht-Gates. Der
  Source-Fingerprint wird ausschliesslich mit dem vorhandenen Generator aktualisiert.
- Zusätzlicher Vertragsabgleich: `ux-contract-check.mjs` hat einen veralteten
  Komponentengraphen in `docs/audit/v24/page-matrix.json` nachgewiesen. Vor der
  Regeneration wurde geprüft, dass alle bisherigen Seiten ausdrücklich ungeprüft
  waren und keine vorhandene Abnahme-Evidence überschrieben wird. Der vorhandene
  `ux-contract-inventory.mjs` erzeugt die aktuelle Zuordnung; anschliessend sind
  alle 76 Seiten und 34 bestehenden Owner-/Style-Regeln erfolgreich geprüft.
  Keine Regel, Assertion oder Screenshot-Baseline wurde abgeschwächt.

Zusätzliche lokale Teilnachweise: Operator-Verträge und Ankündigungs-API mit
Audit-Rollback, PWA-Lebenszyklus, Rücknavigation, Entwurfs-/Sessiontrennung,
QA-Auswahl und UI-Foundation sind erfolgreich. Die Manifest-Metadaten sind
vorhanden: Kundenrouten verwenden `customer-app-layout.tsx`, One Admin sein
eigenes Layout. Das ist keine reale Installations-/Scope-Abnahme von B03.

Fortsetzung: bestehender PR #296, keine parallele Integration. Der aktuelle CI-Run
und sein SHA werden im Abschluss beziehungsweise im PR angegeben. Routen-, Geräte-
und End-to-End-Seitenstatus bleiben bis zur tatsächlichen Durchführung offen.

### CI-Fortschritt für cf3cbd75

[Run 39341250160](https://github.com/oemercam/binso_admin_azure/actions/runs/39341250160)
hat den UX-Regressionsfehler und die Finanzrollen-/Maskierungsfälle überwunden.
CodeQL ist erfolgreich. Quality bleibt fehlgeschlagen: am danach ausgeführten
UX-Vertrag (veraltete generierte Seitenzuordnung) und an der expliziten
GET-Vollständigkeitsprüfung (noch fehlender Vertrag für `/api/customers/duplicates`).
Für die Duplikatsuche werden alle acht Rollen sowie ein positiver eigener und
ein negativer fremder Tenant geprüft; der Endpunkt wird nicht von der
Vollständigkeitsprüfung ausgenommen. Beide Folgekorrekturen benötigen ihren
eigenen aktuellen CI-Nachweis. Die Browsermatrix ist weiterhin nicht bestanden.

### Bestätigte CI-Korrektur und Beginn der Browserabnahme

- `050f1d12`: [Quality #1564](https://github.com/oemercam/binso_admin_azure/actions/runs/39341672031)
  und [CodeQL](https://github.com/oemercam/binso_admin_azure/actions/runs/39341671990)
  erfolgreich. Die ursprünglichen B01/B02 sowie die HTTP-Vollständigkeit sind
  damit tatsächlich geprüft. Der Draft-Lauf stellt Browser absichtlich zurück.
- Der manuelle [Full/development-Lauf #1565](https://github.com/oemercam/binso_admin_azure/actions/runs/39342172012)
  prüft denselben Head ohne Änderung des Draft-Status. Deployment ist ein
  getrennter, ausdrücklich freizugebender Workflow und wurde nicht ausgelöst.
  Erfolgreich: 392 Chromium- sowie 72 und 60 WebKit-Route/Theme/Viewport-Fälle
  in drei responsiven Teilmengen. Das sind Teilnachweise, keine Summe eindeutiger
  Seiten und keine physische Installation. Gesamtlauf fehlgeschlagen.
- Nachgewiesene Browser-Testdrift: Dashboard erwartete entfernte doppelte
  Schnelllinks. Es prüft jetzt genau einen gemeinsamen Erstellungs-Trigger,
  Abwesenheit der Altlinks sowie unabhängig erwartete Menüziele für Owner,
  Finance und Member; Read-only-Support bleibt separat geprüft. Gestaltung und
  Verhalten der bestehenden Navigation/Plus-Aktion werden nicht geändert.
- Die serverseitige Zeitsuche und der Wechsel Timer/Einträge sind asynchron.
  Die Gruppierungsprüfung wartet nun auf die exakte erwartete Gruppenanzahl,
  bevor sie weiterhin Anzahl, Summe, Bedienung und Geometrie prüft. Keine festen
  Sleeps, niedrigeren Erwartungen oder ausgelassenen Fälle. Der [Folgelauf #1567](https://github.com/oemercam/binso_admin_azure/actions/runs/39343221820)
  hat die Such-Rücksetzung bereits überwunden und den weiteren Tabwechsel-Gegenfall
  aufgedeckt. Dieser ist in der lokalen gezielten Time-Regressionsprüfung behoben.
- Sichtstichproben aus Artefakt `ux-browser-chromium-responsive-2-050f1d12…`
  (ID 12229747152): Kundendossier, Finanzen, Operator-Tickets bei 390px/Light.
  Ergebnisdatei: 392 Fälle, null Runtimefehler. Die Finanzaufnahme zeigt dennoch
  `undefined`: der synthetische Fixture hatte veraltete Offer-Felder statt
  `actionable_count`. Fixture auf tatsächlichen API-Vertrag gebracht, sichtbare
  `undefined`-Werte werden zusätzlich abgewiesen, echter HTTP-Vertrag prüft einen
  nicht negativen ganzzahligen Offer-Zähler. Keine Produktivursache behauptet.
- Lokal erfolgreich: exakt ein Zeiterfassungs-Browserfall mit Time-Interaktionen
  sowie zwei isolierte Dashboard-/Finanzfälle (390px/Light, Chromium/Edge).
  Vorhandener Build, synthetische API-Antworten, kein neuer Build oder produktiver
  Zugriff. Ein früherer unergiebiger lokaler PWA-Versuch wurde kontrolliert
  beendet und bleibt ohne Erfolgsnachweis.

Aktuelle Nachfolgeläufe und SHA stehen im PR #296. Fehlerhafte Vorläufe bleiben
verlinkt. Routen, fehlende Originalzustände und Geräte bleiben offen, bis die
jeweiligen Fälle tatsächlich bestanden sind; keine pauschale App-Freigabe.

### Zahlungsformular: nachgewiesene Lade-Regression

Full/development [Run 39344355315](https://github.com/oemercam/binso_admin_azure/actions/runs/39344355315)
für `247aa847` hat Build, PostgreSQL-/HTTP-Verträge, Sicherheitsprüfungen und sechs
von acht Browserjobs bestanden. Beide responsiven Teilmengen 0 scheitern an der
gleichen initialen Rechnungsauswahl. Lokal reproduziert: Beim Wechsel auf
DirectorySelect fehlte die bisherige Sperre während `invoicesLoading`. Diese wird
wieder übergeben. Der Browserfall adressiert das beschriftete Feld und dessen
zugehöriges natives Wertmodell statt des ersten Selects der gesamten Seite.
Ladesperre, Rechnungs-ID, Erhalt eingegebenen Betrags und der Notiz sowie die
Rückfrage bei ungespeicherten Daten bleiben verbindlich. Ein neuer vollständiger
CI-Nachweis ist erforderlich; die fehlgeschlagenen Jobs zählen nicht als bestanden.
Der lokale Dev-Browserlauf wurde nach 180 Sekunden am eigenen Prozessbaum
beendet. Er ist kein bestandener Gesamtnachweis. Typecheck, gezieltes ESLint,
UX-Regressions-, Architektur- und UX-Vertragsprüfung sind lokal erfolgreich;
der vollständige Zahlungsdatenablauf wird im aktuellen CI-Kandidaten geprüft.
Der CI-Nachlauf auf `146d375d` hat diesen Hydrations-/Dirty-Guard-Fall in Chromium
und WebKit überwunden. Danach meldet er beim gleichnamigen Kundenpaar drei statt
zwei Optionen: Das zentrale DirectorySelect enthält zusätzlich den unselektierten
Platzhalter. Der Gegenfall prüft nun exakt die IDs `customer-one` und `customer-two`,
beide gleichen Namen und separat genau einen leeren Platzhalter. Auswahlwechsel,
Umbenennung und Erhalt der gewählten ID werden weiterhin geprüft. Der abhängige
Fingerprint wird nach Abschluss aller Änderungen mit dem vorgesehenen Generator
erneuert; keine Hashwerte werden manuell eingesetzt.
Der Full-Lauf auf `82cb30c5` besteht die Core-Gates, meldet aber zwei weitere
asynchrone Browser-Gegenfälle: Beim Kundenwechsel erneuert DocumentPage sein
Verzeichnis und montiert den Editor neu; der Auswahlhelfer darf daher keine alte
React-Control-ID für die nachfolgende Wertprüfung festhalten. Er löst das bereits
beschriftete Feld erneut auf und prüft dessen tatsächlichen Wert. Die Dokumenten-
Tab-Prüfung wartet auf exakt zwei reale Zeilen statt direkt nach dem Tab-Klick zu
zählen. Beide Dokumente, gemeinsame Suche, Aktionsziele und der Read-only-Gegenfall
bleiben unverändert vorgeschrieben. Diese Korrekturen brauchen einen neuen CI-Lauf.

## Gezielte Abnahmefortsetzung vom 20.10.2026

Bezugsstand `2163156d9d9ced24b740de643ee01dfa847d02b3`: PR-Quality,
CodeQL und Full/development [39348704398](https://github.com/oemercam/binso_admin_azure/actions/runs/39348704398)
sind erfolgreich, einschliesslich aller acht Browserjobs. Das Compliance-Artefakt
12232677125 enthält 3581 Messfälle ohne gemessenen Fehler, jedoch weiterhin
`compliant=false`. Diese Entwicklungsqualifikation ist keine vollständige Abnahme.
Nachfolgende Änderungen benötigen eigene CI-Nachweise; alte Ergebnisse werden
nicht auf einen neuen SHA umetikettiert.

### Review-Register und aktuelle Rangfolge

[Review-Zuordnung](app-acceptance-review.csv) enthält alle 399 offenen Review-IDs
genau einmal: sieben aktuelle UX-Reviews, 338 aus V22.1 und 54 aus V22.2.
Die Zuordnung ist eine Triage, keine Abzeichnung dieser 399 Einzelfälle.
388 historische Fälle benötigen weiterhin eine konkrete aktuelle Fallbindung;
sechs aktuelle Reviews haben nur Teilnachweise, einer ist offen. Zwei dunkle
Materialregeln und die pauschale Drei-KPI-Regel sind durch aktuelle Freigaben
ersetzt. Der historische Merge-/Live-Auftrag ist in dieser Abnahme nicht freigegeben.
Kein Eintrag wurde aus dem verbindlichen Registry gelöscht oder auf passed gesetzt.
Historische Kataloge rechtfertigen weder alte Navigation noch schwarze Plus-Kreise,
dunkle Statistikflächen oder produktive Aktionen gegen die aktuelle Freigabe.

### Nachgewiesene Korrekturen dieser Fortsetzung

- `UX-CTL-001`: Die Messung verwendete veraltete Toolbar-/Filterklassen und
  ignorierte `RecordsControls` mit `.records-inline-controls` und
  `.records-filter-action`. Der zentrale Adapter erfasst nun auch diesen Owner.
  Lokale Browser-Gegenfälle prüfen richtige Anordnung sowie falsche Reihenfolge,
  Stapelung, Tabs oberhalb der Suche und unsichtbare Filter. Keine Geometriegrenze
  gelockert; fehlende Paare bleiben ohne Erfolgsnachweis.
- Rechnungsdetail, 390px/Light: Im Screenshot steht der offene Betrag sowohl in
  der primären Zusammenfassung als auch nochmals unter Zahlungsstand. Nur die
  zweite Wiederholung wurde entfernt; der gemeinsame MetricTile zeigt dort
  weiterhin den bereits bezahlten Betrag. Positive Renderingfälle für sent und
  partial prüfen genau eine primäre Restforderung, erhaltenen Zahlungseingang und
  den exakten numerischen Restbetrag. Paid-/Cancelled-/PDF-/QR-Gegenfälle bleiben.

### Sichtprüfung vorhandener CI-Artefakte

Artefakte 12232936167 und 12232781074 stammen vom Bezugsstand. Bei 390px/Light
wurden Kundenliste, Kundendossier, Rechnungsdetail, Zeit, Finanzen sowie Firma,
Sicherheit und Abonnement betrachtet. Die Referenzbilder aus Artefakt 12233105882
zeigen die originale Microsoft-Referenz bei 390px Inhaltsbreite innerhalb des
1440px Vorschau-Viewports. Rahmen, Demo-Beträge und Vorschau-Schalter sind keine
Produktvorgaben; neuere Header-/Kontakt-/KPI-/Aktionsentscheidungen haben Vorrang.

Beobachtet: offene weisse Arbeitsflächen, kompakte Geschäftsdaten, gemeinsame
Such-/Filterzeile in der Kundenliste, Status rechts, Kontakt/Stammdaten erreichbar,
vier benannte Finanzkennzahlen mit sechs Monatslabels. Der Rechnungs-Doppelwert
ist oben als konkreter Fehler erfasst. Die acht Ansichten sind Sichtstichproben,
keine Freigabe aller Zustände, Rollen, Dark-/Desktop-/Zoom-Varianten. Für Firma,
Sicherheit, Abonnement und Finanzen fehlt eine gleichwertige originale Detail-
referenz; sie bleiben abgeleitet. Neue Pixelbaselines wurden nicht akzeptiert.
Nachher-Rendering der Rechnungsansicht im tatsächlichen Browser bleibt ausstehend.

### Geschäftsabläufe: konkrete vorhandene Belege und verbleibende Grenzen

| Fall | Vorhandener Beleg am Bezugsstand | Noch fehlende durchgehende Abnahme |
| --- | --- | --- |
| E01 | registration-test: echte isolierte Mandantenanlage, Verifikation/OTP/MFA, Replay, abgelaufene Links; CI Registrierungs-/Session-Browserjobs | Reale Zustellung, echter SSO-Handoff und Geräte; keine Testmail autorisiert |
| E02 | migration-test: Kunde → Angebot → Auftrag → Zeit → Rechnung; Customer-/Document-Browserfälle, Pflichtkontakt/Dirty/Defaults | Ein ununterbrochener visueller Mehrrollenablauf mit Annahme, Abbruch und Rückkehr |
| E03 | Workforce-/PostgreSQL-RLS; Timer-/Freigaberegression; fremde Zuordnung und Eigenfreigabe negativ | Gesamter Mitarbeiter-/Freigeberablauf auf echten Geräten |
| E04 | migration-test: 198 Stunden, echte zugehörige Datei, Scan-Ausfall, Rückweisung/Korrektur und unabhängige Freigabe | Echter mobiler Dateipicker, signierter Rapport und OS-Tastatur |
| E05 | Prozess-/Refund-/RLS-Gates; echte mehrsprachige PDF/QR-Renderer; PaymentForm mit verlorener Antwort und acht aktualisierten Verbrauchern | Alle Zustandswechsel durchgehend in UI; Gutschrift/Rückerstattung und PDF-Rückkehr zusammen |
| E06 | Spesen-/Datei-/Freigabe-/Erstattungs-Integration und Expense-Browserfälle | Vollständiger Mitarbeiter-/Freigeber-/Finance-UI-Ablauf statt zusammengesetzter Teiltests |
| E07 | Operator-/Tenant-Verträge mit realen isolierten API-Antworten; Kunden- und Operator-Chat-Browserfälle | Durchgehender Zwei-App-Ablauf mit interner Notiz, Abschluss und Wiederöffnen |
| E08 | Operator-Vertrag: Rollen, Sperrpriorität, Ablauf, atomarer Audit-Rollback; Operator-/Wallboard-Browserjobs | Alle Operator-Abschnitte, Detail-Tabs und Rücknavigation zusammen; echte Entra-Anmeldung |
| E09 | navigation-return, Prozessentwürfe, Settings-Browserfälle, Serverrollenmatrix | Alle Einstellungsunterseiten je organisatorischem/persönlichem Scope und Rolle |
| E10 | PWA Offline/Restart und Startup/Session/Persistenz in beiden CI-Engines | Zwei echte installierte Apps, Scope-Abgrenzung, OS-Links/Dateien/Keyboard/Update |

Kein E01–E10-Fall wird durch das Zusammenzählen von Teiltests vollständig bestanden.
Physische iPhone/Safari/PWA-, Android-, iPad-, Screenreader- und reale p95-Nachweise
bleiben offen. In dieser Sitzung ist kein solches Gerät oder qualifizierter
installierter Geräte-Testbuild verfügbar. Keine neuen Zugänge/Umgebungen angelegt.

### Abhängigkeit und Integration

GitHub-Prüfung: #295 offen, Head `c4a55a134453d8b66555917408db4c59f6f21769`;
#296 offen/Draft, Bezugshead wie oben; beide gegen Main
`11eff375f6ebfd86ef660236004503edd1dd964f`, beide mergeable/clean.
`git merge-base --is-ancestor` bestätigt #295 als vollständigen Vorfahren von #296.
`git merge-tree --write-tree` prüft beide ohne Konflikt; weder Checkout noch Branch
oder Arbeitsbaum wird dabei gemergt. #296 enthält daher die Änderungen von #295
bereits: keine zweite Implementierung/cherry-pick. Bei späterer Integration zuerst
Abhängigkeit entscheiden und anschliessend den tatsächlichen neuen Main-/PR-Stand
erneut qualifizieren. Diese Prüfung ist keine Merge-Freigabe.
