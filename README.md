# Binso One

Binso One is the app-first business platform by Binso GmbH for Swiss SMEs.

## Current release: v0.9 integration-ready foundation

The standalone demo continues to work without external services. With Supabase configured, the core customer and operator workflows use tenant-isolated production persistence. v0.9 adds the first real external-service integration layer for SaaS billing and transactional email readiness.

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
- customer-invoice payments
- time entries
- support tickets, replies, internal operator notes and private attachments
- company and personal profile settings
- offers and invoices with atomic database create/update functions
- tenant dashboard aggregates and global tenant search
- dynamic record detail/edit flows
- operator dashboard, tenants, tickets, account lifecycle, restrictions, announcements, monitoring state and audit
- isolated demo data when the backend is not configured

### v0.9 external integration layer

Stripe Billing foundation:
- hosted Stripe Checkout for Start, Business and Pro
- existing Stripe Customer reuse
- duplicate-subscription protection
- Stripe Billing Portal handoff for plan, payment method and invoice management
- signed webhook verification using the raw request body
- five-minute signature tolerance
- idempotent billing-event processing in PostgreSQL
- subscription/customer references stored without card data
- Stripe subscription status and period-end synchronization
- server-only Supabase service-role access restricted to trusted webhook processing

Resend foundation:
- server-side REST email client
- explicit configuration detection
- authorized Operator test-email endpoint
- Operator monitoring shows whether email is actually configured
- no customer-facing document email is marked complete until the production document/PDF delivery flow is finalized

Integration monitoring:
- differentiates Operational, Configured, Not connected and Not implemented
- never invents availability percentages for services without telemetry
- customer integration-status endpoint requires authentication
- billing mutation routes require an authenticated tenant session
- webhook route rejects unsigned requests

### Still intentionally not marked complete

These areas still need real provider configuration, credentials, or final domain implementation before they can be called production-complete:

- production Stripe account, products/prices, customer portal settings and webhook secret
- verified Resend sending domain and production sender address
- final invoice/offer email delivery with production PDF attachment
- standards-compliant Swiss QR bill generation
- bank synchronization
- secure Operator impersonation/support access
- verified cross-device auth-session management and MFA enrollment
- full production translations for DE / FR / IT / EN / TR

Binso One does not display invented production payment cards, SaaS invoices, system SLA values, user devices or Operator identities when those data sources are not connected.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Supabase Auth
- PostgreSQL / PostgREST
- Supabase private Storage
- PostgreSQL RLS for tenant isolation
- Stripe Checkout / Billing Portal / signed webhook foundation
- Resend transactional-email foundation
- PWA manifest and conservative service-worker caching
- Azure App Service deployment through GitHub Actions

Customer-facing request paths use the authenticated user JWT and RLS. The Supabase service-role key is reserved for trusted server-to-server integration processing such as verified Stripe webhooks.

## Backend setup

1. Create or select the Supabase project for Binso One.
2. Apply all SQL files in `supabase/migrations` in filename order.
3. Configure local development in `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MARKETING_URL=https://www.binso.ch

NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<server-only-service-role-key>

STRIPE_SECRET_KEY=<stripe-secret-key>
STRIPE_WEBHOOK_SECRET=<stripe-webhook-secret>
STRIPE_PRICE_START=<price-id>
STRIPE_PRICE_BUSINESS=<price-id>
STRIPE_PRICE_PRO=<price-id>

RESEND_API_KEY=<resend-api-key>
BINSO_EMAIL_FROM=Binso One <no-reply@binso.ch>
```

4. Configure the same values in Azure App Settings. Do not expose the service-role key, Stripe secret, webhook secret or Resend API key as `NEXT_PUBLIC_*`.
5. Configure the Supabase Auth Site URL and redirect allowlist for the real Binso One app URL and `/passwort-zuruecksetzen`.
6. Provision the first Operator deliberately in `public.operator_users` after the authenticated user exists.
7. Verify the private Storage buckets and RLS policies created by the storage migration.
8. In Stripe, create recurring monthly Prices for Start, Business and Pro and copy their Price IDs to the corresponding environment variables.
9. Enable/configure the Stripe Customer Portal.
10. Configure the Stripe webhook endpoint:

```text
https://<your-app-host>/api/billing/webhook
```

Recommended events for the current handler:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

11. Add the Stripe webhook signing secret to `STRIPE_WEBHOOK_SECRET`.
12. Verify the sending domain in Resend and set `BINSO_EMAIL_FROM` to a verified sender.
13. In Operator → Monitoring, use the E-Mail Service test action to verify the configured Resend path.

When Supabase values are absent, the application remains in prototype/demo mode for UI review and CI without pretending persistence or authorization is active.

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
- Mutation endpoints use same-origin checks and bounded request bodies.
- Login and password recovery avoid account enumeration.
- Tenant IDs are resolved server-side.
- Tenant restrictions are enforced by RLS for core data and private Storage.
- Support remains available while a customer account is restricted.
- Internal support notes are excluded from customer RLS.
- Private files use tenant-prefixed paths, allowlisted MIME types, size limits and short-lived download URLs.
- Operator access is held in a dedicated authorization table and checked server-side.
- Critical Operator lifecycle changes are written to the Operator audit log.
- Stripe webhooks are signature-verified before any service-role database action.
- Stripe events are idempotently recorded before subscription state updates.
- Billing routes do not store full card details.
- External integration configuration state is not exposed publicly.
- Demo access is isolated from authenticated production data.

## CI

GitHub Actions runs:

- frozen-lockfile install
- ESLint with zero warnings
- TypeScript typecheck
- production build
- runtime route smoke tests
- `/api/health`
- auth and demo-state checks
- billing/integration authorization checks
- unsigned Stripe-webhook rejection
- security-header checks

Azure deployment performs a production application health check after deployment.
