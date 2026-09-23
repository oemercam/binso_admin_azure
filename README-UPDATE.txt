Binso Admin V20 - Current Full V43

V43 entfernt die Tabellen-/Spaltenbeschriftungen aus allen Mobile/PWA-Masterlisten.

Auf Mobile/PWA nicht mehr sichtbar:
- Kunde
- Kontakt
- Status
- Betrag
- Gültig bis
- Budget
- Verbraucht
- Rest
- Abrechnung
- weitere Desktop-Spaltenüberschriften

Nach Suchfeld/Toolbar beginnt die Liste direkt mit dem ersten Datensatz.

Betroffen:
- Kunden
- Angebote
- Aufträge
- Verträge
- Rechnungen
- Mitarbeitende

Desktop/Web behält die Tabellenüberschriften.

Alle V42-Anpassungen für die kompakte Zwei-Zeilen-Darstellung bleiben erhalten.

Prüfen:
npm run typecheck
npm run lint
npm run architecture:check
npm run actions:check
npm run process:check
npm run mobile-ui:check
npm run build
