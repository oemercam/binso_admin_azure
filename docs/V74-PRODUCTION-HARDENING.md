# V74 Production Hardening

## Implemented in code

- Unified support/feedback case model (`support`, `feedback`, `feature_request`, `billing`).
- Pilot/demo organisation metadata and operator Pilot overview.
- Race-safe support case numbering using a PostgreSQL sequence.
- Explicit RLS `WITH CHECK` policies for support cases/messages and notifications.
- Demo tenant seed/reset with production guards.
- Digital-first public contact form stored as lightweight leads with rate limiting.
- Public SEO foundation: metadata base, canonicals, Open Graph/Twitter metadata, `robots.txt`, `sitemap.xml` and page metadata.
- Production `/platform` host boundary using `BINSO_OPERATOR_HOST` (default `admin.binso.ch`).
- Azure deployment flow changed to Staging Slot -> smoke -> slot swap -> Production health -> automatic swap rollback on failed health.

## External configuration still required

### Azure App Service

1. Create a `staging` deployment slot (or configure GitHub variable `BINSO_ONE_STAGING_SLOT`).
2. Configure GitHub variable `BINSO_ONE_STAGING_URL` with the staging slot URL.
3. Bind `admin.binso.ch` to the App Service and set `BINSO_OPERATOR_HOST=admin.binso.ch`.
4. Keep Entra App Service Authentication single-tenant and enforce MFA/Conditional Access for Binso operators.

### PostgreSQL runtime role

The repository now validates RLS write checks, but the current code still uses a common `DATABASE_URL` for tenant and platform repository work. Do **not** switch to a restricted non-owner runtime role until platform/operator cross-tenant queries are moved to an explicit privileged data-access path. Production must meanwhile be reviewed to ensure the configured login does not unintentionally bypass RLS. This remains a P0 infrastructure/architecture item, not something that can be safely faked in a migration.

### Backup and monitoring

Verify in Azure Portal:

- PostgreSQL PITR retention target: 35 days.
- Backup redundancy and restore procedure.
- Application Insights / Azure Monitor.
- Availability, 5xx, latency, DB, job, mail and webhook alerts.
- Perform and document an isolated restore drill.

## Demo tenant

See `docs/demo-environment.md`.
