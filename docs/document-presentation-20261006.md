# Invoice and offer presentation

The shared letter layout uses sender/recipient addresses, document number and dates, an optional offer title, item quantities with units, right-aligned amounts, VAT grouped by line rate, currency and professional closing text. Stored company introduction and closing texts take precedence over the new defaults. An invoice already marked paid uses a payment acknowledgement instead of another payment request. Offers render their actual validity and currency.

The visible demo warnings were removed at the user's request. Migration 0037 changes only synthetic organizations and their document numbers, retains IDs and financial amounts, avoids number collisions and preserves customized company names. The demo/trial flags, authentication, isolation, expiry and payment restrictions remain internal and unchanged. New sessions inherit the template's document settings and use Alpenblick Digital AG. The Swiss QR example account remains synthetic configuration; no live customer banking details were introduced.

References consulted for structure and tone:

- https://www.bexio.com/de-CH/rechnungsvorlage
- https://www.bexio.com/de-CH/offerte
- https://www.mocoapp.com/funktionen/4-abrechnung/inhalt/32-rechnung-erstellen
- https://www.mocoapp.com/funktionen/24-angebote/inhalt/122-angebotselemente
- https://www.mocoapp.com/funktionen/1-einstellungen/inhalt/124-layout

Validation includes document markup tests (addresses, configured texts, due dates, units, currency, paid status and absence of visible demo labels), migration preservation checks, tenant/RLS tests, lint, TypeScript, CSS architecture and production build. These checks do not replace physical iPhone layout verification or certify customer-specific tax/legal completeness.
