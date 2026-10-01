# Binso One v1.6.6 — Mobile/PWA Navigation & App Shell Consolidation

## Ziel
Dieser Release setzt die ergänzten Mobile/PWA-Vorgaben 137–174 auf Root-Cause-Ebene um. Die fachliche Businesslogik bleibt gemeinsam mit Desktop; Mobile/PWA erhält eine app-gerechte Präsentation.

## Zentral geändert
- Sichtbare Zurück-Buttons/-Links aus Workspace-Detail-, Create-, Dokument- und Support-Flows entfernt; die alte `PageBackButton`-Komponente wurde gelöscht.
- Mobile/PWA Global Header auf **Binso Logo + Avatar** reduziert. Keine globale Header-Suche auf Mobile/PWA.
- Header flach und stabil: kein Blur, Glass, Gradient, Glow, Shadow oder transparenter Content-Durchblick; Safe Area bleibt Teil derselben Fläche.
- Avatar verwendet dieselben Account-Daten, Permissions, Links, Theme- und Logout-Aktionen wie Desktop; Mobile/PWA rendert diese zentralen Aktionen als Bottom Sheet.
- Zentrale `config/route-metadata.ts` für Parent-Bereich, Navigation Group, Bottom-Nav-Zustand, Auth und Quick-Create-Kontext.
- Mobile `Mehr` fachlich bereinigt: Kunden und Zeiterfassung werden nicht doppelt geführt; Aufgaben ist unter Arbeit erreichbar.
- Quick Create zentralisiert und auf häufige Create-Flows begrenzt: Kunde, Offerte, Rechnung, Projekt, Zeit, Spese.
- Bottom Navigation zeigt auf Detail-/Create-Seiten den fachlich korrekten Parent-Bereich aktiv.
- Redundantes `Binso One` über Workspace-Seitentiteln entfernt.
- Kunden-Quick-Create zeigt initial nur Firmenname; E-Mail und weitere Stammdaten bleiben optional unter Weitere Angaben.
- Zwei gleichwertige Overlay-Aktionen erhalten auf Mobile dieselbe Breite.

## Bestehende v1.6.5 Mobile/PWA-Basis bleibt erhalten
- kompakte Listen und kontextbezogene Suche/Filter/Sortierung
- progressive Detaildaten und `Weitere Angaben`
- on-demand Dokumentvorschau
- responsive Formulare und Bottom Sheets
- persistente Zeiterfassung
- Scroll-/Back-State-Restoration
- DE/EN/FR/IT/TR

## Datenbank
Keine neue v1.6.6-Migration. Der Release enthält weiterhin `0019_v163_productivity_ux.sql`, da Produktion vor dieser Release-Linie zuletzt auf v1.6.2 bestätigt war.
