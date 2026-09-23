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
