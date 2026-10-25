# PWA-Übergänge – lokale Umsetzung vom 25.10.2026

Auftrag: 30 Minuten, bestehende kompakte UX zentral anwenden. Ausgangspunkt ist
der inhaltsgleiche Stand von PR317/Main 8f25f5d. Kein Push und kein Deployment.

## Umgesetzt

- `records.tsx` stellt validierte Suche, Filter, Sortierung und Seite vor dem
  ersten Client-Paint wieder her. SSR bleibt ungelöst; keine Browserdaten auf
  dem Server. Nicht mehr verfügbare Filter werden verworfen.
- Der persistente Rahmen reserviert die Seitenhöhe und hält bekannte
  Listensteuerungen bei der Rückkehr als inerte Platzhalter bereit. Der Cache
  ist begrenzt und sitzungsgebunden. Fremde Routen erhalten keine alten Werte.
- `LoadingState` besitzt zentrale, ruhige Varianten für Seite und Liste.
  Keine sichtbaren Ladesätze, Balken oder neue Animationen. Die Seitenfläche
  wird beim Wechsel nicht erneut eingeblendet oder verschoben. Der Chat behält
  seine eigene Tastatur-/Viewporthöhe. Navigation und FAB sind unverändert.
- Profil-Vorladen verwendet denselben Query-Owner samt Änderungs- und
  Sitzungsgrenzen. Firmenmetadaten und Benachrichtigungen konkurrieren beim
  ersten Dashboard-Aufbau nicht mit Profil und Hauptinhalt. Die drei
  Headerdialoge werden erst beim Öffnen geladen.
- Die Zeiterfassung verwendet für Kunden-/Auftragsverzeichnisse die bestehenden
  Query-Snapshots und leert die Auswahlen nicht mehr vor dem Nachladen.
- Das Dashboard liest den Tarif in seiner vorhandenen autorisierten
  Snapshot-Transaktion. Finanzformeln, Berechtigungsprüfungen und RLS bleiben.
- Identische Spracheinstellungen erzeugen keinen erneuten Sprachwechsel oder
  unnötige URL-Umschreibung. Eine ausdrücklich abweichende URL wird korrigiert.
- Eine neue produktive Version wird anhand vollständiger Build-SHAs beim
  Wiederaufnehmen erkannt. Öffentliche Metadatenabfragen sind gedrosselt und
  verzögert. Ein vorhandener Toast bietet eine ausdrückliche Aktualisierung;
  keine automatische Seitenneuladung. Entwürfe, Formulare, Dialoge und laufende
  POST/PATCH/DELETE/Uploads einschliesslich Antwortvalidierung blockieren sie.

## Verträge und Prüfungen

Neue ausführbare Gegenprüfungen: `scripts/pwa-transition-test.mjs`. Erweitert:
Query-Vorladen mit Sitzungs-/Änderungsgegenfällen, zentrale QA-Auswahl und
Tarifadapter der bestehenden Migrationstests. Komponenten-/Routeninventare und
Matrixzuordnungen sind neu erzeugt; historische Nachweise erteilen keine neue
visuelle Abnahme. Geänderte Zuordnungen bleiben ungeprüft.

Erfolgreich ausgeführt: TypeScript, Lint der geänderten Dateien, neue
PWA-/Dashboard-/Layout-Gegenprüfungen, Query-Navigation, Session/Logout,
PWA-Lebenszyklus, Startup, Audit-/Einrichtungsabläufe, CSS-Architektur,
Lokalisierung, UI-/Navigations-Foundation, Erstellungs-/Navigationsverträge,
Designverträge, Präsentationskonsistenz, Daten-Foundation und UX-Vertragsprüfung.

Der vollständige `pnpm test`-Lauf ist **nicht grün**: der Bash-Monitorgegencheck
in `readiness-integrity-test.mjs:41` scheitert lokal unter Windows. Zunächst
Prozessfehler EACCES, ausserhalb der Prozesssperre weiterhin Exit 1. Nicht
übersprungen oder abgeschwächt. Die separat ausgeführte grosse Migrationssuite
ist erfolgreich: PostgreSQL-Migrationen, deterministische Fixtures,
Tenant-/Plattform-RLS, Finanz-/Dokumentintegrität und Einrichtungsregeln.
Auch der aktualisierte UX-Vertrag und die Architektur-Inventarprüfung bestehen.

Der bestehende Lade-Browsertest verlangt jetzt tatsächlich einen aktiven
Service Worker, statt ihn zu blockieren. Dieser geänderte vollständige
Browserlauf wurde hier **noch nicht ausgeführt**.

## Tatsächliche Vorschau

Isolierte lokale Testfirma auf `http://localhost:3261`, Entwicklungsvorschau.
Dashboard, Kunden, Aufträge und Zeiterfassung geöffnet. Kunden-Sortierung
Name Z–A nach Navigation erhalten; genau eine Listensteuerung. Bei 390 und
1440 Pixeln kein horizontaler Überlauf, Seitenhöhen 788 bzw. 944 Pixel.
Tablet-Stichprobe 768 Pixel ebenfalls ohne horizontalen Überlauf. Das ist keine
CLS-, INP- oder Geschwindigkeitsmessung. Entwicklungskompilierung ist kein
Massstab für Produktionslatenz. Screenshots liegen ausserhalb des Repositorys
im Workspace (`PWA-Umsetzung-Mobile-20261025.png`, Desktop entsprechend).

## Noch offen

Produktionsbuild und vollständige Release-/Rollen-/Geräte-Browserprüfung;
echtes iPhone/iPad mit installierter PWA; Messung der authentifizierten
Server-/SQL-Latenzen und Frames; Sprachkatalog-Aufteilung; Aufbewahrung alter
Build-Assets im Deployment. Der Hinweis verbessert den Versionswechsel,
bewahrt aber selbst keine entfernten alten Chunks auf. Eine vollständige
globale Abnahme oder nachgewiesene Startbeschleunigung wird nicht behauptet.
