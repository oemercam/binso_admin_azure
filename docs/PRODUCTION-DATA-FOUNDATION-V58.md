# V58 – Production Data Foundation

V58 introduces the production persistence boundary for the Binso Business Platform without replacing the stable client UI in one risky migration.

## Added

- Server-only PostgreSQL connection pool (`lib/db/client.ts`).
- Transaction helper and tenant-bound PostgreSQL RLS context (`lib/db/tenant.ts`).
- Membership repository that resolves organization access from the authenticated user, never from request data alone.
- Organization repository prepared for tenant-scoped server APIs.
- Versioned SQL migrations in `database/migrations` with `schema_migrations` tracking.
- `npm run db:migrate` for controlled database deployment.
- `npm run data-foundation:check` as an architecture invariant.
- Database-aware `/api/health` check.
- Azure/PostgreSQL environment configuration in `.env.example`.

## Security contract

Normal application database work must execute with a verified membership and a transaction-local `app.organization_id` and `app.user_id`. The database RLS policies in the baseline migration enforce the same organization boundary independently of UI filtering.

The browser business store remains as a compatibility layer in V58. It is intentionally not treated as the production source of truth. Subsequent versions migrate feature slices to server repositories/API routes incrementally so existing quote, order, invoice, time and mobile flows stay testable during the transition.

## Deployment

1. Provision Azure Database for PostgreSQL.
2. Configure `DATABASE_URL`, `DATABASE_SSL=true` and an appropriate `DATABASE_POOL_MAX` in the application environment.
3. Install dependencies.
4. Run `npm run db:migrate` once from the deployment/migration job.
5. Run `npm run verify`.

Never expose `DATABASE_URL` through a `NEXT_PUBLIC_*` variable.
