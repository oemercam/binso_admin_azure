# Mobile/PWA Visual QA — v1.6.6

Diese Matrix ist die reale Abnahme nach erfolgreichem Build und vor der fachlichen Freigabe.

## Viewports / Modi
- iPhone/Safari Browser
- iOS Standalone PWA
- Android/Chrome
- Tablet
- Desktop

## Zustände pro Mobile/PWA-Modus
1. Dashboard oben und gescrollt
2. Kundenliste, Suche geschlossen/geöffnet, Filter offen
3. Kundendetail
4. Kunde erstellen, Tastatur offen, Weitere Angaben offen
5. Offerte erstellen
6. Rechnung erstellen
7. Dokumentvorschau
8. Projektliste und Projektdetail
9. Zeiterfassung / aktiver Timer
10. Personal
11. Einstellungen
12. Support Liste / Ticket erstellen / Ticketdetail
13. Avatar-Menü offen
14. Quick Create offen
15. Mehr-Menü offen

## Muss geprüft werden
- kein sichtbarer Zurück-Button/-Link im Workspace-Content
- kein redundantes `Binso One` über Seitentiteln
- Mobile/PWA Header nur Logo + Avatar
- kein Blur/Glow/Gradient/Shadow/Transparenz im Header
- Safe Area gleiche Hintergrundfläche
- Logo/Avatar springen nicht
- Avatar öffnet Bottom Sheet und respektiert Berechtigungen
- kein globales Suchsymbol im Mobile/PWA Header
- Listen-Suche bleibt innerhalb des Viewports
- Filter/Sort/View gleiche Geometrie
- Bottom Nav zeigt Parent-Bereich korrekt aktiv
- Mehr enthält keine Kunden-/Zeit-Duplikate
- Quick Create enthält nur erlaubte häufige Aktionen
- keine horizontale Seitenverschiebung
- keine abgeschnittenen Inputs/Selects/Dropdowns
- Tastatur verdeckt keine primäre Aktion
- zwei gleichwertige Aktionen gleich gross
- Dokumentvorschau vollständig bedienbar
- Light/Dark Theme
- DE/EN/FR/IT/TR ohne Mischsprache
- Desktop ohne Layout-/Funktionsregression

## Abnahme
Selfchecks sind kein Ersatz für diese visuelle Prüfung. Screenshots der oben genannten Zustände gegen diesen Vertrag prüfen.
