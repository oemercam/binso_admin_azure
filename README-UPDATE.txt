Binso Admin V20 - Current Full V39

V39 korrigiert das Dashboard-KPI-Problem strukturell.

Ursache:
- V35 hatte für dieselbe Kennzahl zwei Label-Elemente in den DOM geschrieben:
  vollständige Desktop-Bezeichnung + separate Mobile-Bezeichnung.
- Die Sichtbarkeit war CSS-abhängig. Sobald eine ältere/generische Regel eingriff,
  konnten beide Bezeichnungen erscheinen.
- Für die drei Owner-KPIs wirkten weiterhin mehrere generische metric-Regeln.

Korrektur:
- pro KPI existiert jetzt exakt EIN Label im React/DOM
- Dashboard verwendet die kompakten Bezeichnungen:
  Umsatz
  Nicht verrechnet
  Offene Rechnungen
- kein mobileLabel/desktopLabel-System mehr
- Owner-KPI-Zeile besitzt eine eigene kanonische ID
- Mobile/PWA erzwingt exakt 3 gleich breite Spalten und exakt 1 Zeile
- vierte Kennzahl wird Mobile/PWA ausgeblendet
- Werte und Bezeichnungen bleiben einzeilig
- gleiche Höhe, gleiche Innenabstände, gleiche Trennlinien
- zusätzliche automatische Prüfung verhindert doppelte Dashboard-KPI-Labels

Prüfen:
npm run typecheck
npm run lint
npm run architecture:check
npm run actions:check
npm run process:check
npm run mobile-ui:check
npm run build
