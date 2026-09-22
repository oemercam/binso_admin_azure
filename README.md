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


## v18.8.2 Mobile Header
- Flacher Mobile-Header in derselben Farbe wie die Seite.
- Kein Blur, Schatten oder separater Hintergrundeffekt.
- Header blendet beim Scrollen nach unten aus und beim Scrollen nach oben wieder ein.
- Binso-Logo auf Mobile auf 28 px vergrössert.
- Ein einziges Create-Plus auf Mobile: zentral in der unteren Pille.
- Dieses Plus öffnet auf Kunden, Aufträgen, Angeboten, Rechnungen, Mitarbeitenden, Zeiterfassung und Buchhaltung direkt den passenden Erfassungsdialog; auf anderen Seiten das globale Quick-Create-Menü.

## Architecture standard v20

The centralized application architecture is documented in [`ARCHITECTURE_STANDARD_V20.md`](./ARCHITECTURE_STANDARD_V20.md). The implementation/verification status and known technical debt are documented in [`STANDARDIZATION_REPORT_V20.md`](./STANDARDIZATION_REPORT_V20.md).

