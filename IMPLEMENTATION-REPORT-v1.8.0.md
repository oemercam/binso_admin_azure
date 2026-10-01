# Binso One v1.8.0 — Implementation Report

## Ausgangslage

v1.7.4 war technisch sauber deployed, die Mobile/PWA-Parität zum freigegebenen Mockup war aber zu stark CSS-getrieben. Generische Desktop-Strukturen wurden auf Mobile umgestylt, ohne für die zentralen App-Flows eine eigene mobile Informationshierarchie zu besitzen.

## Umsetzung

- `Dashboard`: neue mobile DOM-Struktur mit Begrüssung, KPI-Raster, Aktivitäten und offenen Arbeiten.
- `ModulePage`: Mobile-Titel, Eintragszähler, Modulzugriff und direkte Ansichtsumschaltung.
- `DetailPage`: mobile Topbar, Back-Navigation, Aktionen und flache Informationshierarchie.
- `EntityForm`: Mobile-Topbar, Fortschrittsdarstellung und sticky Abschlussaktionen.
- `TimeTrackerPanel`: mobile Timer-Hierarchie entsprechend App-Referenz.
- `Settings/Auth/Onboarding`: kompaktere mobile Darstellung ohne Desktop-Card-Landschaften.
- Neue zentrale Komponenten: `MobileModuleLauncher`, `MobileModuleOverviewPage`, `MobileBackButton`.
- Neue Workspace-Route `/module` und passende Route-Metadaten.
- `ListToolbar`: Ansicht wechselt direkt; kein unnötiges Zwischenmenü mehr.
- `styles/mobile-pwa.css`: weiterhin einzige release-owned Mobile/PWA-Designschicht.
- i18n für alle neuen sichtbaren Texte in DE/EN/FR/IT/TR ergänzt.

## Sicherheit und Datenbank

Authentifizierung, Rollen/Rechte, Tenant-Isolation, RLS, serverseitige Validierung, Sessions, API-Guards und bestehende Sicherheitsarchitektur wurden nicht verändert. Es gibt keine neue persistente Funktion und daher keine neue Datenbankmigration.

## Desktop Freeze

Die neue Implementierung ist auf Mobile/PWA unterhalb des bestehenden Breakpoints gescoped. Desktop-Navigation, Tabellen, Formulare, Cards, Dialoge und Dichte wurden nicht umgebaut.

## QA in dieser Arbeitsumgebung

PASS: release-nahe statische Architektur-, i18n-, UI-, Overlay-, Navigation-, Route-Matrix- und Mobile/PWA-Selfchecks, soweit sie keine installierten npm-Abhängigkeiten voraussetzen.

NOT EXECUTED: vollständiges `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm audit`, `pnpm db:check`, `pnpm build` und echte Browser-Screenshot-Regression. Grund: Sandbox hat Node 22 statt Node 24 und keinen Registry-Zugriff für `pnpm install`. Diese Gates müssen vor Push/Deployment lokal und in GitHub Actions erfolgreich sein.
