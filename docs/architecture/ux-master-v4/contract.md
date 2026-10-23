# Verbindlicher UX-Vertrag V4 – lokale Umsetzung

Quelle: unveränderte source.md (Nutzerdatei vom 23.10.2026) und die zwei gelieferten Sortier-/Rechnungslistenbilder. Neuere ausdrückliche Nutzervorgaben haben Vorrang vor historischen V3-Regeln. Keine Änderung an Fachlogik, Finanzaggregation, serverseitiger Autorisierung, Mandantentrennung, Mail-Outbox, historischem Dokumentenschutz oder Produktionsdaten.

## Zentrale Owner und prüfbare Verträge

| Bereich | Owner | Verbindlicher Vertrag | Nachweis |
|---|---|---|---|
| Einfache Filter/Sortierung | RecordsControls / SelectControl | Eigene Icons; direkt verankertes Dropdown auf jedem Viewport; 230 px, viewportbegrenzt; eine aktive Auswahl; sofort anwenden/schliessen | task-controls-browser.mjs, task-controls-render-test.mjs |
| Optionen | SelectControl / primitives.css | Titel sichtbar, ungerahmte Zeilen ab 44 px, Häkchen, keine Optionspillen; Escape ohne Übernahme; Keyboard/Fokus/Aussenklick | echte Control-Browserfälle und bestehende Select-Tests |
| Aktive Auswahl | RecordsControls / collections.css | Je eine kompakte Filter-/Sortierzeile; Reset entfernt nur die eigene Auswahl; Suche/andere Auswahl bleiben bestehen | verifyRecordTools + ux-regression-test |
| Suche | ListSearch | Ein App-X nur bei Inhalt, natives X verborgen; Fokus bleibt erhalten | verifyRecordTools, bestehende CSS- und Sprachtests |
| Header | AppShell / OperatorPage | Übersichtsheader ohne Seitenmenü; Detailtitel zentriert; zulässiges Objektmenü im Detailheader | measure.mjs, measure-browser-test.mjs, ux-browser-test.mjs |
| Navigation/Plus | bestehende Navigation/CreateAction | Material, Ziele/Rechte und Floating-Plus unverändert | navigation-contract-test und unveränderte Navigationsquellen |
| Einrichtung | SetupGuideView | Eine vollständig antippbare Karte mit echtem Pflichtfortschritt und nächster Pflichtangabe; nach Erledigung verborgen; vor KPIs | ux-master-v4-test |
| Finanzen | bestehende Finanzservices | Keine Änderung an Berechnungen, Datenquellen oder Vergleichslogik | bestehende Finanz-/Perioden-/Dokumenttests bleiben aktiv |

Listenwerkzeuge für Import/Archiv bleiben getrennt von direkt erreichbaren Filter-/Sortier-Icons. Komplexe fachliche Filter behalten ihre vorhandenen Sheets. Eine globale visuelle Abnahme aller 27 Kapitel wird durch diese Verträge nicht behauptet. Details und offene Abweichungen: implementation-status.md.

## Ersetzte alte Erwartungen

- Kombinierter Filter-/Sortier-Sheet für einfache Listen ersetzt durch direkte Combobox-Icons und gemeinsame vorhandene Listbox-Implementierung.
- Abnehmbare Filterpillen ersetzt durch eigene Informationszeilen und eindeutig benannte Text-Resetaktionen.
- V3-Ausnahme für viertes Seitenmenü im globalen Übersichtsheader entfernt.
- Linksbündiger V3-Detailtitel ersetzt durch den V4-Vertrag zur Zentrierung.
- Alter 8-px-Feldradius im isolierten Prüfer durch verbindliche 12 px ersetzt; 16-px-Mobile-Eingabeschrift gegen iOS-Zoom bleibt erhalten.
- Veraltete isolierte Browser-Testimporte ergänzt; keine Sicherheits-/Finanztests deaktiviert. Nicht unterstützte native CSS-Eigenschaften sind ausdrücklich keine gemessene Browserunterstützung.

## Integrationsgrenze

Keine Pushes, Merges, Deployments oder produktiven Migrationen in diesem lokalen Block. Die vollständigen Pflicht-Gates bleiben unverändert und müssen vor einer später separat freigegebenen Integration am exakten Commit erfolgreich sein. Lokale gezielte Ergebnisse garantieren keine künftig grüne vollständige GitHub-Matrix. Physische PWA, Rechtsübersetzungen, alle Rollen/Tarife/Status und externe Dienste benötigen ihre eigenen tatsächlichen Nachweise.

Neuere ausdrückliche Freigabe zur Sprachauswahl: vollständige native Sprachnamen (Deutsch, Français, Italiano, English, Türkçe) mit dezentem Pfeil und ohne sichtbaren Buttonrahmen, auch in kompakter Darstellung. Diese Referenz ersetzt die frühere reine DE-Kurzbezeichnung. Bestehende Speicher-/Sprachpräferenzlogik unverändert.
