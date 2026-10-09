# V21.7 – zentrale UX-Korrekturen und Nachweise

Basis: aktuelles `main` **f35374de95e4fecb92b9fd5d0684c90661d2ac2e**, inklusive V21.6-Follow-up. Arbeitsbranch: `fix/v21-7-central-ux-remediation`. Offene PRs beim Start: #222 (ältere UX/PDF-Korrekturen) und #214 (CodeQL). Keine alte Branchversion wurde über den neueren main kopiert. Main blieb beim erneuten Fetch unverändert.

## Gefundene Ursachen und Korrekturen

Die konkreten Ursachen, verantwortlichen Dateien, Änderungen, Tests und Abnahmestände stehen in [v21-7-traceability.csv](v21-7-traceability.csv). Die Kundenerstellung nutzte weiterhin ein eigenes Langformular. Sie verwendet nun den vorhandenen FormWizard mit Pflichtangaben und optionalen Details. Der Mitarbeitereditor hatte zwei direkt aufeinanderfolgende Grids ohne gemeinsamen Abschnittsabstand. Der bestehende FormSection-CSS-Vertrag wird nun durch einen kleinen zentralen React-Baustein tatsächlich gerendert. Field/Input/Select, APIs, Payloads, Schweizer Formatfunktionen und Schreibrechte bleiben dieselben.

Der Wizard berechnet seine verfügbare Höhe aus VisualViewport, Header und tatsächlichem Seiten-Padding; ein pauschaler 20px-Abzug entfällt. Der bestehende Footer erhält zentrale Höhen-/Abstandstokens und native Abschlussvalidierung. Ein zusätzlicher echter Produktionsbefund lag bei 768×400px vor: Die Landscape-Regel reservierte 76px für die Bottom-Navigation auch bei einer Erfassung ohne Navigation; der Wizard-Inhalt schrumpfte auf 14px und schnitt das aktive 40px-Feld ab. Die Navigation-Reserve ist nun auf Seiten mit Navigation beschränkt; der vorhandene Erfassungstyp erhält seinen zentralen 24px-Section-/Safe-Inset auch auf Desktop/Tablet. Die Navigation selbst bleibt unverändert. Fokussierte Controls werden nach Focus/Resize im nächsten Layoutframe in den Inhaltsbereich gescrollt. Keine künstlichen Lade-Wartezeiten werden eingeführt.

Für Sheets wurden fünf verdrängte Höhenregeln und ein verdrängter Scroll/Flex-Block entfernt. Die zuvor tatsächlich wirksame Flex-/Viewportregel wurde in die ursprüngliche .bottom-sheet-Regel konsolidiert. Navigation-Sheet-Spezialregeln bleiben unverändert. Kein CSS wurde als Korrektur am Dateiende angehängt. Der ungenutzte Token sheet-available-height und sein Setter sowie die vier nicht mehr verwendeten optional-details-Selektoren wurden nach Referenzsuche entfernt. Kontakte und Aktivitäten rendern den vorhandenen zentralen EmptyState.

## Vollständiges technisches Inventar

[ux-inventory.json](ux-inventory.json) enthält **71 Seitenrouten**, API-Routen, **13 Operatorvarianten**, Rendergraphen, Layouts, Komponenten-Props, Bedingungen, CSS-Kandidaten, Media-Kontexte und Stylesheet-Reihenfolge. [v21-7-route-coverage.csv](v21-7-route-coverage.csv) enthält jede Seitenroute. Die regenerierte Integrationsmatrix enthält **376 Module**, keine lokalen statischen Runtime-Importzyklen und keine unreferenzierten Komponenten-Dateikandidaten. 432 wiederholte Selector-Kontexte sind Prüfhinweise, kein automatischer Nachweis von 432 Fehlern. !important: 0. Ein statischer Importgraph wird ausdrücklich nicht als tatsächliches Rendering oder bestandene visuelle Abnahme ausgegeben.

## Lokal geprüfter Stand

- Frozen Install mit Node 24.19.0 / pnpm 10.17.1.
- Vollständiger Lint, Typecheck, Produktionsbuild, CSS-Architekturgate, Release-/Dokumentationsgate.
- Vollständiges bestehendes Testpaket, darunter echte Handler-Doppelsende-/Retry-Tests, PostgreSQL/PGlite-Rollen-/Prozess-/Zahlungsintegration, PDF/QR- und Prozess-Draft-Tests.
- Beide Navigation-Vertragstests: Quellmarkup, Klick-/Scroll-/Berechtigungslogik, Styles und transitive Tokens unverändert.
- Gezieltes WebKit-Paket: fünf Routen plus neue remediation-Szenarien. Pflichtvalidierung, ungültige E-Mail, Schrittwechsel, optionale Details, Datenverlustschutz, Fehler/Retry und Doppelklick; Feldgeometrie/erreichbare Schlussaktion bei 320/390/768/1440px und 400px reduzierter Höhe.
- Gezieltes Produktionspaket nach der Landscape-Korrektur: **PASS** in Light/Dark für remediation, customers, employees, documents, time und header; 10 zusätzliche Routen-/Theme-Kombinationen. Aktive Controls und Footer passen nun vollständig bei 768×400px und den anderen geprüften Breiten. Nachweise: `docs/assets/v21-7/`. Breites Produktionspaket Light/Dark, 320/768/1440px und alle Katalogadressen: läuft; nicht pauschal PASS.
- Produktionsabhängigkeiten: keine High/Critical-Funde. Vollständiger Audit akzeptiert ausschliesslich den bereits dokumentierten temporären Dev-Tool-Advisory GHSA-VFJ7-8CJW-P6XM.

## Grenzen und offene Abnahme

Die reduzierte Viewporthöhe ist ein Geometrietest, kein Nachweis einer realen OS-Tastatur. Physische installierte iOS-/Android-PWA, echte externe Identity-/Stripe-/Graph-Provider und jede Route in jedem Fehler-/Timeout-/Berechtigungszustand sind nicht pauschal abgenommen. Universelle Wiederaufnahme aller Nicht-Dokument-Formulare ist im aktuellen Bestand nicht nachgewiesen. Originale versionsweise freigegebene Zielbilder/Anforderungen V21.1–V21.5 liegen nicht vollständig vor; der aktuelle Nutzerauftrag und die übermittelten Screenshots sind die sichtbare Grundlage.

Lokaler Chromium-Download scheitert mit einer ungültigen/trunkierten ZIP-Datei. Die Chromium-/PWA-/A11y-Gates im bestehenden GitHub-Workflow bleiben zwingend. Der separat gestartete Route/CSS-HTTP-Check konnte den Server nicht erreichen; dies ist kein bestandener Assetnachweis. Die Produktions-Browserprüfung lädt tatsächliche verlinkte Styles.

Merge, Deployment und Live-Version sind bis zu erfolgreichen exakten Commit-Gates **ausstehend**. Ein Teilpaket mit bestandenen lokalen Prüfungen wird nicht als vollständig erfüllte V21.7-Definition-of-Done ausgegeben.

## Bewusst unverändert

Bottom-Navigation inklusive Verhalten/Tokens; Geschäftslogik, Rechte, Datenmodelle/API-Verträge; aktuelle Seiten-PDF-Vorschau und Dokumentdownload; Header-Panels; Timer- und Zeiteintragslogik; Transaktions-/Nummernvergabe; bestehende Deploy-/Migrationsgates. Shared Styles wirken über die vorhandenen Eigentümer, keine zweite Komponentenbibliothek oder Architektur wurde eingeführt.
