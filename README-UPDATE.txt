Binso Admin V20 - Current Full V41

V41 standardisiert die Mobile/PWA-Listen auf exakt zwei Textzeilen.

Kunden:
- Zeile 1: nur Firmenname
- Zeile 2: Kontaktperson
- Kundennummer auf Mobile/PWA ausgeblendet
- Zahlungsziel aus der Kundenübersicht entfernt
- Status aus der Kundenübersicht entfernt
- keine zusätzlichen Kunden-Metadaten in der Mobile/PWA-Liste

Einheitliches Muster auf allen Masterlisten:
- Kunden: Firmenname / Kontaktperson
- Angebote: Angebot / Kunde
- Aufträge: Auftrag / Kunde
- Verträge: Vertrag / Kunde
- Rechnungen: Rechnung / Auftrag oder Periode
- Mitarbeitende: Name / Rolle

Mobile/PWA:
- exakt zwei Textzeilen
- Chevron rechts
- keine Status, Daten, Beträge oder sonstige operative Werte in der Übersicht
- einheitliche Zeilenhöhe, Abstände und Typografie

Desktop:
- zusätzliche fachliche Informationen bleiben dort erhalten, ausser Zahlungsziel/Status in der Kundenübersicht wurden bewusst entfernt.

Prüfen:
npm run typecheck
npm run lint
npm run architecture:check
npm run actions:check
npm run process:check
npm run mobile-ui:check
npm run build
