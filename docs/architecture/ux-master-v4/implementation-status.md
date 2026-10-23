# V4 – Abschluss des maximal 30-minütigen lokalen Blocks

Beginn: 23.10.2026 17:07:24 Europe/Zurich. Verbindliche Grenze: 17:37:24. Kein Push, Merge, Deployment oder produktive Datenänderung.

## Umgesetzt

Zentraler RecordsControls-Owner: eigene Filter- und Sortier-Icons; einfache Auswahl direkt verankert auf Mobile/Tablet/Desktop/PWA; sofortige Anwendung. Bestehender SelectControl-Owner erweitert, keine zweite Auswahlbibliothek. Dropdown etwa 230 px, sichtbarer Titel, 44-px-Optionen, Häkchen und keine Optionspillen. Eigenständige Filter-/Sortierzeilen unter Suche mit gezieltem Text-Reset. Suche und andere Auswahl bleiben erhalten. Bestehende Import-/Archivwerkzeuge bleiben erreichbar. Ein App-Such-X; natives X weiter verborgen.

V4-Headervertrag in Prüfer/Registry aktualisiert: keine frühere V3-Ausnahme für viertes Seitenmenü; Detailtitel zentriert. Einrichtung als ein antippbarer Bereich mit echten Pflichtzahlen, nächstem Pflichtschritt und Fortschritt vor den KPIs. Navigation, Floating-Plus und Finanz-/Rechte-/Datenlogik erhalten.

## Verträge und Inventar

Unveränderte Nutzerdatei source.md, SHA256 111df16067394207abaa960e7e8b36bd55be6621514a117cd6543468504a0bf1. contract.md und AGENTS.md dokumentieren Vorrang und Grenzen. Normative V4-Dateien sind in der Evidence-Identität gebunden. Inventar: 84 Routen und 6252 statische Aktionsvorkommen. Unaufgelöste Rollen/Tarife/Status/Handlerzuordnungen bleiben offen, kein pauschaler Implementierungsnachweis. Quellgraph und Seitenmatrix erneuert, vorhandene Abnahmeflags nicht auf grün gesetzt.

## Erfolgreiche gezielte Prüfungen

TypeScript; gezieltes ESLint; UI-Foundation und CSS-Konsistenz; UX-Regression mit Finanz-/Fehler-/Doppelschreibschutz; tatsächliche Rollen-Dashboards; Statistik/Perioden/Vorperioden und Begrüssung; Erstellung/Navigation; geschützte Navigation samt ursprünglicher Icon-Referenz und negativem Home-Icon-Gegenbeispiel; Lokalisierungsabdeckung; Operator-Verträge mit Rollenverweigerung und Audit-Rollback; V4-Fortschritt und fünfsprachige zentrale Werkzeugtexte. Der V4-Unit-Test ist im bestehenden pnpm-test-Ablauf eingebunden. Gezielte reale Chromium-Kontrollprüfung: 16 Fälle über 320/360/390/430/768/1024/1440/1920 px und Hell/Dunkel erfolgreich (vor letzter isolierter Nicht-Tool-Fokusabgrenzung und zusätzlicher Raster-Gegenprüfung); abschliessender Lauf separat ausgewiesen.

## Echte Vorschau

Kundenliste bei 390 px und 1440 px gelesen, Sortier-Dropdown geöffnet, Name A–Z gewählt, aktive Zeile und Reset sichtbar. Screenshot v4-kunden-sort-dropdown-mobile.png zeigt den sichtbaren Titel; v4-kunden-sort-reset-mobile.png die aktive Sortierung. Browser-Tab bleibt zur Freigabe offen. Keine Demo-Mockups als Implementierungsbeleg.

## Offene Abnahme / Blocker

Die erweiterte WebKit-Control-Suite ist NICHT grün: vorhandene Remote-Auswahl/Paginierung bzw. Retry-Fokus lief in ein Zeitlimit. Die letzte Veränderung ist deshalb auf einfache Tool-Dropdowns begrenzt; das bisherige Pointerverhalten anderer Selects bleibt erhalten. Kein Check wurde deaktiviert und keine vollständige CI-Freigabe behauptet. Vollständige Pflicht-CI erst bei separat freigegebenem Integrationscommit. Keine Garantie zukünftiger grüner GitHub-Läufe.

Nicht vollständig nachgewiesen: gesamte Landingpage, alle Admin-Rollenansichten, alle verschachtelten Objektaktionen, gesamte Fünf-Sprachen-App, physische PWA, alle Tarif-/Statuskombinationen und vollständiger Soll-Ist-Abgleich aller 27 V4-Kapitel. Admin ohne Operator-Anmeldung bleibt ungeprüft. Bestehende Legacy-Fälle ohne sicheren Detailkontext wurden nicht blind entfernt. Gesamtmaster V4 ist innerhalb dieses Zeitblocks NICHT vollständig umgesetzt/abgenommen.

Abschluss 17:37:02: Auch der abschliessende Chromium-Control-Lauf mit zusätzlicher Prüfung der Auswahlzeile unter der Suche hat alle 16 Fälle bestanden. WebKit bleibt wegen Remote-Select/Retry offen; die allerletzte Abgrenzung des Pointerverhaltens anderer Selects wurde innerhalb des Zeitlimits nicht erneut vollständig browsergeprüft.
