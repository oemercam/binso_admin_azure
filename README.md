# Binso One

Binso One is a business platform developed and operated by Binso GmbH for customer organizations. It combines customers, offers, orders, time tracking, invoicing, finance, accounting, employees and application settings in one responsive Next.js application for desktop, mobile browser and installed PWA use.

## Stack

- Next.js 16 / React 19 / TypeScript
- Node.js 24
- PWA with service worker and manifest
- Microsoft Entra / Azure App Service deployment path
- GitHub Actions with OIDC-based Azure login

## Development

Requirements: Node.js 24 and pnpm 10 with the committed `pnpm-lock.yaml`.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Quality gates:

```bash
pnpm typecheck
pnpm lint
pnpm architecture:check
pnpm build
```

`pnpm verify` runs the complete local release gate.

## Project structure

- `app/` routes, metadata, manifest and application styles
- `components/` shared application and design-system components
- `hooks/` centralized interaction hooks
- `lib/` auth, configuration, browser and HTTP infrastructure
- `modules/` domain-specific rules and types
- `database/` target database schema
- `public/` canonical brand assets, generated PWA icons and service worker
- `scripts/` architecture guardrails
- `docs/` current architecture, design system and deployment notes

## Deployment

Production deploys from `main` and can also be started manually. GitHub Actions uses `ubuntu-24.04`, Node.js 24, deterministic `pnpm install --frozen-lockfile`, quality gates, a standalone deployment artifact and Azure OIDC login. See `docs/DEPLOYMENT.md`.

## Architecture

See `docs/ARCHITECTURE.md` and `docs/DESIGN_SYSTEM.md`. Historical migration reports are intentionally not kept in the production repository; Git history is the archive.
