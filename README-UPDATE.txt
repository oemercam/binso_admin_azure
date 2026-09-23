Binso Admin V20 - Current Full V42

V42 korrigiert die Mobile/PWA-Listen auf eine wirklich kompakte Darstellung.

Kunden nach der Suche:
- pro Kunde nur eine kompakte Listenzeile
- Zeile 1: Firmenname
- Zeile 2: Kontaktperson
- ca. 48 px Zeilenhöhe
- nur 6 px vertikaler Innenabstand
- Chevron rechts
- kein Zahlungsziel
- kein Status
- keine Kundennummer
- keine Adresse
- keine zusätzlichen Metadaten

Das gleiche kompakte 2-Zeilen-Muster gilt für:
- Kunden
- Angebote
- Aufträge
- Verträge
- Rechnungen
- Mitarbeitende

Mitarbeitende verwenden denselben Rhythmus; Avatar wurde auf Mobile/PWA verkleinert, damit die Zeile nicht höher wird.

Prüfen:
npm run typecheck
npm run lint
npm run architecture:check
npm run actions:check
npm run process:check
npm run mobile-ui:check
npm run build
