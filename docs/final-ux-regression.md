# Finale UX-Regressionskorrektur

## Basis und Umfang

Basis ist main `8acc86f6b7a3ea67ff935cb9e48ab3ae4f5f713b`, nach PRs 215–219. Die Änderungen dieser PRs und ihre Quality-/Azure-Läufe wurden geprüft. Der separate offene CodeQL-PR 214 ist nicht Bestandteil dieser Korrektur. Korrekturbranch: `fix/final-ux-regressions`.

20 tatsächlich beigefügte Bilder wurden geprüft (IMG_9806–9826, einschliesslich Varianten). Die Befunde wurden zusätzlich im gebauten main mit kontrollierten API-Fixtures reproduziert. Browsertests schreiben ausschliesslich in abgefangene Test-APIs; keine produktiven Datenänderungen.

## Tatsächlich gerenderte gemeinsame Komponenten

| Vertrag | Implementierung | CSS-Abhängigkeit |
| --- | --- | --- |
| AppShell, App-/Detailheader, unveränderte Navigation | `components/app-shell.tsx` | `app/styles/app.css`, `responsive.css`, `tokens.css` |
| Listen, Suche, Filter, interne Tab-Scrollbereiche | `components/records.tsx`, `document-list.tsx` | dieselben zentralen Styles |
| Finanzzeilen | `DocumentSummaryRow`, `FinancialSummaryRow` in `document-list.tsx` | `.document-summary-row` |
| Status, Felder, Labels, Checkbox | `components/ui.tsx` | `.status`, `.form-field`, `.form-check` |
| Kennzahlengruppe, Aktions-/Form-/Filter-Sheets | `components/binso-ux.tsx` | `.bo-metric-tiles`, `.action-sheet`, `.sheet-scroll`, `.sheet-actions` |
| Timer und Kundendetail | `components/app-pages.tsx` | `.timer-card`, `.time-group`, `.contact-item` |
| Dokumentvorschau und tatsächliches PDF | `components/documents.tsx`, `lib/server/document-pdf.ts` | lokaler PDF.js-Renderer, A4/PDFKit/SwissQRBill |
| Chat und Tastatur-Viewport | bestehender Chat und `use-workspace-viewport.ts` | bestehende Nachrichten-/Dialog-Scrollcontainer |
| Operator | bestehende Operator-Komponenten | `app/styles/operator.css` |

Namen wie FormBottomSheet oder ResponsiveDataTable wurden nicht als zusätzliche parallele Komponenten eingeführt. Bestehende Verträge werden konsolidiert. Keine neue CSS-Datei, kein zusätzliches !important und kein globales horizontales Abschneiden.

## Abnahmematrix

Die Nachweise werden nach dem finalen Lauf im begleitenden visuellen Bericht mit Originalbild sowie main-Vorher-/Korrektur-Nachher-Bildern verknüpft. Der Deployment-Status ist zum Zeitpunkt dieses PR-Commits offen; der abschliessende Bericht dokumentiert den tatsächlich bestätigten Azure-Commit und Live-Test.

| Fehler / Referenz | Seite | Ursache / Komponente | Geänderte Dateien | Sollzustand / technischer Test | Visueller Nachweis | Ergebnis | Deployment |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 Kontaktmenü / IMG_9823 | Kundenkontakte | Vier Kinder in dreispaltigem Kontaktgrid | app-pages.tsx, app.css | Avatar/Inhalt/Aktionen; Menü in erster Zeile, ganze Zeile bedienbar | contacts-before / contacts-final | Geprüft und bestanden | Offen |
| 2 Doppelstatus / IMG_9822 | Kundendetail | Status zusätzlich im Datenabschnitt | app-pages.tsx | Genau ein Aktiv-Badge im Header | customer-before / customer-final | Geprüft und bestanden | Offen |
| 3 Zentrierte Zeitgruppen / IMG_9812(1) | Zeit-Einträge | Geerbtes text-align:center; veralteter :has-Selektor | app.css, responsive.css, tokens.css | Kunden/Projekt links; Gruppen eingeklappt und vollständig anklickbar | time-groups-before / time-groups-final | Geprüft und bestanden | Offen |
| 4 Gruppensummen | Zeit-Einträge | Alte Abstände und Flexaufteilung | gleiche Dateien, ux-browser-test.mjs | Dauer/Chevron rechts; vier Gruppen, 40:45 h; gleiche Projektnamen verschiedener Kunden getrennt | time-groups-final | Geprüft und bestanden | Offen |
| 5 Unterschiedliche Finanzlisten / IMG_9817(1),9818(1),9819(1),9824 | Kunden/Finanzen/Dashboard | Angebote RecordRow, Rechnungen DocumentSummaryRow; kompakte Listen mit falschem Total | document-list.tsx, app-pages.tsx, responsive.css | Gemeinsame zweizeilige Struktur; offene Rechnung ausdrücklich Restbetrag; Zahlung tatsächliche Währung | customer-finance-before / final; Finanzlisten | Geprüft und bestanden | Offen |
| 6 Abgeschnittene Tabs / Spesen | Listen | Zeitfilter-Override erlaubte Umbruch; interne Scrollbereiche | responsive.css | Nur Tab-Leiste scrollt; letzter Tab erreichbar | Zeit/Spesen an 320 px | Geprüft und bestanden | Offen |
| 7 Gesamtseitenüberlauf | Alle 57 Routen | Mindestbreiten; zusätzlich Operator-SLA-Raster bei 768 px | operator.css, tokens.css | Dokument-/Bodybreite bei sieben Breiten, beide Themes | gesamte Browsermatrix, Operator 768 | Geprüft und bestanden | Offen |
| 8 Sheet-Varianten / IMG_9813(1) | Form-/Aktions-Sheets | Manuelle Zeit mit eigenem Header/Focus/Footer | app-pages.tsx, binso-ux.tsx | Vorhandenes ActionSheet; fixer Header/Footer, Inhalt scrollt; 320×400 | manual-time-before / final | Geprüft und bestanden | Offen |
| 9 Primäraktionen / Formulare | Kunde/Kontakt/Mitarbeiter/Projekt/Zeit/Spesen/Dokumente | Historische full-Klasse setzte Schriftstil zurück; Footer-Mindestbreiten | app.css, responsive.css, app-pages.tsx | Eine Speichern-Aktion, erreichbare Felder, Fehler behalten Eingaben, Double-submit-Tests | Formular-/Sheet-Browsernachweise | Geprüft und bestanden | Offen |
| 10 Überdimensionierte Checkbox / IMG_9826 | Kontakt bearbeiten | Globale Formularbreite auch auf Checkbox; gestapeltes Field | ui.tsx, app.css, responsive.css, tokens.css | Neutraler 18-px-Checkbox neben Label; Hauptkontakt-Logik bleibt | contact-form-before / final | Geprüft und bestanden | Offen |
| 11 Finanzberechnungen / IMG_9814,9816 | Finanzen/Zahlungen | Übersichtswerte fachlich korrekt, kompakte Rechnungszeile zeigte ursprüngliches Total | document-list.tsx, app-pages.tsx, app.css | Zeitraum aktualisiert Einnahmen/Ausgaben/Ergebnis; Forderungsbestand unabhängig; Diagramm fokussierbare Monatswerte | finance-final / period-sheet | Geprüft und bestanden | Offen |
| 12 Timer-Persistenz / IMG_9808,9809 | Timer | Bestehende Persistenz erhalten; optionale Einstellungen störten Reihenfolge | app-pages.tsx | Timer/Einträge, Kunde, Projekt, kompakter Timer, Aktionen, Heute, Manuell; Pause/Restart/Doppeltimer geprüft | Timer-Browsernachweise | Geprüft und bestanden | Offen |
| 13 PDF/QR | Rechnung/Vorschau | Nicht eingebettete Helvetica führte zu Renderer-Schriftabweichungen | document-pdf.ts, next.config.ts, fonts/pdf, migration-test.mjs | Eingebettete SIX-zulässige Liberation Sans; Vorschau tatsächliches PDF; Draft/Teilzahlung/lange Positionen und QR-Dekodierung | A4/QR-PDF vor/nach, Vorschauzoom | Geprüft und bestanden | Offen |
| 14 Bottom-Navigation | Mobile/PWA | Kein Redesign erforderlich | Keine Änderung an app-shell.tsx oder Nav-Regeln | Source-/CSS-Vertrag identisch zu main, gleiche Bildausschnitte pixelidentisch | vier 375-px-Vorher-/Nachher-Crops | Geprüft und bestanden | Offen |

## Entfernte Redundanzen und erhaltene Prozesse

Veralteter Timer-:has-Selektor und widersprüchliche Gruppenabstände entfernt. Vier Headerregeln konsolidiert; Mobile-Detailheader sticky, Desktop-Detailheader unter Appbar sticky. Finanz-RecordRow-Varianten zusammengeführt. Eigene Zeit-Sheet-Header/Focus-Implementierung durch bestehendes ActionSheet ersetzt. Checkboxen erhalten einen expliziten gemeinsamen Field-Vertrag. Zahlungslinks berücksichtigen vorhandene Leseberechtigungen.

Angebot/Rechnung/Zahlung, interne Zeit, Timerpausen und bestehende Rechnungs-/QR-Geschäftslogik bleiben erhalten. Keine Migration, keine neuen Testdaten in Produktion. QR-Zahlteil einer Teilzahlung ist ausdrücklich eine Restzahlungsanforderung und wird nicht mit der ursprünglichen Rechnungsforderung vermischt. Entwurf und unvollständige Zahlungsdaten bleiben gekennzeichnet; keine dekorativen QR-Codes.

## Prüfungen und Grenzen

FAST des zusammenhängenden UI-Standes: 122,99 s, davon Browser 111,34 s, geänderte Dateien lint 5,40 s, Typecheck 4,14 s. Frühere kleine Produktänderung 33,39 s; die unterschiedlichen Umfänge sind kein identischer Benchmark.

Die GitHub-STANDARD-Prüfung wird wegen gemeinsamer Komponenten/Testinfrastruktur konservativ auf FULL-Abdeckung erweitert: 57 Routen × sieben Breiten × zwei Themes = 798 Chromium-Fälle; 14 WebKit-Routen × fünf Breiten × zwei Themes = 140 Fälle. Alle acht Interaktionsgruppen, axe serious/critical, Service Worker/Offline/Theme-Neustart, vollständiger Lint/Typecheck/Build, Sicherheits- und Integrationsprüfungen. Zusätzlicher Stresslauf mit langen Kundennamen/E-Mails, grossen CHF-Beträgen: vier Routen × sieben Breiten × zwei Themes = 56 Fälle.

Die vorhandenen optimierten GitHub-Workflows bleiben erhalten: pnpm-/Compiler-Cache, parallele Checks/Build sowie Browserjobs, ein gemeinsames Produktionsartefakt, Concurrency-Abbruch veralteter Läufe, unveränderter Pflichtjob quality. Hier wurde die tatsächlich geforderte 390-/768-px-Matrix ergänzt; Sicherheitsprüfungen werden nicht verkürzt.

Swiss QR aktuell: SIX Version 2.3; Version 2.4 tritt erst am 14.11.2026 in Kraft. [Offizielle Spezifikation](https://www.six-group.com/en/products-services/banking-services/payment-standardization/standards/qr-bill.html). Automatisch dekodierter Zahlteil: strukturierte Adressen, gültiger IBAN, CHF 116.20 Restbetrag, NON-Referenz, FLOW-PENDING-Zweck, EPD-Abschluss; keine produktiven Zahlungsdaten ersetzt. Fünf erzeugte PDFs haben 1/1/1/6/7 Seiten, keine unbeabsichtigten leeren Seiten; reguläre und fette Schrift sind eingebettet.

Offen bleiben physisches iPhone/iOS-Safari, tatsächlich installierte iPhone-/Android-PWA mit OS-Neustart und reale Bildschirmtastatur: Blockiert mit Ursache (keine Geräte verfügbar). WebKit-iPhone-Emulation und Chrome/Android-Emulation ersetzen diesen Nachweis nicht. Keine eigenständigen Kalender-/Projektlistenrouten im vorhandenen Code. Offener CodeQL-PR 214 bleibt separat. Branch-Protection-Administration ist der Integration nicht zugänglich; kein Force-Merge und keine Umgehung.

## Tatsächlich abgeschlossene lokale Abnahme

Vollständiger Lint, Typecheck, Produktionsbuild, pnpm test, CSS- und Release-Gates sind auf dem finalen Quellstand bestanden. Frozen-Lockfile-Installation und beide Sicherheitsprüfungen waren ebenfalls erfolgreich; Abhängigkeiten wurden nicht verändert.

Der breite Chromium-Lauf bestand 798 Routen-/Breiten-/Theme-Fälle und alle acht Interaktionsgruppen, einschliesslich axe serious/critical. PWA-Service-Worker, Offline-Fallback, Manifeste und Theme-Neustart bestanden. Der anschliessende WebKit-Lauf fand einen realen 6-px-Überlauf im Spesenformular bei 768 px: feste zwei Formularspalten neben dem Uploadbereich waren zu schmal. Die bestehende Tabletregel verwendet jetzt eine gemeinsame Mindestbreite für Formularspalten; der Uploadbereich streckt sich nicht mehr über die gesamte Formularhöhe. Kein Clipping-Workaround.

Nach den letzten Korrekturen wurden gezielt erneut geprüft: 64 Chromium-Fälle für die betroffenen Tablet-/Desktop-Seiten, 160 WebKit-Fälle einschliesslich aller acht Interaktionsgruppen und ernsthafter Accessibility-Befunde, 56 Stressfälle mit langen Namen/E-Mails und grossen Beträgen sowie vier Pixel-7-Emulationsfälle. Alle bestanden. Die 160 WebKit-Fälle erweitern die 140 regulären Fälle um Zahlungsdetail und Admin, beide auch bei 768 px. Ein neuer Berechtigungstest prüft den tatsächlich verwendeten AppShell-Kontext für erlaubte/gesperrte verknüpfte Datensätze und den Text-Fallback ohne Link.

Kontaktformular, Zeitgruppen, Kundendetail/-finanzen, beide Themes, 320×400-Sheets, Admin 768 und Spesen 768 wurden anhand der gerenderten Bilder visuell geprüft. Zusätzliche main-Vorherbilder bestehen für 14 relevante Seiten im Light-/Dark-Mode. Bei der Zeitgruppenprüfung wurde der Nachher-Datensatz ausdrücklich auf vier Kunden-/Projektgruppen erweitert; dies ist kein pixelgleicher Datenvergleich mit dem früheren Zweieintrags-Datensatz. Vier Navigation-Crops sind auch mit dem aktuellen Nachher-Bildbestand pixelidentisch; sämtliche Navigation-CSS-Regeln und AppShell-Quellcode sind identisch zu main.

Die vollständige finale Produktionsmatrix läuft zusätzlich im PR-Pflichtworkflow auf dem unveränderlichen Build-Artefakt. Merge und Deployment werden erst nach erfolgreichen Pflichtchecks durchgeführt. Ergebnisse werden im Abschlussbericht mit PR, Commit, CI-Läufen und Live-SHA belegt; ein erfolgreicher Branchbuild wird nicht als erfolgreicher Live-Stand bezeichnet.
