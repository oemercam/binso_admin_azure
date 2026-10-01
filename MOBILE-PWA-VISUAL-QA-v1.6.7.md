# Mobile/PWA Visual QA — v1.6.7

Diese Matrix ist die reale Abnahme nach erfolgreichem Build und vor der fachlichen Freigabe.

## Viewports / Modi
- iPhone Safari
- iOS Standalone PWA
- Android Chrome
- Android PWA
- Tablet
- Desktop

## Kernzustände
1. Dashboard oben und gescrollt
2. Kundenliste mit Seitensuche/Filter
3. Kundendetail
4. Kunde erstellen, Tastatur offen
5. Offerte/Rechnung erstellen
6. Dokumentvorschau
7. Projektliste/Detail
8. Zeiterfassung und aktiver Timer
9. Einstellungen
10. Support Liste/Neu/Detail
11. Avatar-Menü offen
12. Quick Create offen
13. Mehr-Sheet offen auf Dashboard
14. Mehr-Sheet offen auf Rechnung/Projekt/Personal
15. Mehr-Sheet mit kurzer Berechtigungsliste
16. Mehr-Sheet mit langer Berechtigungsliste

## Navigation muss visuell/funktional geprüft werden
- Bottom Navigation: `Start | Kunden | Neu | Zeit | Mehr`
- Mehr öffnet Bottom Sheet, keine Route/Vollbildseite
- aktuelle Seite bleibt hinter neutralem Backdrop sichtbar
- kein Blur, Glass, Glow oder Gradient
- Sheet ist content-adaptiv; keine feste 100vh-Höhe
- langer Inhalt scrollt nur im Sheet; Hintergrund bleibt gesperrt
- Header `Navigation` + X bleibt sichtbar
- X schliesst
- Backdrop schliesst
- Browser/PWA Back schliesst ohne History-Schleife
- Auswahl navigiert und schliesst
- aktiver Menüpunkt klar, aber zurückhaltend
- keine Icon-Cards; alle Rows gleiche Geometrie
- Permissions entfernen nicht erlaubte Ziele vor dem Klick
- Benutzerbereich ist nicht abgeschnitten
- Einstellungen und Abmelden funktionieren
- Version ist sichtbar
- Home Indicator / Safe Area überdeckt nichts
- Bottom Navigation konkurriert bei offenem Sheet nicht visuell
- Avatar öffnet weiterhin Account, nicht Modulnavigation
- Neu öffnet weiterhin nur Quick Create

## Bestehende globale Verträge
- Mobile/PWA Header nur Logo + Avatar
- kein redundantes `Binso One` über Seitentiteln
- keine Text-Zurücknavigation
- keine horizontale Verschiebung
- Light/Dark
- DE/EN/FR/IT/TR
- Desktop ohne optische/funktionale Regression

Selfchecks sind kein Ersatz für diese visuelle Prüfung.
