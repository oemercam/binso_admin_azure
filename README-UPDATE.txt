Binso Admin V20 - Current Full V33

Hotfix gegenüber V32:
- unbenutzte Variable openAmount auf der Kundendetailseite entfernt
- Ursache: Offener Betrag wurde in V32 bewusst aus der allgemeinen Kundenübersicht entfernt, die Berechnung blieb jedoch im Code bestehen
- keine visuelle oder fachliche Änderung gegenüber V32
- CI-Lint-Warnung damit bereinigt

Prüfen:
npm run typecheck
npm run lint
npm run architecture:check
npm run actions:check
npm run process:check
npm run build
