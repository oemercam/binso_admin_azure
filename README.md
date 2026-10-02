# Binso One

App-first UI prototype for Binso One by Binso GmbH.

## Included

- Marketing site, product page and pricing
- Demo access, login and minimal registration
- Responsive customer app with mobile bottom navigation
- Dashboard, customers, offers, invoices, payments, products, employees, expenses and time tracking
- Responsive invoice editor with live document preview
- Support experience
- Separate Binso operator environment for support, monitoring, payments, suspensions and audit
- PWA manifest and safe-area aware mobile layout
- Original Binso brand assets

## Local development

```powershell
corepack enable
corepack prepare pnpm@latest --activate
pnpm install
pnpm lint
pnpm typecheck
pnpm build
pnpm dev
```

Then open http://localhost:3000.

## Main routes

- `/` marketing
- `/produkt`
- `/preise`
- `/demo`
- `/login`
- `/registrieren`
- `/dashboard`
- `/kunden`
- `/angebote`
- `/rechnungen`
- `/zahlungen`
- `/produkte`
- `/mitarbeiter`
- `/spesen`
- `/zeit`
- `/support`
- `/einstellungen`
- `/operator`

This first release intentionally uses demo data. Backend, authentication, database and billing integrations are the next layer and can be added without redesigning the UI shell.
