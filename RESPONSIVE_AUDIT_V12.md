# Binso Admin v12 – Responsive & Data Visibility Audit

## Behobene Ursachen

1. **Leere Module in Mobile/PWA**: Frühere CSS-Regeln blendeten `.data-list` auf kleinen Viewports global aus. Kunden, Angebote, Rechnungen und Mitarbeitende besitzen jedoch keine separate Mobile-Liste. v12 zeigt diese Daten als flache, kompakte Mobile-Liste an.
2. **Leere Module nach Updates**: Ältere `localStorage`-Snapshots konnten leere Arrays persistieren und damit die neuen Demo-Seeds überschreiben. v12 verwendet einen neuen Storage-Key und repariert leere Legacy-Arrays mit den aktuellen Demo-Daten.
3. **Abgeschnittene Formulare**: Dialoge erhalten harte Viewport-Grenzen, internes vertikales Scrolling, sticky Header/Aktionsleiste und responsive Positionsraster.
4. **Rechnung erstellen**: `invoice-builder-sheet` erhält eigenes Desktop/Tablet/Mobile-Hardening. Alle Felder und Positionen bleiben erreichbar.
5. **iOS/PWA**: Formfelder bleiben bei mindestens 16 px, damit Safari beim Fokussieren nicht automatisch zoomt.

## Viewports

- Desktop 1920 × 1080
- Desktop 1366 × 768
- Tablet 1024 × 768
- Tablet/Mobile 768 × 1024
- Mobile 430 × 932
- Mobile 390 × 844
- Installierte PWA mit Safe-Area

## Erwartetes Verhalten

- Keine horizontale Seitenverschiebung.
- Kein Modul wird auf Mobile leer, nur weil die Desktop-Tabelle ausgeblendet wurde.
- Dialoge bleiben vollständig im Viewport; Inhalt scrollt innerhalb des Dialogs.
- Header und Speichern/Abbrechen bleiben bei langen Formularen erreichbar.
- Positionszeilen wechseln unter 1000 px in ein flexibleres Raster und unter 420 px in eine einzelne Spalte.
- PDF-Vorschau bleibt A4 und wird nur für die Bildschirmdarstellung skaliert.
