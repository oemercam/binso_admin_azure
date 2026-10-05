# Binso One

Binso One is the app-first business platform by Binso GmbH for Swiss SMEs.

## Current release: v0.10 security hardening

The standalone demo still works without external services. With Supabase configured, the customer and Operator areas use tenant-isolated production persistence. Stripe is a production integration. Transactional email is handled exclusively through Microsoft Graph / Microsoft 365 and requires complete Graph configuration in production. No fallback email provider is configured.

### Production foundations

- Supabase email/password authentication through server API routes
- HttpOnly SameSite sessions with refresh-token handling
- password recovery and password reset
- protected customer and Operator routes
- tenant memberships and PostgreSQL Row Level Security
- account restrictions enforced at the database boundary
- private tenant-aware file storage
- customers and contacts
- products and services
- employees
- expenses and private receipt uploads
- customer-invoice payments
- time entries
- support tickets, replies, internal Operator notes and private attachments
- company and personal profile settings
- offers and invoices with atomic database create/update functions
- dashboard aggregates and global tenant search
- Operator dashboard, customers, tickets, account lifecycle, restrictions, announcements, monitoring and audit
- Stripe Checkout, Billing Portal and signed/idempotent webhook foundation
- Microsoft Graph / Microsoft 365 transactional-email integration and authorized Operator test email

### v0.10 security hardening

- composite tenant foreign keys prevent cross-tenant references even if another UUID is guessed
- distributed PostgreSQL-backed auth rate limiting for login, registration and password recovery
- rate-limit identifiers are stored only as SHA-256/HMAC fingerprints
- rate-limit policy is allowlisted and fixed in PostgreSQL so callers cannot raise their own limits
- standard `Retry-After` headers for throttled authentication requests
- refresh-token-only sessions may pass the route guard so the server can refresh them
- payment creation requires an idempotency key and PostgreSQL enforces one financial write per tenant/key
- payment retry uses the same browser-generated idempotency key
- Operator support replies/status changes have explicit RLS mutation policies
- active account state cannot be restored while a live restriction still exists
- restriction create/remove keeps account lifecycle state consistent
- private upload mutations require same-origin requests
- multipart uploads are rejected before parsing when the request is oversized
- upload purpose must match a real entity in the same tenant
- PNG, JPEG, WebP and PDF signatures are validated instead of trusting only MIME headers
- user-supplied SVG uploads are not accepted
- signup errors no longer expose provider-specific account-existence details
- mutation-route audit confirms same-origin checks across customer and Operator API writes

### Explicitly not marked complete

The following still require real provider configuration or final domain implementation:

- live Stripe account, products/prices, Portal settings and webhook secret
- Microsoft Graph application permissions and production sender mailbox verified
- final offer/invoice PDF generation and email attachment delivery
- standards-compliant Swiss QR bill generation
- bank synchronization
- secure Operator impersonation/support access
- verified cross-device session management and MFA enrollment
- full production translations for DE / FR / IT / EN / TR

Binso One does not invent payment cards, SaaS invoices, SLA values, device sessions or Operator identities when those data sources are not connected.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Supabase Auth
- PostgreSQL / PostgREST
- Supabase private Storage
- PostgreSQL RLS for tenant isolation
- Stripe Checkout / Billing Portal / signed webhook foundation
- Microsoft Graph / Microsoft 365 transactional-email foundation
- PWA manifest and conservative service-worker caching
- Azure App Service deployment through GitHub Actions

Customer-facing data requests use the authenticated user JWT and RLS. The Supabase service-role key is reserved for narrowly scoped trusted server operations such as verified Stripe webhooks and distributed public-auth rate limiting.

## Backend setup

Apply all files in `supabase/migrations` in filename order.

Local `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MARKETING_URL=https://www.binso.ch

# Generate a long random server-only value.
RATE_LIMIT_SECRET=<random-secret>

NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<server-only-service-role-key>

STRIPE_SECRET_KEY=<stripe-secret-key>
STRIPE_WEBHOOK_SECRET=<stripe-webhook-secret>
STRIPE_PRICE_START=<price-id>
STRIPE_PRICE_BUSINESS=<price-id>
STRIPE_PRICE_PRO=<price-id>

GRAPH_TENANT_ID=<microsoft-entra-tenant-id>
GRAPH_CLIENT_ID=<app-registration-client-id>
GRAPH_CLIENT_SECRET=<app-registration-client-secret>
GRAPH_SENDER_USER_ID=<sender-mailbox-user-id-or-address>
```

Do not expose `RATE_LIMIT_SECRET`, the Supabase service-role key, Stripe secrets or Microsoft Graph credentials through `NEXT_PUBLIC_*`.

For Stripe, configure monthly recurring Prices for Start, Business and Pro, enable the Customer Portal, and register:

```text
https://<your-app-host>/api/billing/webhook
```

Current billing webhook events:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

For Microsoft Graph, grant the application the required mail-sending permission, configure the sender mailbox, and use Operator → Monitoring to test the production sender path.

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

## Security posture

- centralized CSP and security headers
- private/no-store caching for authenticated-style routes and APIs
- same-origin enforcement on browser mutations
- bounded JSON and multipart request sizes
- account-enumeration-resistant login/recovery/signup errors
- distributed auth throttling through a service-role-only RPC
- server-side tenant resolution
- RLS plus composite tenant foreign keys
- private tenant-prefixed storage
- signature/MIME/size validation for user uploads
- support internal notes excluded from customer RLS
- dedicated server-checked Operator authorization
- Operator audit trail for critical actions
- idempotent payment writes
- signed Stripe webhooks and idempotent billing events
- no full card-data storage
- isolated demo state

## CI

GitHub Actions runs:

- frozen-lockfile install
- ESLint with zero warnings
- TypeScript typecheck
- production build
- runtime route smoke tests
- health/auth/demo checks
- billing/integration authorization checks
- unsigned Stripe-webhook rejection
- security-header checks

Azure deployment performs a production health check after deployment.
