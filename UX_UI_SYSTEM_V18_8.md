# Binso Admin v18.8 – zentralisiertes UI-System

## Ziel
Wiederkehrende Darstellung und Interaktion wird nicht mehr pro Seite korrigiert. Gemeinsame Regeln liegen in wiederverwendbaren Komponenten und einer letzten kanonischen CSS-Schicht.

## Zentrale UI-Komponenten
- `components/ui/close-button.tsx` – einzig zulässiger Close/X-Button.
- `components/ui/sheet-system.tsx` – `AppSheet`, `SheetHeader`, `SheetGrabber`, `SheetFooter`, `SheetActions`.
- `components/ui/interactive-row.tsx` – klick-/tappbare Zeilen mit Tastaturunterstützung.
- `components/ui/page-header.tsx` – Seitentitel und Seitenaktionen.
- `components/ui/toggle.tsx` – binäre Einstellungen.
- `components/ui/binso-logo.tsx` – Branding und Theme-Variante.
- `components/ui/viewport-metrics.tsx` – sichtbare Mobile-Viewport-Höhe / Safari-Safe-Area.

## Kanonische CSS-Schicht
`app/ui-system-v18-8.css` wird als letzte CSS-Datei geladen. Sie definiert die gemeinsame Geometrie für:
- Close-Buttons
- Sheet-/Editor-Header
- Footer und Aktionen
- Bottom Sheets
- Fullscreen-Editoren
- Mobile Safe Areas
- klickbare Zeilen
- mobile Create-Logik

Ältere CSS-Dateien enthalten weiterhin seiten- und fachbezogene Darstellung. Wiederkehrendes Verhalten darf dort nicht mehr neu definiert werden.

## Regeln für neue Funktionen
1. Kein direktes `<Icon name="close">` ausser in `CloseButton`.
2. Kurze Aktionen verwenden `AppSheet` im Modus `bottom`.
3. Lange Formulare verwenden `AppSheet` im Modus `fullscreen` oder die kompatiblen zentralen Klassen.
4. Detailzeilen verwenden `InteractiveRow` statt separatem Chevron-Button.
5. Mobile Create-Aktion läuft primär über die zentrale Plus-Aktion in der Bottom-Pill.
6. Neue globale UI-Regeln kommen in die zentrale UI-Schicht, nicht in eine einzelne Fachseite.

## Release-Schutz
`release-check.mjs` prüft zusätzlich, dass direkte Close-Icons nicht wieder in Fachseiten eingeführt werden.
