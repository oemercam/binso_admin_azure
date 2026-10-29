# Lokaler Prüfbeleg

Branch: `feat/global-surface-standard-20261027`, Basis
`f0b01b727204965555c57bfcf1eb74113b6ec7fd`. Keine Produktionsänderung und keine
neuen kostenpflichtigen Dienste. Keine Datenbankmigration erforderlich.

## Ausgeführt

- Produktionsbuild einschliesslich TypeScript-Prüfung erfolgreich.
- Vollständiges ESLint erfolgreich; nach abschliessenden Änderungen betroffene
  Quellen und Testadapter nochmals gezielt geprüft.
- Die Skripte der bestehenden `pnpm test`-Kette wurden abschnittsweise ausgeführt.
  Erste Läufe fanden veraltete Testadapter, eine veraltete Dialogerwartung und
  ein nicht mehr verwendetes FAB-Selektorfragment. Diese wurden korrigiert;
  die betroffenen Tests und die nachfolgenden Abschnitte sind erfolgreich.
  Dies ist kein behaupteter durchgehend grüner CI-Lauf.
- Echte API-/RLS-Prüfung in der migrierten isolierten PGlite-Testdatenbank:
  frischer Nachweis, Pflichtdaten/IBAN, Rollen-/Tenant-Verweigerung, Erhaltung
  optionaler Einstellungen und atomarer Rollback bei erzwungenem Datenbankfehler.
- Architektur-/Routen-/UX-Verträge, Dokumentationskonsistenz, Release-Preflight,
  unveränderte Navigations-/FAB-Verträge und Paket-/Asset-Prüfungen erfolgreich.
- `surface-standard-browser-test.mjs`: Chromium und WebKit × 390/820/1440 Pixel ×
  Light/Dark. Firmenvervollständigung, Kundenerfassung, manuelle Zeiterfassung,
  kurze Passwortaktion; zusätzlich 320 × 400 Pixel, erreichbare Aktionszeilen,
  Schutz früher Eingaben, Bestätigung bei Abbrechen/Browser-Zurück, Entwurfserhalt,
  Tastaturaktivierung und Fokus-Rückkehr. Alle 12 Kombinationen erfolgreich.

Unabhängige Fixture-Dokumente verwenden wie die bestehende Hauptprüfsuite neue
Browserseiten. Laufzeitfehler werden vor jedem Fixture-Wechsel geprüft; es gibt
keine pauschale Unterdrückung von WebKit-Fehlern. Echte Navigation und Zurück
werden im selben Dokument geprüft. Keine Screenshot-Baselines geändert.

## Noch zwingend offen

Die vollständige vorhandene Browser-/Routenmatrix konnte lokal nicht starten:
`createUiAuthFixture` benötigt eine eigene PostgreSQL-Instanz auf Loopback.
Verbindung zu `127.0.0.1:5432` verweigert; die installierte Docker-Oberfläche
stellt hier keine laufende Engine bereit. Die echte Authentifizierungsfixture
wurde nicht durch einen Bypass ersetzt. Native PostgreSQL-Paralleltests und die
vollständige Matrix müssen in der vorgesehenen QA-Umgebung ausgeführt werden.
Die aktualisierten Browseradapter für ganze Seiten sind bis dahin unqualifiziert.

Physisches iPhone Safari, installierte iOS-PWA, reale Bildschirmtastatur,
physisches iPad und deren reale Safe Areas wurden nicht geprüft. Browser-/Viewport-
Emulation ersetzt diese Abnahme nicht. Deshalb keine globale visuelle Abnahme,
keine Merge- oder Deployment-Freigabe aus diesem Prüfbeleg.
