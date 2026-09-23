Binso Admin V20 - Current Full V19

Hotfix gegenüber V18:
- TypeScript-Narrowing im Auftrags-Assignment-Editor korrigiert.
- Unnötiges useMemo entfernt, damit ESLint ohne Warning läuft.
- Unbenutzte fillTemplate-Hilfsfunktion in Rechnungen entfernt.
- Keine fachliche Logik von V18 verändert.
- Alle V18 Workflow-, Rapport-, PWA-, UI- und Abrechnungsfunktionen bleiben enthalten.

Prüfen:
npm run typecheck
npm run lint
npm run architecture:check
npm run actions:check
npm run process:check
npm run build
