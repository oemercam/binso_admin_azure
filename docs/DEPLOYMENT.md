# Deployment

Production workflow: `.github/workflows/main_binso-admin-prod.yml`.

- Trigger: push to `main` oder `workflow_dispatch`
- Runner: `ubuntu-24.04`
- Runtime: Node.js 24
- Package Manager: pnpm 10.17.1 mit committed `pnpm-lock.yaml`
- Install: `pnpm install --frozen-lockfile`
- Gates: Typecheck, ESLint, Architektur-, Action-, Prozess-, Mobile/PWA-, SaaS-, Auth-, Registration-, Subscription-, Stripe-, Plattform- und Go-live-Checks
- Build: Next.js Standalone
- Datenbank: Migrationen werden nach erfolgreichem Build und vor dem Deployment im GitHub Environment `production` ausgeführt
- Azure Login: OIDC via `azure/login@v3`
- Deployment: bestehender Azure App Service `binso-admin-prod`, Production Slot
- Concurrency: Production-Deployments werden serialisiert

## GitHub Environment `production`

Erforderlich ist `DATABASE_URL` als Secret. Der Wert wird nur für den Migration-Job verwendet und nicht in das Build-Artefakt geschrieben.

Für `.github/workflows/binso-one-lifecycle.yml` werden zusätzlich benötigt:

- Environment Variable `BINSO_ONE_BASE_URL`
- Environment Secret `BINSO_ONE_INTERNAL_JOB_SECRET`

Das Secret muss mit `INTERNAL_JOB_SECRET` in Azure App Service identisch sein.

## Azure App Service

Der App Service muss Node.js 24 verwenden. Der Azure-Ressourcenname `binso-admin-prod` bleibt aus Infrastrukturgründen bestehen; der Produktname ist Binso One.

Vor Go-live:

1. Produktionsvariablen aus `.env.example` in Azure setzen.
2. Entra/App-Service-Authentication konfigurieren.
3. Stripe Webhook und Live/Test Price-IDs setzen.
4. Graph-Mail für Organisationseinladungen konfigurieren; Push bleibt optional.
5. `pnpm db:migrate` ausführen bzw. den Migration-Job der Pipeline erfolgreich laufen lassen.
6. `pnpm production:preflight` mit Produktionsvariablen ausführen.
7. `pnpm verify` ausführen.
8. `/api/health` muss in Produktion HTTP 200 liefern.

Production darf niemals `AUTH_MODE=local` verwenden. Eine fehlende produktive PostgreSQL-Verbindung führt bewusst zu einem nicht-betriebsbereiten Health-Status.
