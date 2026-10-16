# V24 – Konsolidierter Stand und verbleibende Arbeit

## Flow Noir – freigegebener mobiler Entwurf vom 16.10.2026

Ausgangsstand: `1f01c12c805d7cf1d09cda2e4f902965fb856b68`. Umsetzung und GitHub-Push wurden im Chat ausdrücklich beauftragt. Branch: `codex/flow-noir-ui`, PR #259. Diese Änderung ist keine Produktionsfreigabe.

- Die freigegebene Referenz steht unverändert unter `docs/assets/flow-noir-20261016/approved-mobile-reference.html`. Sie enthält ausschliesslich simulierte Daten; die Anwendung übernimmt keine Beispielidentitäten oder Beispielkennzahlen.
- Schwarze Kopfzeile, weisse Arbeitsfläche, Sand-/Salbei-Aktionen und Apricot-Statusfarben sind über zentrale Tokens umgesetzt. Dunkle Darstellung bleibt funktionsfähig. Mobile Navigation: Start, Kunden, Rechnungen, Mehr. Zeit und Finanzen bleiben über Mehr erreichbar.
- Die Startseite verwendet das echte Profil, die Schweizer Geschäftszeit und die aktuelle Sprache. Rechnungsanlage erhält den bisherigen Rücksprungkontext. Aktionen konsumieren den vorhandenen Rollen-/Tarif-/Read-only-Kontext. Für Read-only-Nutzer bleibt die bisherige unabhängige Support-Aktion verfügbar.
- Die kompakte Umsatzkarte summiert alle signierten Umsatzereignisse im Monat des autoritativen Finanz-Snapshots. Sie verwendet weder die letzten fünf Rechnungen noch Zahlungseingänge als Ersatz für Umsatz. Bestehende Finanzstatistiken bleiben aufklappbar verfügbar.
- Bestehende Authentifizierung, Mandantentrennung, schreibende APIs, Entwurfs-/Abbruchschutz und Datenbankmigrationen wurden nicht ersetzt. Die öffentlichen Seiten und der Operator verwenden die gemeinsamen Farb-/Feldtokens; ihre fachlichen Abläufe bleiben beim bisherigen Seitenbesitzer.
- Der Navigationsvertrag wurde für die ausdrücklich freigegebenen Ziele und Materialien aktualisiert. Zugriffs-/Scrolllogik und bestehende Icon-Implementierung sind gegenüber dem Ausgangsstand unverändert geprüft. Alte Referenzen bleiben als historische Nachweise erhalten.
- Die QA-Berichtsausgabe nutzt nun das tatsächliche Betriebssystem-Tempverzeichnis, statt auf Windows `C:\tmp` vorauszusetzen. Der lokale Start benötigt einen Shim für den Node-basierten pnpm-Aufruf; dieser Host-Shim ist nicht Teil des Repositorys.

### Nachweise und Grenzen

- Produktionsbuild, TypeScript, Lint, schneller QA-Pfad, zentrale CSS-Architektur, Übersetzungsabdeckung sowie Release-/Dokumentationsprüfungen wurden lokal ausgeführt. Regressionsprüfungen für tatsächliche Aktionsrechte, Monats-/Jahresgrenzen und negative Umsatzereignisse sowie Textkontraste beider Themes stehen in `scripts/flow-noir-test.mjs` und im normalen Testskript.
- Chromium/Edge gegen den Produktionsbuild: 72 bestandene Kombinationen aus neun Seiten, 320/390/768/1440 Pixeln und Hell/Dunkel. Enthalten sind Start, Rechnungs-/Kundenlisten und Details, Profil, Sicherheit sowie beide Anlageprozesse. Nachweis: `docs/assets/flow-noir-20261016/chromium-matrix.json`. Dies ist eine Browserprüfung mit isolierten API-Fixtures, keine Prüfung mit produktiven Kundendaten oder physischen iPhones.
- Zugehörige Screenshots: `mobile-home-light.png`, `mobile-home-dark.png`, `mobile-invoices.png` im selben Evidenzverzeichnis. Der ergänzende Chromium-Interaktionslauf ist bestanden: Suche inklusive veralteter Antworten, Konto/Avatar, Benachrichtigungen, Hell/Dunkel/System, Formulare/Abbruchschutz, direkter Anlagen-Rücksprung, Navigation und Read-only-Support. Nachweis: chromium-interactions.json; zusätzliche Screenshots: mobile-search.png und mobile-account.png. Der Interaktionslauf prüfte den Code mit dem Read-only-Support-Fix aus 24eda1125f7e91c885962fd1f1a3332e9acbde6f.
- **Der vollständige lokale Pflichtlauf ist nicht bestanden.** Der bestehende Monitoringtest benötigt Bash/POSIX-Ausführung; der Datei-Rescan prüft POSIX-Eigentümerrechte über `process.getuid`, das Windows nicht anbietet. Auch der Scanner-Protokolltest schlägt auf diesem Host fehl. Eine unveränderte Authentifizierungs-Fixture meldet `423` statt `200`; dies wurde nicht durch eine Änderung an Auth-/Sicherheitslogik verdeckt. Der alternative In-Memory-Transport ist kein echter ClamAV-Nachweis.
- Der erste GitHub-Linux-Lauf auf 386de8335630336949c166455a78f0054c7e80b1 bestand checks, build, scanner-engine, ux-compliance und quality; Browser wurden wegen des Draft-Status dort ausdrücklich ausgelassen. Der aktuelle Folge-Commit benötigt seine eigenen GitHub-Nachweise. Vollständige WebKit- und Produktionsfreigaben bleiben erforderlich. Keine automatische Hochstufung früherer V24-Abnahmen, kein Merge und kein Deployment durch diese Umsetzung.

### Korrektur des fehlgeschlagenen Ready-Laufs #38831353373

Der vollständige GitHub-Lauf auf eb5e2e3763e37dca82e0c620b8cf1d0fd1facb97 bestand Build, Checks, Scanner, Chromium und WebKit. Die nachgelagerte UX-Aggregation blockierte mit 612 alten Navigationsvergleichen und 150 Aktionsabstands-Messungen. Ursache: noch aktive Glas-Referenz v2 sowie Layoutrechtecke unsichtbarer Schaltflächen in geschlossenen details-Elementen.

- Explizite Referenz v3 für den im Chat freigegebenen Flow-Noir-Dock. Sechs Breiten, beide Themes, konsistente Geometrie aus Chromium und WebKit des obigen GitHub-Laufs. v1/v2 bleiben erhalten; keine automatische Baseline-Aktualisierung.
- Aktionsabstand verwendet gerenderte Sichtbarkeit statt allein getClientRects. Regression reproduzierte den Fehler zuerst; geschlossene und geöffnete Bereiche, echte Überlappungen und blockierte Scrollendpunkte sind geprüft. Stabiler Scrollendpunkt bleibt Pflicht, mit zehn Sekunden Zeitbudget bei paralleler Browserlast.
- Dashboard-Prüfung wartet auf die tatsächliche Umsatzkarte statt unmittelbar deren Anzahl während des Ladens zu zählen.
- Erneute lokale Abnahme gegen denselben Produktionsbuild: 84 Seiten-/Theme-/Breitenkombinationen bestanden; 92 einzelne aktuelle Compliance-Evidenzen, keine fehlgeschlagenen Messungen. Bericht mit --static --gate bestanden. Sieben Seiten: Dashboard, Willkommen, Demo, Preview-Dashboard, Zeit, Kunden und Rechnungen; 320/375/390/430/768/1024 px, Hell/Dunkel. Nachweis: chromium-compliance-fix.json.
- Getesteter Arbeitsbaum auf Elterncommit eb5e2e3763e37dca82e0c620b8cf1d0fd1facb97, Source-Digest ceca54cc4e2581bb5e020f4c2068aefc56d9712fef633f174645126a588c5989. qa:fast mit TypeScript, Lint, Architektur, Vertrags- und Compliance-Selbsttests bestanden. Die neue GitHub-Abnahme bleibt bis zum Abschluss offen; keine Produktionsfreigabe.

Stand: 15.10.2026. Aktualisierung: Nutzer hat am 15.10.2026 um 20:24:41 Europe/Zurich den Weg bis Deploy ausdrücklich freigegeben. Keine vollständige V24-/Produktionsabnahme; Details und Profiltrennung in ux-enforcement-phase.md. Historische Phasenangaben unten bleiben als damaliger Stand erkennbar.

## GitHub-Abgleich

- Offene PRs: #251 Baseline, #252 Erstellen-Foundation, #253 zusammengeführter Kandidat.
- PR #253 ist der konsolidierte Draft-Kandidat. Veröffentlichter Basisstand dieser Fortsetzung: `2027cd68ec4574edcd5a5d6fb506312f41913415`; Main-Korrekturen aus `7bd6722c` sind enthalten. Die nachfolgend beschriebenen Geschäftsprozesse kommen als weiteres zusammenhängendes Paket hinzu.
- #251/#252 nicht zusätzlich unabhängig mergen. Die Inhalte wurden übernommen, ihre Head-Commits sind jedoch keine Vorfahren des konsolidierten Kandidaten. Eine Inhaltsübernahme ist kein Nachweis einer History-Übernahme.
- Für `2027cd68` bestanden Quality #38738851458 (einschliesslich PostgreSQL, Scanner, Build/Auth-Smoke) und CodeQL #38738851334. Browser waren im Draft planmässig ausgelassen. Das ist kein Prüfnachweis für spätere Änderungen.
- Die drei bisherigen CodeQL-Review-Threads sind aufgelöst/veraltet. Das ersetzt weder einen neuen Scan noch ein vollständiges Repository-Alertinventar. Issue #238 bleibt historischer Abnahme-Backlog; operative Anforderungen werden nicht allein aufgrund von Quellcode geschlossen.
- Produktion wurde in dieser Fortsetzung weder verändert noch neu abgenommen.

## Abgleich aller Markdown-Abschnitte

„Vorhanden“ bedeutet Quellcode bzw. dokumentierter Implementierungsnachweis, keine vollständige Abnahme jedes Unterpunkts. Die ursprünglichen Anforderungen bleiben unverändert in master-implementation.md.

| Abschnitt | Vorhanden / Eigentümer | Noch offen / erforderliche Abnahme |
| --- | --- | --- |
| 0 Regeln | Baseline, Befunde, Ledger, konsolidierter Review-Branch | Aktueller Produktions-/Artefaktabgleich und vollständige Abnahme |
| 1 Architektur | Dependency-/Lizenz-/Integrationsinventar, zentrale Domain-/Server-/Client-Eigentümer | Vollständige Support-/Breaking-Change-Prüfung, Hardcoding- und Legacy-Einzelfälle |
| 2 Sicherheit/Normen | Standards-Register, Control-Matrix, Auth/RBAC/RLS/Scanner-Gates | Vollständige Control-/Risiko-Evidenz; operative Nachweise, finaler Security-Scan |
| 3 Foundation | Bestehende sechs CSS-Dateien, Tokens, UI-/Navigations-/Daten-Foundation; keine neue CSS-Schicht | Alle Kaskaden-/Legacy-Kandidaten mit tatsächlicher Nutzung und Browserwerten belegen |
| 4 Seiten/Navigation | Hauptseitenfamilien, unveränderte fünf Nav-Ziele, kontextbezogene Erstellen-Aktionen | Vollständige Route/Zustand/Rolle/Viewport-Abnahme |
| 5 Aktionen/Forms | Zentrale Actions, Records, Sheets, Fields, Draft-/Submit-/Recovery-Eigentümer | Durchgängige Einzelprüfung jedes Formulars, direkter Einzelaktionen und aller Back-/Keyboard-Zustände |
| 6 Chat/Listen/Settings | Gemeinsame Rows, CompactEmptyState, Chat/Composer, Settings und letzter Separator zentral korrigiert | Vollständige Zustands-/Geräteprüfung und verbliebene Legacy-Nutzung |
| 7 Glass/Motion | Zentrale Glass-/Motion-/Reduced-Motion-Regeln, Navigationsschutz | Kontrast, Fokus, Fallback und Layoutstabilität auf realen Geräten |
| 8 Zahlen/Charts | MetricTiles/Statistics, vier Finanz-KPIs, Linien/Ringe, zentrale Finanzmetriken, Touch/Keyboard-Handler | Durchgängige Modulanwendung; bezahlte/offene Ringkohorten müssen vor Detailverlinkung fachlich reconciliert werden; visuelle/a11y-Abnahme |
| 9 Demo | Zwölf Monate positive/negative PostgreSQL-Daten, isolierter Seed/Reset, FK-/Summen-/RLS-Tests | Vollständige Szenario-/Modulabdeckung einschliesslich simulierter Mahnung und Rückerstattungsbuchung; externe PostgreSQL-/Browserabnahme |
| 10 Geschäftsprozesse | Kunden/Kontakte/Angebot/Projekt/Zeit/Ausgaben/Rechnung/QR/Zahlung; Gutschrift, manuelle Mahnstufen/-versand/-historie, separate Rückerstattungsbuchung, Kundendublettenprüfung bei Erstellung, Angebotsrevision mit Audit/Idempotenz | Finale Browser-/Parallelitätsabnahme der neuen Prozesse; Dublettenprüfung bei Bearbeitung; Gutschrift-PDF/Versand und buchhalterische Fachabnahme |
| 11 Admin/Lifecycle | Vorhandene Operatorbereiche, SaaS-/Billing-Integrationen, Wartung, Monitoring/Wallboard | Alle Bulk-/kritischen Aktionen, Feature-Flags, Plattformsettings und Lifecycle-Übergänge einzeln abgleichen; Betriebsabnahme |
| 12 SEO/Branding/i18n | Metadaten/Assets/Manifeste, vier Sprachkataloge, Glossar-/Lokalisierungstests | Mehrsprachige Dokument-PDFs/QR und gespeicherte Dokumentsprache ergänzt; übrige Mail-/SEO-Texte und Schweizer Fachterminologie prüfen; externe Search-Console/Bing-Einrichtung separat; visuelle Assetabnahme |
| 13 PWA/Betrieb | Service Worker ohne sichtbares Update-Banner, Recovery, Readiness-/Betriebsworkflows und Runbooks | Physische iOS-/Android-PWA, Backup-/Restore-/RPO/RTO-/Alert-/Provider-End-to-End-Nachweise |
| 14 QA | Fast lokal ohne impliziten Browser, Draft-Bündelung, Ready-/Nacht-/Full-Gates; Deploy manuell | Pflichtlauf blockiert lokal an Scanner-Socket-EPERM; vollständige finale GitHub-/Browser-/Geräteabnahme |
| 15 Lieferumfang | Ledger, Inventare, Findings, Control-Matrix, Phasenberichte, bestehende QA-/Readiness-Berichte | Alle geforderten Einzelcontracts/Matrizen vollständig verknüpfen und fehlende Nachweise liefern; Gesamtstatus bleibt offen |

Kein Fertigstellungsprozentsatz: Ein Anforderungsabsatz enthält zahlreiche Einzelbedingungen. Eine Datei oder ein bestandener Test kann nicht das gesamte Bündel als erfüllt markieren.

## Neu implementierte fachliche Korrekturen

`lib/financial-status.ts` berechnet offene Beträge nach gebuchten, aktuellen Gutschriften. `listApiBusiness` liefert dieselbe Gutschriftssumme und Historie; serverseitiger Statusfilter und Clientstatus arbeiten damit auf derselben Grundlage. Die Zahlungserfassung prüft unter bestehender Rechnungssperre den bereinigten Restbetrag und lehnt Überzahlungen ab. Originalbetrag, Rechnungssnapshot und historischer Zahlungseingang bleiben fachlich getrennt.

`lib/server/credit-notes.ts` ergänzt eine explizite Gutschriftserfassung über die vorhandenen Tabellen und die bestehende Idempotenz-/Audit-/Tenant-Foundation. POST `/api/documents/[number]/credits` prüft Sitzung, Origin, Schreib-/Tarifrechte, Eingaben, ausgestellten Status, noch laufenden Versand und Restvolumen. Gesperrte Rechnung und bestehender Dokumentzähler schützen parallele Vorgänge; dieselbe Anfragekennung liefert dieselbe Buchung. Es wird keine automatische Rückerstattung oder externe E-Mail ausgelöst. Gutschriften werden im vorhandenen FormSheet erfasst und in der Rechnungsansicht dargestellt. Storno einer Rechnung mit Gutschriften ist blockiert. Die Gutschrift nutzt die bestehende Tabelle; die weiteren Prozesse ergänzen Migrationen 0051–0054. Keine Produktionsmigration wurde ausgeführt.

Zusätzlich implementiert:

- Manuelle Zahlungserinnerung/1. und 2. Mahnung: bestehender Versand-Outbox mit Stufe, Frist und Restbetrag; keine automatische Eskalation/Gebühren. Berechtigung, Überfälligkeit und Zahlungssaldo werden vor Versand erneut geprüft; Historie und stabile Retry-Kennung im bestehenden Sheet. Demo versendet weiterhin nicht extern.
- Rückerstattung als separate Buchung eines bereits extern ausgeführten Geldrückflusses: begrenzt auf tatsächlich bezahltes Kundenguthaben, mit Originalzahlungen, Datum, RLS, Audit und Replay-Schutz. Keine Bank-/Stripe-Auszahlung. Cash-Statistik berücksichtigt den Rückfluss am tatsächlichen Datum, Umsatz wird nicht doppelt vermindert und die Forderung nicht wieder eröffnet.
- Kundendubletten bei Erstellung: normalisierte UID, E-Mail und Name, mandantenisoliert, Hinweis mit Links und ausdrücklicher Bestätigung eines separaten Kunden. Serverseitige Sperre schützt auch parallele Erfassungen; Entwurf und Wiederholung behalten die Bestätigung.
- Angebotsrevision: neue Nummer und Entwurf aus bestehendem Angebot mit Positionen und authored Texten. Erst Ausstellung der neuen Version markiert das alte Angebot als überarbeitet; zwischenzeitliche Annahme blockiert die Ablösung. Verknüpfte Historie, Rollen-/Tarifprüfung und Idempotenz.
- Dokument-PDF: Restbetrag inklusive Gutschriften/Rückerstattungen, korrigierter QR-Betrag und DE/FR/IT/EN-Beschriftungen. Neue Dokumente speichern Kundensprache im Snapshot; bestehende ausgestellte Snapshots bleiben unverändert. Freie Benutzertexte werden nicht automatisch übersetzt.

Dies ist keine vollständige Buchführungsabnahme. Eigene Gutschriftdokumente/Versand, Fachprüfung, externe parallele PostgreSQL- und finale Browserabnahme bleiben offen.

## Neuer Prüf- und Freigabeablauf

1. Zusammenhängende Änderungen im Draft-PR entwickeln. Fast-/Integrationsprüfungen starten Browser nur mit `--browser`; statische, DB-, Security- und Build-Gates bleiben aktiv.
2. Nach Abschluss des Pakets Ready for review setzen. Die bestehenden Browserjobs laufen für den tatsächlichen Kandidaten; Nacht-/Release-Gates bleiben erhalten.
3. Tatsächlichen Main-Commit nach Integration manuell mit Quality `level=full` prüfen. Den bestehenden begrenzten Entwicklungsumfang explizit mit `release_profile=development` wählen; Standard production bleibt strikt. Standardläufe können keinen vollständigen Freigabenachweis ersetzen.
4. Nur nach ausdrücklicher Produktionsfreigabe Deploy manuell starten: vollständiger aktueller Main-SHA plus `approve_production=true` und exakt dasselbe release_profile wie im erfolgreichen Full-Lauf. Der Resolver verlangt den erfolgreichen manuellen Full-Lauf genau dieses SHAs. Derselbe geprüfte ZIP und Scanner werden übernommen. Kein automatisches Deployment nach Merge/Quality.

## Prüfstand dieser Fortsetzung

- Projekt-pnpm 10.17.1, Frozen-Installation, ohne Dependency-/Lockfileänderung.
- Lokaler Pflichtlauf `pnpm test`: blockiert bei `scripts/file-scan-test.mjs`, Unix-Socket `listen EPERM`; nicht als bestanden gewertet.
- Der erweiterte Testplan hat 39 Einträge: unabhängige Gesamtdiagnose abgeschlossen, 38 bestanden, ausschliesslich der lokale Scanner-Socket mit `listen EPERM` blockiert. Keine Quellcodeänderung während dieses Laufs. Die Diagnose ersetzt das Pflicht-Gate nicht.
- Neue Prozessprüfungen in `scripts/migration-test.mjs`: vollständig migrierte eingebettete PostgreSQL-DB, Rechte/RLS, Audit, Replay-/Payloadkonflikte, Mahnstufen/Fristen/Versandfehler, Zahlungsänderung vor Versand, Erstattungsgrenzen/Originalzahlungen, Dubletten sowie Angebotsrevision inklusive Annahmerennen und eingefrorener Sprache. Gezielter Lauf bestanden. Zusätzliche echte Parallelitätstests sind für den PostgreSQL-CI-Job ergänzt.
- Dokument-PDF-Tests prüfen tatsächliche DE/FR/IT/EN-Ausgabe, QR-Restbeträge und gespeicherte Sprache. Statistikprüfungen prüfen die gesonderten Rückflüsse ohne doppelte Umsatzkorrektur. Gezielte Läufe bestanden.
- Deployment-Resolver wird im vorhandenen Release-Test tatsächlich mit simulierten GitHub-Antworten ausgeführt: falscher/veralteter SHA, fehlender/fehlgeschlagener/Standard-Lauf werden abgelehnt.
- Neue Prozess-Formular-/Retry-/Historien-Regressionen im bestehenden Browsertest ergänzt, noch nicht ausgeführt. Kein separater Browserlauf pro Änderung.
- Lint, TypeScript, CSS, Produktionsbuild, Release-/Dokumentationschecks und Sprachabdeckung separat geprüft. Lint, TypeScript und Produktionsbuild sind auch nach dem vollständigen Prozesspaket bestanden; CSS-/Route-CSS-, Release- und Dokumentationschecks bestanden. GitHub-Gates des neuen SHAs bleiben offen.

## Release-Vorbereitung nach Deploy-Freigabe

Die Produktions-App wurde nachweislich in das Azure-Sponsorship-Abonnement verschoben. Nach ausdrücklicher Zustimmung vom 15.10.2026 wurde `AZURE_SUBSCRIPTION_ID` im Repository und in der Production-Umgebung angepasst. App-Name, Ressourcengruppe und Hostname bleiben gleich. Die erfolgreiche Azure-Anmeldung im Portal ersetzt keinen Nachweis der OIDC-Rollen des Deploy-Principals; der nächste Read-only-Audit/Deploy muss diese bestätigen.

Der Ready-for-review-Lauf #38748026705 bestand Checks, PostgreSQL, Scanner und Build, scheiterte jedoch in beiden Browsern. Befunde: `aria-label` am generischen Statistik-Container ohne benennbare Rolle; veraltete Browser-Erwartungen für den entfernten Dock-Erstellen-Button beim Read-only-Dashboard und Operator. Der Timeout liegt im gemeinsamen Erstellen-Szenario, nicht in der neuen Dublettenprüfung. Zentrale Chart-/Zeitraumgruppen erhalten `role=group`; Tests prüfen die bereits freigegebene seitenbezogene Einzelaktion für Support beziehungsweise Einschränkungen. Die Bottom-Navigation bleibt unverändert. Compliance hatte nach Abbruch unvollständige Browser-Evidenz und wird nicht als bestanden gewertet. Erneute Abnahme des korrigierten Quellbaums steht aus; noch kein Main-Merge oder Deploy.

## Flow Noir: vollständiger Seitenrollout, 16.10.2026

Ausgangsstand: Main `6c18886d2117780e428af6b8b24992bd97fa94c1`; Arbeitszweig `codex/flow-noir-complete`. Der Nutzer hat die automatische Übertragung des freigegebenen Schwarz-Weiss-Entwurfs auf die übrigen Seiten bestätigt. Der erste Noir-Rollout deckte vor allem das Dashboard und Farbtokens ab; diese Fortsetzung ergänzt die tatsächlichen Seitenstrukturen.

Umgesetzt: Desktop-Bereichsauswahl über dem vollbreiten Arbeitsbereich; gemeinsame Überschriften, Tabellen und zweizeilige mobile Vorgänge; Forderungsübersicht aus dem vollständigen Finanz-Endpunkt; Kundenkontaktkarte mit konsistenter Kontaktidentität und zugehörigen Dokumenten; Rechnungs-/Angebotsdetails; nummerierte Formularschritte; Profilfelder; Einstellungen, Suche und Aktionsdialoge; Projekt-/Zeitansichten; Admin-Oberflächen; öffentliche Einstiegs- und Anmeldeseiten. Beträge stammen weiterhin aus den vorhandenen fachlichen Berechnungen. Ein Stundenbudget wird als Budgetverbrauch und nicht als erfundener Projektfortschritt angezeigt.

Kundennavigation und Adminnavigation behalten ihr bestehendes Ziel-Markup, Berechtigungs-/Scrollverhalten, Icons und Navigationstokens. Die neue Referenz `docs/assets/flow-noir-complete-20261016/navigation-reference.json` erfasst ausschliesslich die freigegebenen zusätzlichen Materialregeln des Admin-Docks. Die bisherige Referenz bleibt erhalten. Das Seiteninventar zählt weiterhin 76 Quelldateien und 12 Operator-Varianten; statische Zuordnung allein ist keine visuelle Abnahme.

Prüfstand vor finaler GitHub-Abnahme:

- Produktionsbuilds, TypeScript, geänderte Dateien im Lint, sechs kanonische Stylesheets und 17 Media-Blöcke geprüft. Lokale Iterationen werden als solche geführt und nicht als Release-Abnahme ausgegeben.
- Breite Chromium-Diagnose über alle Testseiten bei 390 und 1440 Pixeln: keine verbleibenden horizontalen Überläufe oder Browser-Laufzeitfehler; zehn Fälle markierten die bisherigen randlosen Kartenregeln als veraltet. Die aktualisierten Prüfungen verlangen vollständige Kartenumrandungen und lehnen zusätzliche einzelne Trennlinien weiterhin ab. Erneute Prüfung dieser Fälle und der Bedienabläufe ist erforderlich.
- Tatsächlicher Dokumentrenderer inklusive neuer Zusammenfassung geprüft: bezahlte, stornierte und Entwurfsrechnungen fordern keine offene Zahlung; mehrsprachige PDF-/QR-Prüfungen bestanden.
- Windows-Fehler im isolierten Auth-Testloader behoben: relative Quellimporte werden mit POSIX-Pfaden auf die bestehenden Testadapter aufgelöst. Auth-Races, Quarantäne, Branding und Mandantentrennung danach bestanden; keine Produktions-Sicherheitsregel geändert.
- Öffentliche Produktbilder werden aus neuen Produktionsansichten aktualisiert; Quellcommit und Hashes werden im bestehenden Capture-Manifest dokumentiert. Versionsparameter verhindern die Anzeige alter Bild-Caches.

Noch kein Release-Nachweis für den endgültigen Commit: vollständige GitHub-Gates, manueller Full-Lauf auf dem tatsächlichen Main-SHA und anschliessender genehmigter Deploy bleiben bis zu ihren erfolgreichen Ergebnissen offen. Der bestehende begrenzte Entwicklungsumfang wird nicht zu einer vollständigen Betriebs-/Monitoring-Freigabe hochgestuft.
