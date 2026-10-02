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

## Architecture

- Next.js App Router with React and TypeScript
- Centralized UI shell and shared components
- Reusable record browser for search and status filtering
- Dedicated document editor/preview module
- Centralized demo data and public site configuration
- Persistent local demo data provider with backend-swappable CRUD contract
- Security headers and production-aware Content Security Policy
- Private no-store caching for authenticated-style routes
- PWA service worker with conservative public-shell caching only
- Marketing-only robots and sitemap exposure

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

The current UI release intentionally uses demo data. Customer, payment, product, employee, expense, support-ticket, offer and invoice creation now write to a persistent browser-local demo store so realistic flows survive navigation and reloads. Search, status filtering, sorting, persistent timer state, customer detail tabs, document hub, notification center, account/security/subscription interaction flows and operator action feedback are also implemented.

The local demo store is an adapter for the prototype, not the production database. Backend authentication, server-side database persistence, billing provider integration, email delivery and real Swiss QR generation remain separate production integrations and are not represented as completed until connected to real services.

Security-sensitive routes are configured with private no-store caching already. The current authentication screens are still prototype UI and do not claim to enforce access control until a real identity backend is connected.
