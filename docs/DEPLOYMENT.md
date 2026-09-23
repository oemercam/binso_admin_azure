# Deployment

Production workflow: `.github/workflows/main_binso-admin-prod.yml`.

- Trigger: push to `main` or manual `workflow_dispatch`
- Runner: `ubuntu-24.04`
- Application runtime: Node.js 24
- Package manager: pnpm 10.17.1 with committed `pnpm-lock.yaml`
- Install: deterministic `pnpm install --frozen-lockfile`
- Gates: typecheck, ESLint, architecture, action, process, Mobile/PWA, SaaS, authentication, registration/onboarding, subscription, Stripe and platform checks, followed by the production build
- Artifact: Next.js standalone output only
- Azure authentication: OIDC via `azure/login@v3` with repository `id-token: write`
- Deployment: existing Azure App Service `binso-admin-prod`, Production slot
- Concurrency: production deploys are serialized and an active deployment is not cancelled

The Azure App Service runtime must be configured for Node.js 24. The existing Azure resource name is intentionally retained; the product presented to users is Binso One.

Before deployment, configure the production secrets documented in `.env.example`, run database migrations and execute `pnpm verify` on Node.js 24. Production must not use `AUTH_MODE=local` and must have `DATABASE_URL` configured.
