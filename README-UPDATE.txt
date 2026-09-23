Binso Admin V20 - Current Full V38

V38 konsolidiert die Mobile/PWA-Darstellung strukturell.

Wichtig:
- keine weitere Patch-Schicht über V37
- alte widersprüchliche Mobile-Regeln für die gemeinsamen Seitenkomponenten wurden entfernt
- V23/V25/V30/V34/V35/V36/V37 CSS-Patchbereiche wurden durch eine einzige kanonische Mobile/PWA-Schicht ersetzt
- App-Main besitzt den Seitenrand
- PageHeader besitzt den vertikalen Abstand
- Standardlisten besitzen eine gemeinsame Mobile-Geometrie
- 3er-, 4er- und 2er-KPI-Darstellungen sind zentral definiert
- Dashboard Heute wichtig ist zentral definiert
- Kunden-Detaildarstellung verwendet den gleichen Mobile-Rhythmus
- Navigation, Overlays, PDF/Preview und Fullscreen-Editoren bleiben in ihren eigenen bestehenden Systemen

Neue Qualitätsprüfung:
npm run mobile-ui:check

verify führt diese Prüfung automatisch mit aus.

Prüfen:
npm run typecheck
npm run lint
npm run architecture:check
npm run actions:check
npm run process:check
npm run mobile-ui:check
npm run build
