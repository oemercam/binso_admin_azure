# Binso Admin UX Standard v13

## Einheitliche Logik
- Listen dienen zum Finden.
- Objekt-Hubs dienen zum Verstehen.
- Unterseiten dienen zum Arbeiten.
- Pro Ansicht genau eine primäre Aktion; weitere Aktionen in einem Sekundärmenü.

## Sheets und Dialoge
- Desktop: zentriert, maximal Viewport minus 48 px, interner vertikaler Scroll.
- Mobile/PWA: Bottom Sheet, max. visuelle Viewport-Höhe, Safe-Area berücksichtigt.
- Titel und Aktionen bleiben sticky und jederzeit erreichbar.
- Kein horizontaler Overflow.
- Form Controls auf Mobile mindestens 44 px hoch und Textfelder 16 px gegen iOS-Autozoom.

## Toggles
Toggle nur für persistente binäre Zustände wie Aktiv/Inaktiv, Auto-Versand, Freigabe erforderlich.
Checkboxen bleiben für Mehrfachauswahl, z. B. mehrere Zeiteinträge für eine Rechnung.

## Responsives Verhalten
- Keine horizontale Tab-Leiste auf Mobile.
- Keine Desktop-Tabelle auf Mobile; flache Rows / Drill-down.
- Dokumentvorschau behält A4 intern, wird nur für Screen skaliert.
- Aktionen dürfen nie unter Browser/PWA-Safe-Areas verschwinden.
