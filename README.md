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
