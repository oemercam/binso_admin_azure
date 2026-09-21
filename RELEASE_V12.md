# Binso Admin v12 – Release Validation

- Statischer E2E-Audit: 63 Checks erfolgreich.
- Demo-Daten-Schutz: Kunden, Angebote, Rechnungen, Mitarbeitende und weitere Seeds werden nach einem Legacy-Update nicht mehr durch leere Browser-Snapshots verdrängt.
- Mobile Listen: `.data-list` wird auf Mobile/PWA wieder sichtbar und als flache Liste dargestellt.
- Dialoge: Desktop, Tablet, Mobile/PWA erhalten Viewport-Limits und internes Scrolling.
- Rechnungserstellung: eigenes Responsive-Hardening vorhanden.
- Service-Worker-Cache auf `binso-shell-v12` erhöht, damit ältere Shell-Caches beim Aktivieren der neuen Version entfernt werden.

Hinweis: Der vollständige `npm ci && npm run verify:release && npm run build`-Lauf wird im GitHub-Workflow mit der bestehenden `package-lock.json` ausgeführt.


## v12.1 UI Fixes
- Transparente Binso-Logos für Light/Dark Mode
- Mobile-Pill zentriert, ohne innere Trennlinien, mit symmetrisch ausragendem Plus-Button
- Mobile Navigation mit bereinigter doppelter Trennlinie
- Sales Pipeline und Zahlungen auf Mobile korrekt lesbar
