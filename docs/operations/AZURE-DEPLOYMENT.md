# Azure Deployment – Binso One

## Zielarchitektur
- Azure App Service Linux
- Azure Database for PostgreSQL Flexible Server
- Azure Blob Storage
- VNet Integration / private PostgreSQL Verbindung
- Managed Identity
- Application Insights / Log Analytics
- GitHub Actions OIDC

## Reihenfolge
1. Resource Group erstellen.
2. `infra/main.bicep` deployen.
3. Azure Web App Name aus Output übernehmen.
4. zusätzliche App Settings / Secrets konfigurieren:
   - `APP_ENCRYPTION_KEY`
   - `RESEND_API_KEY`
   - `EMAIL_FROM`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - sechs Stripe Price IDs
   - `STRIPE_PORTAL_RETURN_URL`
5. Datenbankmigrationen ausführen.
6. Plattform-Inhaber bootstrap.
7. GitHub OIDC konfigurieren.
8. GitHub Environment `production` mit erforderlichen Secrets/Vars konfigurieren.
9. Workflow ausführen.
10. `/api/health` prüfen.
11. E2E Smoke Test.

## GitHub Secrets
- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`

## GitHub Variable
- `AZURE_WEBAPP_NAME`

## Nach Deployment
- Custom Domain / TLS prüfen
- App Settings prüfen
- Health Check grün
- Application Insights Logs
- Stripe Webhook Endpoint
- E-Mail-Domain
- DB-Migration / Tenant-Test
