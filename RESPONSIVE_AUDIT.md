# Binso Admin v11 – Responsive Audit

Dieser Stand härtet Dialoge, Dokumentvorschau und Formulare für Desktop, Tablet, Mobile und PWA.

## Behobene Punkte
- A4-Vorschau wird proportional an die verfügbare Breite angepasst, ohne Spalten auszublenden.
- Druck/PDF verwendet weiterhin das echte A4-Layout 210 × 297 mm.
- Angebots-/Rechnungspositionen brechen auf kleineren Viewports kontrolliert um.
- Formulare haben interne Scrollbereiche und sticky Kopf-/Aktionsleisten.
- Safe-Area Insets werden in PWA/iOS berücksichtigt.
- Inputs bleiben auf Mobile bei mindestens 16 px und lösen dadurch keinen iOS-Autozoom aus.
- Keine horizontale Seitenausdehnung durch breite Formulare oder Positionseditoren.
- Mobile Dialoge nutzen die gesamte Breite und bleiben innerhalb von 100dvh.
- Desktop-Dialoge werden zentriert und nutzen maximal die verfügbare Viewport-Höhe.

## Prüfpunkte nach Deployment
1. Angebot erstellen bei 1920 px, 1366 px, 1024 px, 768 px, 430 px und 390 px Breite.
2. Angebot mit 5+ Positionen bearbeiten und bis zu den Buttons scrollen.
3. Rechnung aus Zeiterfassungen erstellen und zusätzliche Positionen hinzufügen.
4. PDF-Vorschau auf Desktop und Mobile öffnen; die komplette A4-Seite muss sichtbar/fittbar sein.
5. Auf iPhone/PWA Eingabefelder fokussieren; die Seite darf nicht automatisch zoomen.
6. Bildschirm drehen; Dialog/PDF muss sich neu anpassen.
7. Dark Mode kontrollieren: Dialogflächen, Eingaben und Sticky-Leisten müssen klar getrennt sein.
8. Drucken/PDF speichern: Ausgabe muss A4 ohne Screen-Skalierung erzeugen.
