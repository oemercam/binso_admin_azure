# Binso One

Binso One is the app-first business platform by Binso GmbH for Swiss SMEs.

## Current release: v0.7 backend foundation

The UI prototype remains available without backend configuration, including the isolated demo mode. When Supabase configuration is present, Binso One now switches core customer workflows to the production backend foundation.

### Connected production foundations

- Supabase email/password authentication through server-side API routes
- HttpOnly, SameSite session cookies with refresh-token handling
- Password recovery and password reset flow
- Protected customer routes when the backend is configured
- Explicit server-side operator authorization
- Multi-tenant PostgreSQL schema with tenant memberships
- Row Level Security for tenant data
- Hardened support RLS that excludes internal notes from customer access
- Customers, products, employees, expenses, payments and time entries APIs
- Support tickets and customer message APIs
- Company and personal profile settings APIs
- Atomic invoice and offer create/update database functions
- Audit-log foundation for document mutations
- Real tenant data loading for core lists
- Demo data remains isolated from authenticated production data

### Still intentionally not marked production-complete

The following integrations need the actual external production services or business configuration before they can be called complete:

- Stripe subscription billing and webhooks
- Resend / transactional email delivery for invoices and support
- Supabase Storage for receipts, company logos and support attachments
- Standards-compliant Swiss QR bill generation
- Real bank synchronization
- Operator data aggregation and actions beyond authorization
- Full localization content for DE / FR / IT / EN / TR

The UI never labels these integrations as completed when they are still placeholders.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Supabase Auth + PostgreSQL/PostgREST backend foundation
- PostgreSQL RLS for tenant isolation
- PWA manifest and conservative service-worker caching
- Azure App Service deployment through GitHub Actions

No Supabase service-role key is used by customer-facing request paths. Tenant authorization is performed with the authenticated user's JWT and PostgreSQL RLS.

## Backend setup

1. Create or select the Supabase project for Binso One.
2. Apply the SQL files in `supabase/migrations` in filename order.
3. Configure locally in `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MARKETING_URL=https://www.binso.ch
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

4. Configure the same public Supabase values in the Azure production application settings.
5. Configure the Supabase Auth Site URL / redirect allowlist for the actual Binso One app URL and `/passwort-zuruecksetzen`.
6. Create the first authenticated Binso operator deliberately, then provision it in `public.operator_users`. The migration contains the example SQL; do not grant operator access through client metadata.

When the Supabase values are absent, Binso One stays in prototype/demo mode so CI and local UI review continue to work without pretending a backend exists.

## Local development

```powershell
corepack enable
corepack prepare pnpm@latest --activate
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm build
pnpm dev
```

Then open http://localhost:3000.

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
- Mutation endpoints check same-origin requests and bounded request sizes.
- Login errors do not reveal whether a user exists.
- Password recovery returns a uniform public response.
- Customer data access uses the authenticated JWT plus RLS; tenant IDs are resolved server-side.
- Internal support notes are excluded by RLS, not only by UI filtering.
- Operator access is stored in a dedicated server-checked table.
- Demo access and authenticated production data are isolated.

## CI

GitHub Actions performs:

- frozen-lockfile install
- ESLint
- TypeScript typecheck
- production build
- runtime route smoke tests
- `/api/health`
- security-header checks

Azure deployment performs an application health check after deployment.
