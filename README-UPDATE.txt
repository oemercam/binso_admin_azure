Binso Admin V20 - Current Full V37

V37 standardisiert den vertikalen Seitenaufbau.

Korrigiert:
- Abstand Titel -> Beschreibung ist überall gleich.
- Abstand Beschreibung -> erster sichtbarer Seiteninhalt ist überall gleich.
- Desktop: 20 px nach dem PageHeader.
- Mobile/PWA: 14 px nach dem PageHeader.
- Erste Listen/KPIs/Toolbars fügen keinen zusätzlichen oberen Abstand mehr hinzu.
- Versteckte responsive Blöcke sind vollständig layout-neutral.

Damit wurde insbesondere der zusätzliche Abstand auf Verträge zwischen Beschreibung und erstem Vertrag entfernt.

Zentral geprüft/abgedeckt:
- Dashboard
- Kunden
- Angebote
- Aufträge
- Verträge
- Rechnungen
- Finanzen
- Buchhaltung
- Mitarbeitende
- Zeiterfassung
- Einstellungen
- Detailseiten mit gemeinsamen PageHeader-Strukturen

Alle bisherigen V36-Anpassungen bleiben enthalten.

Prüfen:
npm run typecheck
npm run lint
npm run architecture:check
npm run actions:check
npm run process:check
npm run build
