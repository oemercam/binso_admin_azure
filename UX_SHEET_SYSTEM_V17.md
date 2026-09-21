# Binso Admin v17 – zentralisiertes Sheet-System

## Verbindliche Regeln

- `AppSheet mode="bottom"`: kurze Aufgaben, Auswahl, Versand, Zahlung, Nachweis, Status.
- `AppSheet mode="fullscreen"`: lange Formulare und komplexe Bearbeitung auf Mobile/PWA.
- `AppSheet mode="dialog"`: kompakte Desktop-Dialoge.
- Dokumentvorschau bleibt ein eigener Fullscreen-Preview-Modus.
- Ja/Nein-Zustände werden mit Toggle dargestellt.
- Mehrfachauswahl bleibt Checkbox.

## Mobile Bottom Sheet

- von unten, abgerundete obere Ecken
- Drag-Griff oben
- maximal 82dvh
- Hintergrund gedimmt
- Antippen des Hintergrunds schliesst
- kein redundantes X auf Mobile
- sticky Aktionsleiste
- Safe Area berücksichtigt
- globale Pille ausgeblendet

## Fullscreen Edit

- komplette Bildschirmfläche
- App-Header, Sidebar und Pille ausgeblendet
- eigener sticky Header mit X
- sticky Speichern/Abbrechen-Aktionsleiste
- nur Editor scrollt
- 16px Inputs gegen iOS Auto-Zoom

## Desktop

- kurze Sheets als zentrierte Dialoge
- lange Editoren begrenzt innerhalb des Viewports
- keine abgeschnittenen Aktionen oder Felder
