# Global Action System V3 – Stand des 15-Minuten-Blocks

Beginn 23.10.2026 16:34:16 Europe/Zurich; Zeitlimit 16:49:16. Lokal auf Release-Kandidat a6126ac3 aufgebaut. Keine Commits, Pushes, Deployments oder produktiven Datenänderungen in diesem Block.

## Inventar zuerst

routes.json und actions.csv wurden vor den Implementierungsänderungen aus dem vorhandenen Code erzeugt: 84 Seitenrouten, 6491 Aktionsvorkommen einschliesslich gemeinsam genutzter Owner. Die vorgeschlagene Zuordnung ist eine statische Ausgangsmatrix. Rollen, Tarife, Entitätsstatus und dynamische Handler sind mit Quellkontext versehen, aber NICHT vollständig fachlich einzeln bestätigt. Geplante V26-Funktionen wurden nicht als vorhanden übernommen.

## Lokal umgesetzt

- ActionsMenu unterstützt Listenwerkzeuge mit Filter-Icon: vorhandenes Bottom Sheet auf Mobile, bestehendes HeaderPanel als verankertes Desktop-Popover. Keine zweite Aktionsbibliothek.
- RecordsControls bündelt Sortierung im bestehenden Filterdialog; doppelte dauerhafte Sortiersteuerung entfernt. Derselbe Owner wirkt auch auf Support und Adminlisten.
- Kundenliste: ein Werkzeugzugang neben Suche, darin Filter/Sortierung und tatsächlich berechtigte Import-, Dubletten- und Archivfunktionen. Kein viertes Header-Icon.
- Finanzen: vorhandene Berichtsaktionen neben zentraler Zeitraumsteuerung, kein Drei-Punkte-Menü im Übersichtsheader.
- Zeit: Filter, Berichte und Monatsrapport als Listenwerkzeuge neben Suche. Timer-Start/Pause/Stop und Speicherlogik unverändert.
- Support: Anhängen mit kontextbezogenem Plus; Wiederöffnen geschlossener Tickets im Detailheader. Kein zusätzliches Drei-Punkte-Menü am Nachrichteneditor.
- Admin-Kundendetail: bestehende Einschränken-Navigation über zentralen Detailheader; registriert erst im geladenen Kundendetail und mit unveränderter Rollenprüfung. Mobiler Detailtitel zentriert, Konto/Home im Detailheader entfernt. Adminübersicht ohne doppelten Titel.
- Zentrale mobile V3-Detailtitel wieder zentriert. Bottom-Navigation und Floating-Plus nicht bearbeitet.
- Neue Werkzeugbeschriftung und Filter/Sortierung in DE/FR/IT/EN/TR über bestehenden zentralen Katalog. Keine vollständige TR-Übersetzung anderer Apptexte behauptet.

## Geprüft

- Gezieltes ESLint aller geänderten Komponenten und Inventargenerator: erfolgreich.
- TypeScript nach abschliessenden Änderungen: erfolgreich.
- Bestehender navigation-contract-test: erfolgreich.
- git diff --check: erfolgreich.
- Echte lokale Kundenliste: mobile Suche/Werkzeuge, alle vier Werkzeugaktionen erreichbar, Übergang zum Filterdialog mit Status/Sortierung; Desktop-Popover bei 1440 px. Screenshots im Workspace action-v3-kunden-mobile.png und action-v3-kunden-desktop.png.
- Echte lokale Zeiterfassung: nur Suche/Glocke/Avatar im Header; Listenwerkzeuge neben Suche; Timer direkt erreichbar. Keine neue Zeit gespeichert.
- Echte Supportliste geöffnet; keine Testtickets erzeugt.
- Admin-Unternehmensverwaltung führt zum Operator-Login: Rollenansicht ausdrücklich ungeprüft.
- Rechnungsdetail geöffnet; vollständige visuelle Prüfung und Aktionsprüfung noch offen.

## Fehler und Grenzen

Die gezielte automatische Browserprüfung (fünf Routen, 390/1440 px) wurde beim lokalen Seitenladen nach 30 Sekunden abgebrochen. Kein erfolgreicher Browser-Testlauf behauptet. Ein versehentlich angesprochener nicht vorhandener navigation-style-contract-Test wurde nicht als bestanden gewertet. Weitere Browserzugriffe waren kurz durch automatische Freigabeprüfung gesperrt; nach ausdrücklicher Zustimmung wieder erlaubt.

## Noch offen

Vollständige fachliche Zuordnung und Migration der 6491 statischen Vorkommen, insbesondere Kontakte/Archivzeilen, Dokumentpositionen und Anhänge ohne eigenen Detailkontext; bestehende Mehrfachauswahl und Massenaktionen; sämtliche Rollen-/Tarif-/Statuskombinationen; Admin-Suche/Benachrichtigungen (keine erfundenen Funktionen ergänzt); vollständige Tastatur-/Fokus-/Sprachenabnahme. Nicht migrierte Legacy-Menüs wurden erhalten, um keine Funktion zu verlieren. Keine vollständige globale Umsetzung oder visuelle Freigabe erreicht. Bisherige Release-Prüfungen qualifizieren diese uncommittierten Änderungen nicht. Der vorherige Deployment-Auftrag wurde durch diesen lokalen Implementierungsauftrag unterbrochen und nicht fortgesetzt.
