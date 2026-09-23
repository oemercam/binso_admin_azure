Binso Business Platform V54

V54 fixes the remaining React/ESLint validation findings from V53.

Fixed:
- onboarding no longer calls setState synchronously inside useEffect
- localStorage hydration is deferred through queueMicrotask with cancellation guard
- current organization/company profile/document templates/app settings are memoized
- BusinessStore useMemo dependencies are complete and stable
- platform regression checks cover these fixes

No UX changes:
- approved Mobile/PWA lists unchanged
- Dashboard and KPI layout unchanged
- Bottom Pill unchanged
- Platform Admin, Pricing, Registration and Onboarding layout unchanged

Run:
npm run typecheck
npm run lint
npm run architecture:check
npm run actions:check
npm run process:check
npm run mobile-ui:check
npm run saas:check
npm run saas:product-check
npm run platform:check
npm run build
V58 – Production Data Foundation
- Azure PostgreSQL/PostgreSQL server-only connection pool added.
- Versioned database migrations and db:migrate command added.
- Tenant transactions now bind app.organization_id and app.user_id for RLS.
- Authenticated tenant context resolves organization access via active memberships.
- Health endpoint reports database readiness without exposing credentials.
- New data-foundation:check is part of verify.


V59 – Authentication & Memberships
- Server-side authenticated user registry (`app_users`)
- PostgreSQL-backed organization onboarding with owner membership, trial subscription, entitlements, sequences and audit
- `/api/auth/session` and `/api/onboarding`
- Signup email is bound to the authenticated Microsoft identity
- `db:migrate` automatically loads `.env.local`
- Azure PostgreSQL SSL mode normalized to `verify-full`
- New migration `0002_auth_memberships.sql`
- New `auth-membership:check`

V60 – Registration & Onboarding
- Registration drafts are persisted in Azure PostgreSQL instead of localStorage.
- Authenticated Microsoft identity owns the registration and fixes the business email.
- Onboarding can be resumed after refresh/new session.
- Trial creation consumes a persisted signup transactionally and is idempotent.
- Returning users are routed through /post-login based on membership/onboarding state.
- BusinessStore receives authoritative organization/membership/subscription/entitlement bootstrap from PostgreSQL.
- Added migration 0003_registration_onboarding.sql and registration-onboarding:check.

V61: Subscription & Billing Foundation
- Plattformmandanten und Registrierungen werden im Platform Admin aus PostgreSQL geladen.
- Plan-/Statusänderungen sind serverseitig, auditiert und synchronisieren Entitlements/Limits.
- Billing-Lifecycle, Subscription-Events und Stripe-Webhook-Inbox sind vorbereitet.
- Inhaber können Planwechsel/Kündigung/Reaktivierung über die Billing-API anfordern.

V63 – Stripe Payment Provider
- Stripe Checkout for Starter, Business and Professional plans.
- Stripe Billing Portal for existing Stripe customers.
- Signed, idempotent webhook processing and PostgreSQL subscription synchronization.
- Stripe remains optional until server-side test/live keys and Price IDs are configured.
