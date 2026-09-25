# V75 Complete Production Foundation

V75 consolidates the remaining SaaS/operator/pilot/support/operations foundations into one release. The goal is a controlled production/pilot baseline without splitting Binso One into microservices or introducing a second product codebase.

## Implemented in code

### Production deployment and runtime

- GitHub Actions keeps push CI separate from an explicit Production deployment approval.
- Production deployment uses Azure App Service staging slot -> remote smoke -> slot swap -> Production health -> automatic rollback swap on failed Production health.
- Missing staging runtime settings are synchronized from Production without printing secret values; existing staging-specific values are preserved.
- `APP_BASE_URL` is configured as a slot-sticky staging value so a slot swap does not move the staging hostname into Production.
- Staging remote smoke waits for Azure warm-up and validates `/api/health`, `/` and `/pricing`.
- Healthy staging and Production releases are recorded in `platform_release_events`.
- Node.js 24 is explicit in build and deploy jobs.

### Database runtime separation and tenant security

- `DATABASE_URL` is the tenant/business runtime path.
- `PLATFORM_DATABASE_URL` is the explicit privileged operator/system data path.
- Separate PostgreSQL pools and transactions exist for tenant and platform paths.
- Production preflight rejects a tenant runtime role that is PostgreSQL superuser or has `BYPASSRLS` and warns about table ownership/RLS bypass risk.
- DB integration tests cover tenant A/B isolation plus RLS `WITH CHECK` writes for support, analytics and data-lifecycle records.
- PostgreSQL-backed distributed rate-limit buckets protect public/high-abuse routes across multiple App Service instances.

### Operator authentication and roles

- Entra/App Service Authentication remains the identity/eligibility boundary.
- Only official `@binso.ch` identities may become platform operators.
- Functional roles are stored independently in `platform_operator_assignments`.
- Supported roles: Platform Owner, Platform Admin, Platform Support, Platform Billing, Platform Auditor.
- `PLATFORM_ROLE_SOURCE=database` allows functional roles to come entirely from Binso One after Entra authentication; `hybrid` supports migration.
- One-time `pnpm platform:bootstrap-operator` command safely bootstraps the first DB-managed operator using `PLATFORM_DATABASE_URL`.
- All operator assignment changes are audited.

### Operator portal

- Customer list and detailed customer view with users, subscription data/history, support, usage, audit and private Binso notes.
- Subscription/registration views.
- Leads workflow.
- Pilot workflow.
- Support and feedback queue.
- Product/commercial analytics.
- Operations, jobs, mail and monitoring views.
- Incidents.
- Release history.
- Data lifecycle queue.
- Audit.
- Operator assignments.
- Feature/platform settings.
- Help Center management.

### Support and feedback

- One case/conversation model for `support`, `feedback`, `feature_request`, `billing`.
- Priority, assignment, first response timestamp, resolution timestamp and merge target.
- Customer-visible and internal-only messages.
- Pilot classifications: blocker, friction, request.
- Operator updates are audited.

### Pilot and leads

- Pilot goal, group, end date, status and outcome.
- Pilot lifecycle states include active/review/extended/completed/converted/not converted.
- Milestones measure onboarding and first productive actions.
- Public leads support new/contacted/qualified/pilot/converted/closed and internal notes.
- Leads can be associated with an eventual organization.

### Help Center

- Categories, articles, search and article feedback.
- Public `/help` and article pages.
- Operator Help Center page for creating/editing/publishing articles.
- Helpful/not-helpful counters are visible to operators.
- Help content is deliberately separate from support cases; users can escalate to Support when content is insufficient.

### Product analytics

- Privacy-conscious product events with an allow-list rather than arbitrary click tracking.
- Organization milestones for onboarding, customer, quote, order, time, invoice and payment.
- Operator analytics exclude demo organizations.
- MRR, active/trial/pilot counts, churn/conversion and milestone adoption are available as operational views.

### Billing and subscription operations

- Existing Stripe Checkout, Billing Portal and signed webhooks remain the payment path.
- Scheduled lifecycle job continues trial/payment/access-state transitions.
- Billing reconciliation runs periodically and records durable reconciliation history.
- Webhook events have retry/dead-letter timestamps for operational recovery.
- Operator billing data is retrieved through the platform DB path.

### Data lifecycle

- Customer-facing export/cancel/delete requests are explicit workflow records instead of destructive immediate actions.
- Operator queue supports requested -> approved -> processing -> completed/rejected/cancelled.
- Requests are tenant-scoped with RLS and auditable operator handling.

### Incidents, monitoring and releases

- Health endpoints remain available for liveness/readiness/platform health.
- Incidents carry severity, status, public message and private internal detail.
- Release events record build, environment, commit and health state.
- Status page can derive current public incident information from stored incident data.

### Demo environment

- Demo seed/reset remain blocked in Production and require explicit opt-in.
- Demo organization is marked `is_demo=true` and excluded from commercial analytics.
- Demo seed includes coherent milestone data for product/pilot demonstrations.

## Production configuration still required outside code

These items cannot be truthfully completed by source code alone and must be verified in Azure/GitHub/Entra:

1. `admin.binso.ch` DNS/custom-domain binding and TLS.
2. Entra single-tenant operator authentication plus MFA/Conditional Access.
3. A dedicated restricted PostgreSQL login for `DATABASE_URL` and a distinct privileged platform login for `PLATFORM_DATABASE_URL`.
4. Set `PLATFORM_ROLE_SOURCE=database` only after at least one active operator assignment is bootstrapped.
5. PostgreSQL PITR retention target (35 days), redundancy choice and an isolated restore drill.
6. Azure Monitor/Application Insights alerts for availability, 5xx, latency, DB, lifecycle, mail, webhook and deployment failures.
7. Stripe live keys/prices/webhook endpoint and Microsoft Graph production credentials.
8. Staging-specific external service credentials when staging must not call Production third-party systems.

## First database-managed operator

Use an explicit privileged platform connection and disable the bootstrap flag immediately afterwards:

```powershell
$env:ALLOW_PLATFORM_OPERATOR_BOOTSTRAP="true"
$env:PLATFORM_BOOTSTRAP_USER_ID="<entra-object-id>"
$env:PLATFORM_BOOTSTRAP_EMAIL="name@binso.ch"
$env:PLATFORM_BOOTSTRAP_ROLE="platform_owner"
pnpm platform:bootstrap-operator
$env:ALLOW_PLATFORM_OPERATOR_BOOTSTRAP="false"
```

Then configure `PLATFORM_ROLE_SOURCE=database` in Production.

## Validation

```powershell
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm run v74:check
pnpm run v75:check
pnpm run test:integration:db
pnpm build
pnpm test:e2e
pnpm production:preflight
```

The isolated DB integration test must use the local `binso_v69_test` database. `production:preflight` is intentionally a separate Production-environment check.

## Controlled launch recommendation

V75 is designed for Pilot / Controlled Launch. General Availability should follow only after the external configuration list above is verified, a restore drill has been completed, the restricted tenant runtime DB role is live, and the first real customer workflows have passed acceptance in Production.
