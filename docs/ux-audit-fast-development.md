# UX-Code-Audit und schnelle Entwicklung

Basis: main `330929cdbd300f2e651c790869e3cd0f71dfa151` (PRs 215–218 integriert). Offener PR 214 stellt CodeQL wieder her; keine UX-Änderungen darin. Produktionsdaten werden durch Browser-Fixtures nicht berührt.

## Befunde und Änderungen

| Ursache | Korrektur | Betroffene Bereiche |
| --- | --- | --- |
| Operator-Mobile-Header überschreibt den opaken Standard mit Blur/Transparenz | Bestehende Regel korrigiert, kein zusätzliches Override | Operator-Header |
| Suchfelder haben einen zweiten `bo-list-search`-Stil und separaten Fokus-Override | Redundante Klasse und Regeln entfernt; `searchbox` bleibt der gemeinsame Vertrag | Kunden, Produkte, Angebote, Rechnungen, Mitarbeiter, Spesen, Zahlungen |
| Desktop-Suche und Sortierung haben unterschiedliche feste Höhen | Gemeinsamer `--control-h`-Token; Mobile nutzt den bestehenden Suchhöhen-Token | Gemeinsame Listen-Toolbar |
| Globaler Body-Clip kann tatsächliche Breitenfehler kaschieren | `overflow-x:clip` entfernt; Browser prüft echte Dokumentbreite | Gesamte Anwendung |
| Gleiche Sheet-Funktion mehrfach mit eigener Header-, Close- und Focus-Implementierung | Vorhandenes `ActionSheet` um Beschreibung/Klassen ergänzt und wiederverwendet | Kundenaktionen, Kontaktaktionen/-formular, Dokumentversand, Zeiten verrechnen |
| Mobile-Sheet-Ebene überschreibt die tatsächliche Tastatur-Viewport-Höhe mit `100dvh` | Verbleibender Override entfernt; Sheet-Maximalhöhe verwendet zentralen Dialog-Viewport | Sheets bei geöffneter Tastatur/kleiner Höhe |
| Harte Operator-/Umsatzdiagramm-Textfarben unterschreiten WCAG-AA-Kontrast | Bestehende Status-/Muted-Tokens für beide Themes | Operator-Status, Dashboard-/Demo-Umsatzdiagramm und Trendtexte |
| SVG-only Admin-/Portal-Manifeste und SVG-Apple-Touch-Icon ohne Raster-Fallback | Vorhandene PNG-Assets als Fallback ergänzt, Apple-Icon auf vorhandenes PNG gesetzt | Installierte PWA |
| Scrollbarer Chat-Verlauf ist nicht per Tastatur erreichbar | Fokusfähiger Nachrichtenverlauf mit `role=log` | Support-Chat |
| Identische CSS-Deklarationen in denselben Selektoren/Medien | Sieben nachweislich identische gemeinsame Deklarationen entfernt | Formular-/Sheet-Regeln |

Kein `!important`, keine neue CSS-Datei und kein zweites Designsystem. AppShell und Bottom-Navigation werden nicht verändert. Geschäftslogik, Berechtigungen, Zahlungsinformationen und Datenbankmigrationen bleiben erhalten.

## Qualitätsstufen

```sh
pnpm qa:fast                         # lokale, noch nicht commitete Änderungen
pnpm qa:fast --base origin/main      # gesamter Branch einschließlich lokaler Änderungen
pnpm qa:fast --files app/produkte/page.tsx
pnpm qa:fast --url http://localhost:3000 --base origin/main
pnpm qa:plan --base origin/main      # nachvollziehbare Auswahl ohne Testausführung
pnpm qa:standard --base origin/main
pnpm qa:full --base origin/main
```

`--files` ist eine explizite Entwickler-Auswahl; vor Merge wählt CI aus dem vollständigen Git-Diff. Gelöschte Dateien werden nicht an ESLint übergeben, aber bleiben in der Abhängigkeitsanalyse. Nicht zugeordnete Änderungen erweitern die Prüfung automatisch. Änderungen am grossen `app-pages.tsx` betreffen potenziell mehrere Module und benötigen deshalb repräsentative Tests.

FAST führt Lint nur für vorhandene betroffene Dateien mit Cache, inkrementellen Typecheck und relevante Tests aus. Browser: betroffene Seiten bei 375/1440 px im Light Mode, nur zugehörige Interaktionen; keine regulären Screenshots. Fehlerscreenshots bleiben erhalten. Ohne `--url` startet ein eigener Webpack-Entwicklungsserver auf Port 3300; kein Produktionsbuild und kein Deployment. Ein bereits belegter Testport wird nicht stillschweigend als aktueller Server verwendet.

STANDARD behält vollständigen Lint, Typecheck, Unit-/Integrations-/RLS-Tests, beide Dependency-Sicherheitsprüfungen, CSS-Prüfung, Produktionsbuild und Runtime-Smoke bei. Browser: relevante Module in Chromium und WebKit, Mobile/Tablet/Desktop sowie beide Themes. Globale Layoutänderungen erweitern die repräsentative Auswahl. CI-, Schema-, Auth- und unbekannte Abhängigkeitsänderungen erzwingen die vollständige Matrix.

FULL: 57 Routen × fünf Breiten × zwei Themes = 570 Chromium-Fälle (inklusive Benachrichtigungen, Kunden bearbeiten und allen Einstellungsseiten) sowie 84 WebKit-Fälle; alle Prozess-Interaktionen, Screenshot-Nachweise und axe WCAG-A/AA-Prüfungen auf Phone/Desktop. Serious/Critical-Befunde blockieren; weitere Befunde werden als JSON dokumentiert. Zusätzlich echte Service-Worker-Registrierung, Offline-Fallback, keine Cache-Speicherung von Unternehmensdaten, Manifeste und Theme-Persistenz beim Schliessen/Neuöffnen der Browserseite.

Lokales Browsertooling kann isoliert installiert werden (`playwright@1.62.1`, `axe-core@4.11.0`). Für FULL müssen `BINSO_PLAYWRIGHT_MODULE` und `BINSO_AXE_MODULE` auf diese Installationen zeigen, sofern die Pakete nicht direkt auflösbar sind. Browser und Systembibliotheken müssen installiert sein. CI erledigt das automatisch. Physical iPhone-PWA-Installation, OS-Tastatur und OS-Neustart werden durch diese Emulation ausdrücklich nicht nachgewiesen.

`--no-browser` ist für einen schnellen lokalen statischen Zwischencheck verfügbar und ersetzt weder STANDARD noch die Pflichtchecks. Alle Befehle liefern bei Fehlern einen Fehlerstatus; keine Fehlerfilter und keine versteckten Wiederholungen.

## GitHub Actions

- `checks` und `build` laufen unabhängig parallel.
- Beide Browserjobs prüfen parallel denselben unveränderlichen, entpackten Produktions-ZIP.
- Der Build läuft je Workflow genau einmal; derselbe geprüfte ZIP wird auf main für Azure freigegeben. Ein Merge benötigt weiterhin einen Build für den tatsächlichen Merge-Commit.
- pnpm-Store-Cache ist über Node-Setup und Lockfile zentralisiert.
- Nur `.next/cache` wird wiederverwendet, niemals ein veralteter fertiger Build.
- Je Browserjob wird nur der erforderliche Browser installiert; Chromium nutzt nur die Headless Shell. Ein grosser Browserbinary-Cache wird nicht ohne messbaren Nutzen eingeführt (Playwright empfiehlt ihn generell nicht).
- Pflichtjob `quality` bleibt namentlich erhalten. `always()` prüft explizit Erfolg aller erforderlichen Jobs; Fehler, Abbruch und unerwartetes Überspringen blockieren. Ein nur dokumentierter Diff darf Browser gezielt überspringen, die übrigen Pflichtchecks bleiben erhalten.
- Veraltete Läufe desselben PRs werden abgebrochen. FULL läuft sonntags, bei veröffentlichten Releases und manuell; diese Kontrollläufe deployen nicht automatisch. Azure startet nur nach erfolgreichem Quality-Push auf main.
- Build-/Browserjobs haben begrenzte Laufzeiten; Logs nennen ausgewählte Routen und Interaktionen. Ergebnisse/Screenshots/Accessibility-JSON werden als Artefakte gespeichert.

Quellen: [Next CI-Caching](https://nextjs.org/docs/app/guides/ci-build-caching), [Playwright CI](https://playwright.dev/docs/ci), [GitHub Workflow-Abhängigkeiten](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax).

## Messungen und Abnahme

Vorher: Quality 37828706615 = 9:19 min (Build 57 s, Browserinstallation 70 s, Chromium 210 s, WebKit 119 s). Azure 37829905539 = 8:13 min. Diese Release-Zeiten sind keine sinnvolle Entwicklungs-Feedbackschleife.

FAST statisch: 10,78 s. FAST Produkte mit eigenem Entwicklungsserver: 33,39 s (Lint 1,30 s, inkrementeller Typecheck 1,88 s, Browser 30,21 s). Ein früherer Lauf an einem bereits bestehenden Produktionsserver war 21,42 s und wird nicht als eigenständiger Dev-Start-Benchmark verwendet.

STANDARD lokal: 306,23 s, davon 35,37 s Build, 103,66 s Chromium (126 Fälle) und 125,19 s WebKit (84 Fälle), jeweils alle acht ausgewählten Interaktionsgruppen. Die lokale CLI läuft bewusst sequenziell; CI parallelisiert Build/Checks und Browser. Weitere FULL- und CI-/Deploy-Ergebnisse werden nach tatsächlicher Ausführung ergänzt. Unterschiedliche Testumfänge werden nicht als identischer Vorher-/Nachher-Benchmark dargestellt.

## Offene, ausdrücklich begrenzte Punkte

- Das umfangreiche `app-pages.tsx` und historische CSS-Erweiterungen bleiben eine Refactoring-Aufgabe. Der statische Audit zählt 149 wiederholte Selektoren in unterschiedlichen Regeln derselben responsive.css-Medienkontexte; Wiederholung allein beweist keinen Fehler. Nicht identische Regeln werden ohne Seitenvergleich nicht pauschal entfernt.
- Kein eigenständiges Kalender-Modul und keine separaten Projektlisten/-detailrouten im vorhandenen Code; fehlende Funktionen werden nicht als geprüft behauptet.
- Echtes Smartphone/PWA und physische Tastatur müssen ergänzend geprüft werden.
- Branch-Protection-Einstellungen sind der GitHub-Integration nicht zugänglich (403). Der vorhandene Pflichtjobname wird erhalten; Merge erfolgt über GitHub ohne Force oder administrative Umgehung.
- PR 214 (CodeQL) ist separat offen; sein Sicherheitsworkflow wird nicht in diesen UX-PR kopiert oder stillschweigend ersetzt.

Abschliessend: 28 gezielte Browser-/Theme-/Viewport-Fälle mit Accessibility-Prüfung und Kontaktformular bei 375×400 bestanden; PWA-/Offline-/Theme-Test bestanden. Zwei vergleichbare Bottom-Navigation-Bildausschnitte sind pixelidentisch. Die visuelle Prüfung fand zusätzlich einen widersprüchlichen <390-px-Schnellzugriff-Breakpoint und fehlenden Textumbruch in kompakten Listen; beide Ursachen wurden korrigiert.

FAST über globale Styles fand zusätzlich eine PDF.js-/Webpack-Eval-Namenskollision im Entwicklungsmodus. Der Renderer lädt dieselbe lokale, selbstständige ESM-Datei nun als Same-Origin-Asset. Gezielter Dev-Browserlauf: Rechnungsvorschau mit allen Seiten, Zoom und Dokumentaktionen bestanden. Kein CSP-Abschwächen und kein Produktionsbuild für FAST erforderlich.
