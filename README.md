# Binso Admin v9 – Modular Enterprise RC

Kumulativer Stand aus v8 inklusive Dokumente, Angebote, Rechnungen, Zahlungen, PWA/Mobile-Polish, Toggles, Versand-/Mahn-/Lohn-Einstellungen und neu modularisierten Auftrags-/Zeitnachweisregeln.

## Was in v9 zusätzlich sauber getrennt ist

- Vertrags-/Leistungskette (`modules/contracts`)
- Auftragsregeln (`modules/orders`)
- Zeiterfassung und externe Nachweise (`modules/time`)
- Mitarbeiter-/Subunternehmer-Overrides (`modules/workforce`)
- Abrechnungsmodul als eigene Domäne (`modules/billing`)
- reale Demo-Regeln für das WTO-Mandat (`lib/data/order-policies.ts`)
- Auftragsdetail mit Tabs für Übersicht, Zeitregeln, Mitarbeitende, Abrechnung und Nachweise
- `ARCHITECTURE.md` und `FEATURE_MAP.md`

## Wichtiger Stand

Die Anwendung ist weiterhin ein Demo-/Integrationsstand. Geschäftsdaten werden noch im Browser gespeichert. Für Produktion werden Azure PostgreSQL, Blob Storage, Microsoft Graph, serverseitige Jobs und Audit-Logging angeschlossen.

## Deployment

Die bestehende `package-lock.json` aus dem GitHub-Repository behalten. Sie ist absichtlich nicht Bestandteil dieses ZIPs.


## v11.1 Mobile/PWA pill polish
- separators around the central create action removed
- central + is now a 56px circular floating action, slightly above the pill
- pill remains compact and safe-area aware

## v11.2 Brand & Mobile Pill Polish
- Original Binso SVG wordmark and icon assets integrated for light/dark UI.
- Document preview uses the official Binso wordmark.
- Mobile/PWA create action is 60 px round and centered vertically so the circle extends equally above and below the pill.
- No separators around the create action.
