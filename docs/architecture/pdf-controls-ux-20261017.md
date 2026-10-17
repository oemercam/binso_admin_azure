# PDF-Vorschau: zentrale Touch-Steuerung, 17.10.2026

## Grundlage und Integration

PR #275 wurde nach ausdrücklicher Freigabe exakt des Heads db76b666501b3f2388c2d144d715ed68f5182a91 regulär integriert: f4c387d848392087526f7db66c974d2f489faf01. quality/analyze waren vollständig grün, Reviews und Threads leer; aktueller main-Schutz und Mergefähigkeit wurden unmittelbar vorher geprüft. Kein Bypass und kein Deployment. Auch die Main-Prüfungen für diesen Merge sind vollständig erfolgreich: Quality-Lauf 39049736847 mit allen 14 Jobs und CodeQL-Lauf 39049736832.

Dieses nächste begrenzte UX-Paket baut auf diesem Main-Stand auf. Weiterhin gilt das Microsoft-Paket vom 15.10. mit der Rangfolge vom 17.10. Die Rechnungsreferenz sieht mobile Vorschau über weitere Aktionen und direkt bedienbare Seitenwechsel vor; geeignete Touchziele und Tastatur sind ausdrücklich gefordert. Der vorhandene zentrale Touch-Token beträgt 44 px. Dark Mode, kurze Viewports und Fehler-/Tastaturzustände sind abgeleitet; keine pixelgenaue Vollabnahme behaupten.

## Ursache und Korrektur

Im Documents-Owner standen feste 40-px-Headerbuttons und zusätzliche Desktop-Grössen von 34 px für die Seitenbuttons (mit den vorhandenen Mindestgrössen kombiniert). Die tatsächlichen gerenderten Ziele unterschritten 44 px: Die neue Prüfung schlug gegen den vorherigen Build fehl.

Zusätzlich zeigte die Desktop-Sichtprüfung einen zweiten konkreten Fehler: Die generische Layout-Regel für direkte Seitenabschnitte gab auch dem modalen section-Dialog 20 px oberen Abstand. Bei voller Viewporthöhe verschwand so die untere Steuerung teilweise ausserhalb. Der Zwischenstand ist als ux-pdf-controls-before/desktop-cropped-after-touch-1440.png gesichert.

Nur bestehende zentrale Verantwortungen werden bereinigt:

- Headerbuttons verwenden var(--touch) für Breite/Höhe und Mindestgrössen.
- Die Seitensteuerung erhält dieselben zentralen Werte in einer Basisregel.
- Die zentrale Layout-Regel für Inhaltsabschnitte nimmt aria-modal=true aus. Kein zusätzlicher kompensierender Dialog-Offset oder routebezogener Override.
- Die konkurrierenden Desktop-Breiten/-Höhen entfallen. Desktop-Radius, Hover, Disabled-Zustand, Schrift, Safe-Area-Anordnung und Seitenanzeige bleiben erhalten.

Keine neue CSS-Datei, Foundation oder lokale Route-Regel. Kein JSX-Anwendungsumbau, keine Änderung am PDF-Renderer, an Seitenlogik, Zoom, Download, Byte-Integrität, Rechnungsdaten, Berechtigungen oder API.

## Nachweise

Die bestehende isolierte Dokument-Interaktion verwendet ein echtes synthetisches mehrseitiges PDF. Neue Messungen prüfen alle fünf Controls bei 1440/390/320 px auf Mindestgrösse und vollständige vertikale Erreichbarkeit und verhindern horizontalen Seitenüberlauf. Absichtlich auf 18 px reduzierte Controls sowie ein absichtlicher oberer 20-px-Abstand müssen mit denselben Assertions scheitern. Vorwärtsnavigation wird per Enter geprüft, Rückwärtsnavigation weiter per Pointer; erste/letzte Seite bleiben deaktiviert wie bisher. Bestehende Tests für A4-Fit, Zoom, 430 × 400, Byte-identischen Download und Fehler/Retry bleiben unverändert aktiv.

Vorher: ux-pdf-controls-before (erwartete rote Regression). Nachher: ux-pdf-controls-after. Screenshots/DOM und lokale Testergebnisse sind keine produktiven Daten; alle APIs und PDFs sind isolierte Fixtures. Die Inventare entstehen über die bestehenden Generatoren, ohne manuelle Hashwerte.

Lokal bestanden: Lint, Typecheck, Produktionsbuild; Integrations-/UI-/CSS-/Style-/UX-Vertragsprüfungen, Lokalisierungsabdeckung, beide unveränderten Navigationsverträge und echte mehrsprachige PDF-/Swiss-QR-Tests. Nach der abschliessenden Layout-Korrektur bestanden erneut 12 Chromium/Edge-Routen-/Viewport-/Theme-Fälle plus die vollständigen Dokument-Interaktionen in Light/Dark. Die fünf Controls wurden zusätzlich bei 1440/390/320 px geprüft; beide negativen Kontrollen wurden zurückgewiesen. Visuell bestätigt: Desktop-Dialog x=0/y=0, Höhe 900 bei 900-px-Viewport; Seitensteuerung y=855/Höhe 45, vollständig erreichbar. Dark-/Mobile-Ansichten, A4-Fit, Zoom, kurze Höhe, Download und Fehler/Retry bestanden. GitHub-Pflichtchecks bleiben vor Integration erforderlich. Der neue PR bleibt ohne weitere ausdrückliche Freigabe ungemergt. Vollständige PDF-/Geräte-/Releaseabnahme sowie übrige Dokument-/Timer-Pakete bleiben getrennt. Mobile Navigation und Sicherheitskontrollen werden nicht verändert. Keine Infrastruktur- oder Monitoringarbeiten.
