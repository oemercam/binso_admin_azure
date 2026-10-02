# Binso One

Binso One is the app-first business platform by Binso GmbH for Swiss SMEs.

## Current release: v0.8 product-completion foundation

This release keeps the standalone demo available without external services and connects the core customer and operator workflows to the production data model when Supabase is configured.

### Production foundations implemented

- Supabase email/password authentication through server API routes
- HttpOnly SameSite sessions with refresh-token handling
- password recovery and password reset
- protected customer and operator routes
- tenant memberships and PostgreSQL Row Level Security
- account restrictions enforced at the RLS boundary
- private tenant-aware file storage policies
- customers and customer contacts
- products and services
- employees
- expenses and private receipt uploads
- payments against customer invoices
- time entries
- support tickets, replies, internal operator notes and private attachments
- company and personal profile settings
- offers and invoices with atomic database create/update functions
- tenant dashboard aggregates and global tenant search
- dynamic record detail/edit flows
- operator dashboard, tenants, tickets, account lifecycle, restrictions, announcements, monitoring state and audit
- customer subscription/account-state display without fake billing data
- real password change flow
- isolated demo data when the backend is not configured

### Explicitly not marked complete

These areas still require their real external production services or final domain implementation:

- Stripe SaaS subscription checkout, payment methods, invoices and webhooks
- transactional email delivery for invoices, support and system messages
- standards-compliant Swiss QR bill generation
- bank synchronization
- secure operator impersonation/support access
- verified cross-device auth-session management and MFA enrollment
- full production translations for DE / FR / IT / EN / TR

Binso One does not display invented production payment cards, billing invoices, system SLA values, user devices or operator identities when those data sources are not connected.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Supabase Auth
- PostgreSQL / PostgREST
- Supabase private Storage
- PostgreSQL RLS for tenant isolation
- PWA manifest and conservative service-worker caching
- Azure App Service deployment through GitHub Actions

Customer-facing request paths use the authenticated user JWT and RLS. They do not require a Supabase service-role key.

## Backend setup

1. Create or select the Supabase project for Binso One.
2. Apply all SQL files in `supabase/migrations` in filename order.
3. Configure local development in `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MARKETING_URL=https://www.binso.ch
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

4. Configure the same public Supabase values in the Azure production application settings.
5. Configure the Supabase Auth Site URL and redirect allowlist for the actual Binso One app URL and `/passwort-zuruecksetzen`.
6. Provision the first operator deliberately in `public.operator_users` after the authenticated user exists. Never grant operator rights from client-editable user metadata.
7. Verify the private Storage buckets and RLS policies created by the storage migration.

When Supabase values are absent, the application remains in prototype/demo mode for UI review and CI without pretending that persistence or authorization is active.

## Local QA

```powershell
corepack enable
corepack prepare pnpm@latest --activate
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm build
pnpm dev
```

## Main routes

- `/`
- `/produkt`
- `/preise`
- `/demo`
- `/login`
- `/registrieren`
- `/passwort-vergessen`
- `/passwort-zuruecksetzen`
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

## Security posture

- CSP and security headers are centralized in `next.config.ts`.
- Authenticated-style routes and APIs use private/no-store caching and noindex.
- Mutation endpoints use same-origin checks and bounded JSON bodies.
- Login and password recovery avoid account enumeration.
- Tenant IDs are resolved server-side.
- Tenant restrictions are enforced by RLS for core data and private Storage, not only by UI.
- Support remains available while a customer account is restricted.
- Internal support notes are excluded from customer RLS.
- Private files use tenant-prefixed paths, allowlisted MIME types, size limits and short-lived download URLs.
- Operator access is held in a dedicated authorization table and checked server-side.
- Critical operator lifecycle changes are written to the operator audit log.
- Demo access is isolated from authenticated production data.

## CI

GitHub Actions runs:

- frozen-lockfile install
- ESLint with zero warnings
- TypeScript typecheck
- production build
- runtime route smoke tests
- `/api/health`
- security-header checks

Azure deployment performs a production application health check after deployment.
