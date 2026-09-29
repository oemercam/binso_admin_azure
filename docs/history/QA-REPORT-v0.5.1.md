# QA v0.5.1

Gezielt korrigierte Meldungen aus dem lokalen `pnpm lint`:
- `checkout-page.tsx`: `no-html-link-for-pages`
- `checkout-page.tsx`: unbenutzter Import
- `detail-page.tsx`: `react-hooks/exhaustive-deps`
- `document-detail.tsx`: interne Navigation über `window.location.href`

Vor Ausgabe statisch geprüft:
- kein `getOrganization` Import in Checkout
- kein `<a href="/">` in Checkout
- kein `window.location.href` in `document-detail.tsx`
- Seed in `detail-page.tsx` über `useMemo`
