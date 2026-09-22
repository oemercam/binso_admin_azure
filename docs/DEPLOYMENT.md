# Deployment

Production workflow: `.github/workflows/main_binso-admin-prod.yml`.

- Trigger: push to `main` or manual `workflow_dispatch`
- Runner: `ubuntu-24.04` (pinned intentionally until Ubuntu 26.04 is validated)
- Application Node version: 24, sourced from `package.json#engines`
- Install: deterministic `npm ci` with committed `package-lock.json`
- Gates: typecheck, ESLint, architecture guardrails, production build
- Artifact: Next.js standalone output only
- Azure authentication: OIDC via `azure/login@v3` with repository `id-token: write`
- Deployment: Azure App Service `binso-admin-prod`, Production slot
- Concurrency: production deploys are serialized and an active deployment is not cancelled

The Azure App Service runtime must also be configured for a Node 24-compatible runtime. This is an Azure resource setting and is intentionally not mutated implicitly by the repository workflow.

Before moving the production runner to Ubuntu 26.04, validate `npm ci`, typecheck, lint, architecture checks and build on that runner in a non-deploying compatibility job or controlled test.
