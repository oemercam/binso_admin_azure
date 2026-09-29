# GitHub → Azure Deployment

## GitHub Repository
Nach lokal grünem Build wird das vollständige Projekt inklusive `pnpm-lock.yaml` nach GitHub gepusht.

Benötigte GitHub Secrets:

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`

Benötigte GitHub Environment/Repository Variables:

- `AZURE_WEBAPP_NAME`
- `AZURE_WEBAPP_URL`

Die Action verwendet OIDC (`azure/login@v2`) und kein Publish Profile.

## Azure App Service Settings
Mindestens:

```text
NODE_ENV=production
APP_MODE=production
NEXT_PUBLIC_APP_MODE=production
APP_URL=https://www.binso.ch
NEXT_PUBLIC_SITE_URL=https://www.binso.ch
DATABASE_URL=<runtime database connection>
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=true
APP_ENCRYPTION_KEY=<secret>
AZURE_STORAGE_ACCOUNT=<account>
AZURE_STORAGE_CONTAINER=documents
APPLICATIONINSIGHTS_CONNECTION_STRING=<connection string>
```

Je nach aktivierten Funktionen zusätzlich Stripe/Resend-Werte aus `.env.example`.

## PostgreSQL Reihenfolge

1. Admin-Verbindung auf die neue Datenbank herstellen.
2. `pnpm db:migrate` ausführen.
3. Runtime-Rolle über `database/bootstrap/app-role.sql` erstellen/anpassen.
4. `DATABASE_URL` der Web App auf diese Runtime-Rolle setzen.
5. `pnpm tenant:test` gegen eine sichere Test-/Staging-Datenbank ausführen.

## Erster Betreiber

```bash
OPERATOR_BOOTSTRAP_EMAIL=...
OPERATOR_BOOTSTRAP_PASSWORD=...
pnpm operator:bootstrap
```

Danach sofort im Betreiberkonto MFA aktivieren.

## Custom Domain

- `www.binso.ch` und gewünschte Apex-Weiterleitung in Azure/DNS konfigurieren.
- Managed Certificate bzw. bestehendes Zertifikat binden.
- HTTPS only bleibt aktiviert.

## Stripe

- Production Price IDs eintragen.
- Webhook Endpoint: `https://www.binso.ch/api/webhooks/stripe`
- Webhook Signing Secret setzen.
- Checkout, Portal, Kündigung, Payment Failure und Subscription Delete in Stripe Test Mode vollständig durchspielen, bevor Live Keys gesetzt werden.

## E-Mail

- Resend Domain `binso.ch` verifizieren.
- SPF/DKIM/DMARC kontrollieren.
- `EMAIL_FROM` auf eine verifizierte Absenderadresse setzen.
- Verifikation, Passwort-Reset, Einladung und Supportkommunikation testen.

## Release
GitHub Actions erstellt ein Next.js Standalone Artifact und deployt es nach erfolgreichem Release Check, Tests, Lint, Typecheck, Audit und Build. Anschliessend wird optional `/api/health` geprüft.
