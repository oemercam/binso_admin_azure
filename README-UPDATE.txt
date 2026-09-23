Binso Admin V20 - Current Full V21

V21 = vollständiger Desktop/Web-Optimierungspass.

Neu:
- Alle App-Seiten erhalten auf Desktop eine begrenzte, lesbare Arbeitsbreite.
- Header, Aktionen, Tabellen und KPI-Bereiche sind für Web dichter und klarer.
- Detailseiten verwenden auf Desktop einen echten Master-Detail-Aufbau.
- Lange Formulare bleiben Mobile/PWA fullscreen, werden auf Web aber als breite zentrierte Dialoge dargestellt.
- ResponsiveOverlay übernimmt diese Logik jetzt ebenfalls zentral.
- Rechnungs- und Angebotsvorschau ist auf Web neu aufgebaut:
  Dokument links, Aktionen rechts in einer eigenen Action-Rail.
- Keine doppelten Mobile-/Desktop-Aktionen in der Web-Vorschau.
- Zoom und A4-Vorschau bleiben technisch unverändert.
- Settings und Kundenaktionen sind für Desktop kompakter.
- Mobile/PWA-Layouts und Touch-Verhalten bleiben separat optimiert.
- Keine parallele Fachlogik; nur responsive Präsentation.
- Alle V20/V19/V18 Workflow-, Rapport-, PWA-, Rechnungs- und Prozessfunktionen bleiben enthalten.

Dokumentation:
docs/DESKTOP-WEB-UI-AUDIT.md
docs/RESPONSIVE-FORM-PRESENTATION.md

Prüfen:
npm run typecheck
npm run lint
npm run architecture:check
npm run actions:check
npm run process:check
npm run build
