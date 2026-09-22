# Binso Admin

Binso Admin is the internal administration application for Binso GmbH. It combines customers/prospects, quotes, orders, time tracking, invoicing, finance, accounting, employees and application settings in one responsive Next.js application for desktop, mobile browser and installed PWA use.

## Stack

- Next.js 16 / React 19 / TypeScript
- Node.js 24
- PWA with service worker and manifest
- Microsoft Entra / Azure App Service deployment path
- GitHub Actions with OIDC-based Azure login

## Development

Requirements: Node.js 24 and npm with the committed `package-lock.json`.

```bash
npm ci
npm run dev
```

Release gates:

```bash
npm run typecheck
npm run lint
npm run architecture:check
npm run test:core
npm run build
```

`npm run verify` runs the repository verification sequence.

## Structure

- `app/` routes, layouts, metadata, manifest and application styles
- `components/` shared application and design-system components
- `hooks/` centralized interaction hooks
- `lib/` auth, configuration, formatting, browser and HTTP infrastructure
- `modules/` reusable domain/business rules
- `types/` shared domain types
- `database/` PostgreSQL target schema
- `public/` brand assets, PWA icons and service worker
- `scripts/` architecture guardrails and lightweight core regression tests
- `docs/` current architecture, design system and deployment notes

## Important data-layer note

The current application/reference build uses a versioned, user-scoped browser business store. Route authorization and client data minimization are implemented, but durable multi-user production persistence and authorization must ultimately be enforced by the server/database layer described in `database/schema.sql`.

Current external-integration boundaries are explicit: offer/invoice actions document a sent state but do not yet transmit e-mail through Microsoft Graph; time-evidence files currently persist metadata rather than file bytes; and push activation remains disabled until durable server-side subscription storage is connected.

See `docs/ARCHITECTURE.md`, `docs/DESIGN_SYSTEM.md` and `docs/DEPLOYMENT.md` for the current target architecture and release requirements.
