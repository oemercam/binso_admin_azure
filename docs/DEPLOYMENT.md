# Deployment

Production workflow: `.github/workflows/main_binso-admin-prod.yml`.

- Trigger: push to `main` or manual `workflow_dispatch`
- Runner: `ubuntu-24.04`
- Application Node version: 24, sourced from `package.json#engines`
- Install: deterministic `npm ci` using the committed `package-lock.json`
- Gates: typecheck, ESLint, architecture guardrails, core regression tests and production build
- Artifact: Next.js standalone deployment output
- Azure authentication: OIDC via `azure/login@v3` with repository `id-token: write`
- Deployment: Azure App Service `binso-admin-prod`, Production slot
- Concurrency: production deploys are serialized and an active deployment is not cancelled

The Azure App Service runtime must be configured for a Node 24-compatible runtime. This resource setting is intentionally not mutated implicitly by the repository workflow.

## Production data readiness

The current UI/reference build still persists business state through a versioned browser store. `database/schema.sql` is the PostgreSQL target schema, not proof that the current UI mutations are server-persisted. Before the application is used as a true multi-user production system, move business reads/writes and authorization into the production server/database layer and run migration/integration tests against Azure PostgreSQL.

The push-subscription API currently contains the authenticated server contract but intentionally returns `push_not_configured` for subscription creation until durable server-side storage is connected. It must not acknowledge an unpersisted subscription as stored. Do not treat push delivery as production-ready until subscription persistence and delivery infrastructure are connected.

Microsoft Graph mail delivery and durable binary evidence storage are also external production integrations. The current UI records dispatch/evidence metadata honestly but must not be considered proof of actual e-mail delivery or uploaded file persistence.

## Release validation

A production release should pass from a clean checkout:

```bash
npm ci
npm run typecheck
npm run lint
npm run architecture:check
npm run test:core
npm run build
```

After deployment, smoke-test authentication, dashboard, core business routes, document assets, PWA installation/update behaviour, API health and mobile/PWA overlay scrolling. Verify that a waiting PWA update only reloads after the user selects **Jetzt aktualisieren**.

Before moving the production runner to a newer Ubuntu image, validate all gates in a non-deploying compatibility job or controlled test first.
