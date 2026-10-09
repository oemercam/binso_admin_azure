# BINSO ONE – finale zentrale UX-Architektur

Ausgangspunkt: tatsächlich aktuelles main `68b097e81b172247f37d18023d4a833526e98fea`, einschließlich PR #224. Arbeitsbranch: `fix/final-central-ux-20261009`. Offene PRs #222 und #214 bleiben erhalten. Dieser Bericht wird während der Abnahme ergänzt; ein Branch-Build ist kein Live-Deployment.

## Vollständiges Codeinventar und Nachweise

71 vorhandene Next-Seitendateien, 80 konkrete Testpfade einschließlich der gesperrten Entwicklungsreferenz. [Routen-/Komponenten-/CSS-Inventar](architecture/routes.md) und [vollständige Import-, Props-, Varianten-, API-, Berechtigungs- und CSS-Matrix](architecture/ux-inventory.json). Die vorhandenen Haupt-, Unter-, Portal-, Operator-, Authentifizierungs-, Vorschau-, Rechts- und Redirect-Routen sind berücksichtigt. Keine nicht vorhandenen Geschäftsseiten wurden erfunden.

Sechs bestehende CSS-Quellen, unveränderte Importreihenfolge; 14 kanonische Media-Blöcke, kein `!important`. Wiederholte Selektoren sind Kandidaten, keine automatisch bewiesenen Fehler. Die Abnahme verwendet berechnete Browserwerte sowie zugehörige CSSOM-Kandidaten einschließlich Media-/Supports-Kontexten, Spezifität über die tatsächlichen Selektoren, Reihenfolge und Inline-Stilen. `scripts/ux-dom-evidence.mjs` erfasst alle im Auftrag genannten Eigenschaften.

## Bestätigte technische Ursachen

| ID | Tatsächliche Ursache | Zentrale Korrektur und betroffene Ansichten | Kontrolliert entfernte Altlast |
| --- | --- | --- | --- |
| F1 | AppShell verwendete getrennten Desktop-Suchzustand und Dropdown; mobile Suche/Konto/Benachrichtigungen lagen in der allgemeinen Bottom-Sheet-Verzweigung. | Ein Panelzustand, HeaderPanel-Portal und SearchPanel/NotificationPanel/AccountPanel auf sämtlichen AppShell-Routen. Desktop verankert, mobil unter dem sichtbaren Header. | desktopSearchOpen, eigene Desktop-Suche, desktop-search*-CSS und search-sheet-Overrides nach repositoryweiter Verwendungssuche. |
| F2 | `body` und `html` mit overflow:hidden erzeugten beim Modalöffnen einen zusätzlichen Body-Scrollcontainer. WebKit-DOM-Beleg: sichtbarer Sticky-Header verschob sich auf y=-123; das Panel begann bei y=0. | Body overflow:clip, Root overflow:hidden, gemeinsamer Modalstack, gespeicherte Scrollposition und Fokus. Header bleibt bedienbar zum kontrollierten Panelwechsel; Hintergrund ist gesperrt. | Unabhängige, gegeneinander arbeitende Scroll-/Fokusrestaurierung pro Dialog. |
| F3 | Konto-Inhalte verwendeten statische Initialen; Personenlisten und Kontakte hatten weitere Initialen-Markups. | Avatar mit tatsächlichem Foto oder deterministischen Initialen/Farbe, neutral bei fehlender Identität; Konto/Profil/Team/Mitarbeiter/Kontakte migriert. | team-avatar und profile-avatar-Darstellung; fachlich getrennte Firmenlogo-Platzhalter. Aktivitäten ohne tatsächliche Personenidentität erhalten keine erfundenen Autoren. |
| F4 | Unternehmenseinstieg mischte persönliche und organisatorische Einstellungen; Profil-Fallback war unabhängig vom gespeicherten display_name. | Persönliche Einstiege im Konto-Panel, Company/Team/Billing/Documents/Time/Privacy im bestehenden Einstellungen-Layout; Deep Links bleiben bestehen. Profil liest ausschließlich den angemeldeten Benutzer, keine automatische Übernahme fremder Mitarbeiterdaten. | Gemischte persönliche Navigationsgruppen im Unternehmenseinstieg. |
| F5 | Profil/Firma/Dokumente behandelten bereits den Bearbeitungsmodus als dirty. | Gespeicherte Feld-Snapshots; unbearbeitetes Öffnen und Rückkehr zu Originalwerten lösen keine Warnung aus. Genau ein Speichern-Footer. | Warnung allein aufgrund editing=true. |
| F6 | FormSheet gab X/Außenklick/Escape und innere Abbrechen-Buttons direkt an onClose weiter. Native Browser-Zurück-Navigation war nicht geschützt. | Zentraler FormSheet-Wertevergleich, gemeinsamer Verwerfendialog, Modalstack; gemeinsame Browser-History-Grenze und beforeunload für aktive Entwürfe. | Ungeschützter FormSheet-Schließpfad. Kurze Action-/Filter-Sheets bleiben direkt schließbar. |
| F7 | Benachrichtigungskanäle standen in engen parallelen Spalten; Optimismus ohne kanalweise Sperre/Rollback. | Beschriftete E-Mail-/Push-Zeilen, unmittelbare Persistenz, Sperre während Requests, Rücksetzen nach Fehlern, tatsächliche Push-Berechtigung. | Mobile Mehrspalten-Overrides; keine zusätzliche Speichern-Aktion. |
| F8 | Umfangreiche Mitarbeiter-/Dokumentanlage zeigte alle Angaben als langen Block. | FormWizard hält Felder und Daten montiert: Mitarbeiter in zwei fachlichen Schritten, Rechnung/Angebot in vier Schritten einschließlich Prüfung. Bestehende Editor-/Speicher-/QR-Geschäftslogik bleibt erhalten. | Duplizierte Mitarbeiterfelder für Neu/Bearbeiten wurden wieder zusammengeführt. |
| F9 | Firmenlogo-Upload schrieb bereits bei Dateiauswahl Organisationsdaten. Fehlendes Firmenlogo wurde mit Plattformidentität dargestellt. | Lokale Dateivorschau; tatsächlicher Upload erst beim ausdrücklichen Speichern. Neutraler Firmen-Platzhalter. | Plattformlogo als Fremdfirmen-Fallback und automatische Persistenz bei Dateiauswahl. |
| F10 | Unvollständige Oberflächensprachen wurden als nutzbare Optionen dargestellt; Registrierung wiederholte identische Zustimmung unter dem Button. | Nur de-CH aktiv auswählbar; übrige Sprachen transparent als noch unvollständig deaktiviert. Rechtlich erforderliche Checkbox/Links und Passwortvalidierung bleiben erhalten. | Wiederholte Zustimmung; keine rechtlichen Dokumente entfernt. |
| F11 | WebKit-Szenarien verwendeten page.goto als harte Fixture-Neustarts innerhalb eines persistenten Dokuments. Alte Next-RSC-Prefetch-Tasks erzeugten nach Dokumentwechsel Access-Control-Fehler. | Unabhängige Fixture-Neustarts verwenden isolierte Seiten; tatsächliche Linknavigation, Browser-Zurück und alle pageerror-Assertions bleiben unverändert geprüft. | Übernahme alter Dokument-Scheduler in das nächste künstlich zurückgesetzte Szenario. Kein Release-Gate deaktiviert. |

Die zentrale Navigation selbst ist unverändert. `navigation-contract-test.mjs` kontrolliert den freigegebenen JSX-/Selektoren-Digest `aa85bddbeda0c9cb3349f3592857675a6cab219ac95f462eee250927bad8dfd1`. Bearbeitungsansichten nutzen ausschließlich die bereits vorgesehene Sichtbarkeitsregel außerhalb der Navigationskomponente.

## Entwicklungsreferenz und Teststufen

`/dev/ux-lab` zeigt ausschließlich synthetische Beispiele derselben Komponenten. Produktionsbuilds liefern 404; keine Produktivdaten oder API-Zugriffe. Referenzen: Header/DetailHeading, Avatar, Status, drei Header-Panels, Action/Form/Filter/Wizard-Sheet, Felder, Toggle, ListRow, EmptyState und DocumentPageViewer mit lokal ausgewähltem Test-PDF.

FAST lintet geänderte Dateien, führt relevante schnelle Tests aus und prüft nur einen mobilen Viewport im Hellmodus. Typecheck kann mit `--typecheck` ergänzt werden. INTEGRATION führt Typecheck, passende Tests, Build und gezielte Browserprüfung aus. RELEASE behält sämtliche bisherigen Pflichtprüfungen, vollständige Chromium-Matrix, WebKit, PWA, Sicherheits- und Fachtests. Azure erhält weiterhin genau das in Quality geprüfte Artefakt.

## Aktueller Abnahmestand

- Gesamte Code-/Routeninventarisierung vorhanden; statisches Inventar ist keine visuelle Abnahme.
- 64 Einstellungs-Route/Theme/Viewport-Kombinationen in lokalem WebKit erfolgreich, plus zentrale Header-Interaktionen bei 320/390/768/1440 Pixeln. Weitere Gesamtrouten- und neue History-Regressionen laufen.
- Lint, Typecheck, Build sowie vollständige bestehende Unit-/Datenbank-/QR-/PDF-Tests bestanden am vorherigen Paketstand; nach den jüngsten History-Anpassungen werden sie erneut geprüft.
- Native Kamera-, iPhone-Tastatur- und installierte Safari-PWA-Abnahme ist lokal nicht verfügbar. Browseremulation und verkürzter Viewport ersetzen keine physische Geräteprüfung.
- Lokales Chromium konnte nicht installiert werden; verbindliche Chromium-/PWA-Prüfung bleibt im GitHub-Release-Gate.
- Nach PR #224 scheiterte main Quality Run 37911049272 am WebKit-Test; Azure Run 37911943757 wurde korrekt übersprungen. Build/Checks/Chromium waren erfolgreich. Neuer Merge und Live-Status bleiben bis erfolgreicher Release-Abnahme offen.

## Pipeline-Messung

Vorher, tatsächlicher main-Run 37911049272: Build 110 s, Checks 44 s, Chromium 370 s, WebKit 230 s (fehlgeschlagen), Gesamtwallclock 489 s. Ein fehlgeschlagener Lauf ist keine erfolgreiche Release-Baseline. Der Vergleich mit dem neuen Lauf wird nach dessen Abschluss einschließlich Ergebnis, Coverage und Cachebedingungen ergänzt. Bestehende pnpm-/Next-Cache- und Artefaktpromotion bleiben aktiv; es wird kein zusätzliches Azure-Deployment pro UX-Zwischenschritt ausgelöst.
