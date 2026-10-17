# Codebase-Bereinigung: Bestand und kleine Arbeitspakete

Stand: 17.10.2026. Basis: Main `7e0556f8b72de802b145ba54cbf5d1dac6b22828`
(PR #268). Dieser Auftrag beendet die Ausweitung der Infrastrukturarbeit.
Offene Application-Insights-, Alarmzustellungs- und Restore-Nachweise bleiben
separate Betriebsaufgaben; sie sind keine Voraussetzung für diese Codebereinigung.

## Aktueller Git- und Prüfstand

- Arbeitsbaum zu Beginn sauber. Neuer Branch ab aktuellem `origin/main`;
  vorhandener Modell-A-Branch und Sicherheitsbranch nicht verändert.
- Einziger offener PR bei Bestandsaufnahme: #267, Draft, Head
  `4652bfbd51576d82f9e681f4d7da51886348a8aa`. Seine elf Workflow-/Governance-Dateien
  werden nicht in die Bereinigung übernommen. Quality und CodeQL dieses Heads
  erfolgreich; Draft-Prüfungen sind keine vollständige Integrationsfreigabe.
- Main-Quality [39023140856](https://github.com/oemercam/binso_admin_azure/actions/runs/39023140856)
  und CodeQL [39023140862](https://github.com/oemercam/binso_admin_azure/actions/runs/39023140862)
  erfolgreich. Der separate Readiness-Lauf #39023168296 scheiterte am bereits
  bekannten Monitoringbefund. Keine erneute Cloud-Diagnose oder Testauslösung.
- Das Standard-Quality-Profil ersetzt keine vollständige UX-Abnahme. Sein Bericht
  nennt 74/76 Quellrouten mit Laufzeitnachweisen; offene Nachweise bleiben offen.

## Tatsächlicher Quellbestand

Zählung aus Git-Tree und aktuellen AST-/Importinventaren, keine Dateinamen-Schätzung.
Der vorhandene Sparse-Checkout lässt `docs/evidence/` lokal aus; dessen Dateien
bleiben im Git-Bestand und werden weder gelöscht noch als fehlender App-Code gewertet.

| Bereich | Getrackte Dateien auf Basis-Main | Umfang | Verantwortung |
| --- | ---: | ---: | --- |
| `app/` | 224 | 565.268 Bytes | Next-App-Router, 76 Seiten, 103 API-Routen, Layouts/Fehlerzustände, zentrale CSS-Owner |
| `components/` | 58 | 645.785 Bytes | Shell, Controls, Fachseiten, Operator-, Dokument- und Marketingdarstellung |
| `lib/` | 113 | 801.623 Bytes | Clientzustand, Formatierung, Finanz-/Dokumentlogik, Serverdienste und Repositories |
| `config/` | 5 | 6.767 Bytes | Fachkonstanten, Navigation, Pläne und Zugriffskonfiguration |
| `scripts/` | 135 | 1.091.248 Bytes | QA, Regressionen, Inventargeneratoren, Build-/Release-Werkzeuge |
| `database/` | 56 | 208.899 Bytes | Bestehende SQL-/Migrationslinie; keine Schemaänderung vorgesehen |
| `docs/` | 1.232 | 55.293.148 Bytes | Aktuelle Architektur und grosse historische Audit-/Bildnachweise |
| `public/` | 31 | 1.411.855 Bytes | Originalbranding, Fonts, PWA und belegte Produktcaptures |
| `.github/` | 12 | 81.635 Bytes | Bestehende CI-/Security-/Release-Gates; unverändert |

Gesamt: 1.891 getrackte Dateien. Importgraph: 506 JavaScript-/TypeScript-Module
(208 App, 58 Komponenten, 108 Bibliotheken, 5 Konfigurationen, 127 Skripte),
keine statischen lokalen Laufzeitzyklen. Kein Komponenten- oder Bibliotheksmodul
ohne lokalen Import. Diese Modulprüfung allein beweist weder produktive Nutzung
aller Exporte noch das Rendern bedingter Ansichten.

Seitenfamilien: 10 Listen, 8 Details, 9 Erfassungen, 1 Bearbeitung, 12 Einstellungen,
7 Authentifizierungsseiten, 5 Dashboard-Seiten, 4 weitere App-Seiten, 1 Chat,
6 öffentliche Seiten, 5 Rechtsseiten, 5 Redirects, 2 Operator-Quellseiten und
1 isoliertes UX-Lab. Dazu 12 Operator-Dispatchvarianten. Die vollständigen
Quellpfade, Methoden, Berechtigungszuordnungen und Importkanten stehen in den
vorhandenen, neu erzeugten Inventaren statt in einer zweiten parallelen Liste:

- [Routen und Komponenten](routes.md), [maschinenlesbares UX-/API-Inventar](ux-inventory.json)
- [Abhängigkeiten und Quellfingerprint](v21-5-integration-inventory.json), [Integrationsmatrix](v21-5-routes.md)

## Architektur und zu erhaltende Funktionen

- Next 16.3.8 / React 19.3 / TypeScript; dünne Routerseiten delegieren an
  `components/pages/`, die Shell und die gemeinsamen UI-Owner.
- `components/ui.tsx`, `binso-ux.tsx`, `records.tsx`, `form-wizard.tsx` und
  `statistics.tsx` besitzen Controls, Seitenmuster, Listen, Formulare und Diagramme.
  `app-shell.tsx` und `operator.tsx` bleiben zentrale Shells, keine neue Foundation.
- Hooks: `lib/client/use-api-query.ts` (Abfragen/Datenrevision),
  `components/use-process-draft.ts`, `use-dirty-snapshot.ts`,
  `use-browser-back-guard.ts`, `use-dialog-focus.ts`, `desktop-navigation.tsx`
  sowie `useRecordsController` und `useRecordList`. Entwurfswiederherstellung,
  Fokus, Rückkehr-/Filterzustand und Sitzungsisolation sind Produktfunktionen.
- `lib/server/repositories/` liefert echte Fach-/Operator-Daten.
  Auth/Sessions, RBAC/RLS, Stripe, Graph-Mail, private Dateien/Scanner,
  PDF/Schweizer QR-Rechnungen, Zahlungen und Migrationen bleiben erhalten.
  Demo-/Preview-Endpunkte und Fixtures sind isolierte bewusste Funktionen.
- Alle 14 Manifest-CSS-Owner bleiben bestehen. 2.640 Regeln, keine
  `!important`-Deklarationen. 382 wiederholte Selektor-Kontexte und 221
  Kaskadenkandidaten sind Prüfkandidaten, kein Löschbeweis: Reihenfolge,
  Media Queries, Selektorlisten und tatsächliche Nutzung müssen geprüft werden.
- Alle elf Produktionsdependencies bleiben erhalten. Next/React, Lucide,
  PostgreSQL, PDF.js/PDFKit, SwissQRBill und Sharp haben echte Verwendungen;
  `@swc/helpers` ist eine Compiler-/Runtime-Abhängigkeit und darf nicht wegen
  fehlendem App-Import entfernt werden. Auch Typen, ESLint, TypeScript und
  PGlite sind keine ungenutzten Pakete. Keine Dependency-/Lockfile-Änderung.
- Bestehende Builds nutzen `prepare-ui-build.mjs`, Webpack und Standalone-Output;
  Fonts/PDF-Tracing und Security-Header sind funktionale Konfiguration.

## Nachgewiesen tot, Kandidat oder weiterhin benötigt

| Befund | Einstufung und Nachweis | Entscheidung |
| --- | --- | --- |
| `ProductScreen`, `ProductGallery`, `MarketingFaq` in `components/marketing.tsx` | Nachweislich ungenutzte Exporte: TypeScript-Symbolprüfung ohne Referenz; vollständige Suche in App, Komponenten, Bibliotheken, Konfiguration und Skripten nur Deklarationen; keine Route/Tests rendern oder dynamisch referenzieren sie | Paket 1 entfernt diese drei Deklarationen und ihre ausschliesslich dafür benötigten React-Imports |
| `ProductPreview`, `ReferenceFeatures`, `ProductCapabilities`, Marketingheader/-footer | Direkt von aktuellen öffentlichen Seiten importiert; echte Produktcaptures und Referenzgestaltung | Unverändert erhalten |
| Historische Inventare nennen ehemalige Marketingexports | Datiertes Quellenabbild, kein aktueller Aufrufer und keine bindende UX-Regel | Erhalten; aktuelle Inventare sind neu erzeugt |
| `.product-screen*` / `.product-gallery*` in Marketing- und Workflow-CSS | Kandidaten nach Entfernung ihrer Erzeuger; Kaskaden-/dynamische Klassenprüfung separat nötig | Noch nicht entfernt; kein CSS-Scope in Paket 1 |
| `SheetLink`, einzelne Datums-/Modulhelfer und weitere symbolisch unreferenzierte Exporte | Kandidaten; Analyse kann Framework-/Test-/Stringverwendungen übersehen | Pro Export prüfen; keine Sammellöschung |
| `responsiveQrSvg` | Im App-TypeScript unreferenziert, aber dynamisch in `pwa-preview-test.mjs` ausgeführt | Behalten; konkretes Gegenbeispiel gegen automatische Exportlöschung |
| `support-reference.ts`, `display-format.ts`, `financial-status.ts` und Statuskompatibilität im Business-Repository | Darstellungs-/Kompatibilitätslogik für gespeicherte Werte | Weiterhin benötigt; kein Entfernen oder Umschreiben persistierter Werte |
| Doppelter Angebote-Pfad in `next.config.ts` | Identischer Header-Eintrag als kleiner Konfigurationskandidat | Separates Paket mit Headergleichheitsprüfung; Security-Konfiguration hier unberührt |
| Grosse Operator-/Dokument-/Settings-/Kunden-/Zeitmodule | Tatsächlich importiert, fachlich aktiv; Grösse ist kein Totcodebeweis | Erst entlang bestehender Owner zerlegen, Verhalten und APIs erhalten |

## Priorisierte Arbeitspakete und Übergang zur UX

| Priorität / Paket | Umfang | Abnahme / Grenze |
| --- | --- | --- |
| P1 / 1: ungenutzte Marketingexports | Drei tote Komponenten, zwei unbenutzte Hook-Imports, Generatorausgaben | Gezielte Vertrags-/Architektur-/Lokalisierungsprüfungen, Lint, Typecheck, Produktionsbuild. Kein dargestelltes UI geändert, keine visuelle Gesamtfreigabe behauptet |
| P2 / 2: verwaiste Marketingselektoren | Nur nachgewiesen ungenutzte `.product-screen*`-/`.product-gallery*`-Regeln an bestehenden Ownern | Klassen-/Kaskadennachweis, CSS-/Referenzverträge und gezielter öffentlicher Desktop-/Mobile-Vergleich; `.faq-list` nicht pauschal löschen |
| P2 / 3: einzelne weitere Exporte | Kleine, getrennte Pakete für `SheetLink` und fachlich neutrale Helfer, jeweils nach Caller-/Testprüfung | Keine Sicherheits-, Finanz-, Speicher- oder Planprüfung aus statischer Unreferenziertheit entfernen |
| P3 / 4: fachliche Modulzerlegung | Zuerst klarer Teilbereich eines grossen Moduls; bestehende Controls und Daten-Hooks wiederverwenden | Verhaltens-/Berechtigungs-/Entwurfsregressionen und betroffene Browserrouten; keine neuen Prozesse |
| P3 / 5: Build-/Dependency-Vereinfachung | Nur belegt redundante Konfiguration; keine vorsorglichen Versionswechsel | Gleicher Build-/Header-/Artefaktvertrag, alle verpflichtenden Gates bleiben |
| UX-Finalisierung | Aktuelle Abweichungen in Login, Kundenliste und Dossier bei gleichen Inhaltsbreiten nachmessen, dann übrige Routenfamilien über dieselben Owner abschliessen | Originalreferenzvergleich mit echten isolierten APIs, Loading/Empty/Error/Read-only/Keyboard/Mobile; vollständige Matrix bei systemweiten UX-Änderungen und Release |

Verbindlich bleibt ausschliesslich das jüngste freigegebene
[Microsoft-Referenzpaket vom 15.10.2026](../audit/v24/reference/IMPLEMENTIERUNG.md)
mit der [bestehenden Foundation](reference-foundation.md): weisse Flächen,
zentrale Command Bar, mobile Sheets, jeweils aktuell freigegebene Navigation, echter
Datei-Button und zentrierter Ring. Historische Flow-/Noir-/Apple-/Toolbox-Vorgaben
haben keinen Vorrang. Aktuelle Source-Owner sind bereits zugeordnet; Paket 1
ändert keinen Token und ersetzt keine Foundation.

Nachtrag vom 17.10.: Die ausdrückliche neue Rangfolge hebt einen pauschalen
Schutz der alten Bottom-Navigation auf. Alte Freeze-Sätze sind keine dauerhafte
Produktvorgabe. Die vorhandenen technischen Tests bleiben bis zum nachgewiesenen
kontrollierten Ersatz aktiv; siehe [aktuelle UX-Freigabe](ux-current-approval.md).

Statischer Abgleich: Die aktuellen Theme-/Layout-Owner enthalten bereits
Inter/system-ui, den blauen Akzent `#2566bd`, 195 px Workspace-Navigation,
27 px Desktop- und 25 px Mobile-Heading sowie 5 px Desktop-/8 px Mobile-Control-
Radien. Das passt zu den Ausgangswerten der Referenz; es beweist weder die
tatsächliche berechnete Kaskade jeder Route noch eine visuelle Gesamtfreigabe.

Die [Referenzprüfung](../audit/v24/reference-foundation-review.md) dokumentiert
noch fehlende visuelle Gesamtfreigabe, abgeleiteten Dark Mode/Admin und Grenzen
der bisherigen Browsernachweise. Ältere Pilot-Restpunkte sind anhand aktueller
Quellen und neuer Renderings zu bestätigen, nicht blind erneut zu implementieren.
Neue breitflächige UX-Änderungen beginnen erst als eigenes überprüfbares Paket.

## Validierung von Paket 1

Bestanden: vollständiges `pnpm lint`, `pnpm typecheck` und die gezielten Skripte
`foundation-integration-test`, `reference-foundation-test`, `ui-foundation-test`,
`navigation-contract-test`, `localization-test`, `localization-coverage-test`,
`deployed-assets-test`, `documentation-consistency-check`.

Zusätzlicher Strukturvergleich: alle fünf verbleibenden Marketingfunktionen
quellgleich, sämtliche 76 Routengraphen, API-Imports/-Methoden, 12 Operatorvarianten,
CSS-Regeln und erreichbarer Renderkatalog unverändert. Der aktuelle
Komponentenkatalog verliert genau die drei entfernten Deklarationen.

Lokale Testvoraussetzung: Windows hatte acht HTML-Referenzdateien mit CRLF
ausgecheckt, weshalb der unveränderte Archiv-Bytehash-Test zunächst fehlschlug.
Für den Test wurden die identischen Git-/Archivbytes verwendet und danach der
bisherige Windows-Checkout wiederhergestellt. Referenzdateien, Archiv und
Hashvorgaben sind nicht Teil des Diffs. Kein Hash wurde von Hand angepasst.

Produktionsbuild `pnpm build` ebenfalls bestanden (Webpack, TypeScript und
141/141 statische Generierungen). Keine lokale Browsermatrix: erreichbare
Renderfunktionen, Routengraphen und Styles sind unverändert; dieses reine
Totcode-Paket erteilt keine neue visuelle Freigabe. Der PR muss die bestehenden
GitHub-Pflichtprüfungen durchlaufen; kein automatischer Merge oder Deploy.
Keine Gates, Assertions oder Screenshotbaselines verändert; generierte Fingerprints nur über
`node scripts/ux-inventory.mjs` und
`node scripts/foundation-integration-report.mjs` aktualisiert.
