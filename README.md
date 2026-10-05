# Binso One

Binso One ist die app-first Business-Plattform der Binso GmbH für Schweizer KMU.

## Produktionsarchitektur

- Next.js 16 App Router
- React 19 / TypeScript
- Azure App Service
- Azure Database for PostgreSQL
- serverseitige, datenbankgestützte Sessions
- E-Mail + Passwort, E-Mail-Verifikation, Login-OTP und TOTP/Recovery Codes
- Microsoft Entra ID für interne Binso-Operatoren
- Microsoft Graph / Microsoft 365 als einziger produktiver E-Mail-Pfad
- Stripe Checkout, Billing Portal und signierte/idempotente Webhooks
- PostgreSQL Row Level Security und serverseitiger Tenant-Kontext
- private Dateiablage in PostgreSQL; Azure Blob Storage kann serverseitig über Managed Identity oder SAS angebunden werden
- PWA mit restriktivem Service-Worker-Caching
- GitHub Actions mit Azure OIDC Deployment

Es gibt keinen Fallback auf einen zweiten E-Mail-Provider.

## Sicherheitsmodell

### Kunden
- Registrierung mit E-Mail und Passwort
- sechsstellige E-Mail-Verifikation vor produktivem Session-Zugriff
- zusätzlicher Login-Faktor
- TOTP mit einmaligen Recovery Codes
- Owner, Admin und Finance müssen Authenticator MFA verwenden
- HttpOnly/Secure/SameSite Session-Cookies
- serverseitige Rollen- und Tenant-Prüfung
- PostgreSQL-RLS und zusammengesetzte Tenant-Fremdschlüssel
- Rate Limits für öffentliche Auth-Endpunkte
- OTPs, Recovery Codes und Sessiontokens werden nur gehasht bzw. geschützt gespeichert

### Interne Binso-Administration
- Microsoft Entra ID / Azure App Service Authentication
- App-Rollen werden auf das interne Plattform-RBAC gemappt
- lokale produktive Operator-Passwörter sind deaktiviert
- Operator-Sessions werden gegen die aktuelle Entra-Identität und Rolle geprüft
- Microsoft Authenticator / Conditional Access werden durch Entra gesteuert

### E-Mail
Produktive Transaktionsmails laufen ausschliesslich über Microsoft Graph.

Erforderlich:
- `GRAPH_TENANT_ID`
- `GRAPH_CLIENT_ID`
- `GRAPH_CLIENT_SECRET`
- `GRAPH_SENDER_USER_ID`

Der aktuelle Produktionssender ist `one@binso.ch`.

Für den finalen Least-Privilege-Schritt siehe:
`docs/graph-mail-least-privilege.md`

## Datenbank

Migrationen liegen unter:

```text
database/migrations/
```

Sie werden im Azure-Deployment vor dem App-Deploy ausgeführt:

```bash
pnpm db:migrate
pnpm db:check
```

Der Deploy bricht ab, wenn Migration oder Datenbankprüfung fehlschlagen.

## Stripe

Produktive Abonnements verwenden ausschliesslich Stripe-Live-Konfiguration.

Erforderlich:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_START_MONTHLY`
- `STRIPE_PRICE_START_YEARLY`
- `STRIPE_PRICE_BUSINESS_MONTHLY`
- `STRIPE_PRICE_BUSINESS_YEARLY`
- `STRIPE_PRICE_PRO_MONTHLY`
- `STRIPE_PRICE_PRO_YEARLY`

Der Workflow **Stripe Billing Configuration** prüft unter anderem:
- Live-Key
- freigeschaltetes Konto
- sechs aktive CHF-Recurring-Prices
- produktiven Webhook
- notwendige Webhook-Events
- aktives Live-Customer-Portal

Der Audit erzeugt keine Zahlung.

Details:
`docs/stripe-billing-setup.md`

## Retention und Kundendaten-Lifecycle

Automatische Bereinigung:
- E-Mail-/Auth-Artefakte: standardmässig 7 Tage nach Verbrauch/Ablauf
- abgelaufene Sessions: standardmässig 30 Tage
- abgelaufene MFA-Enrollment-Secrets: werden bereinigt

Die Bereinigung läuft täglich und zusätzlich beim produktiven Deployment.

Kontrollierter Export und endgültige Löschung:

```bash
pnpm data:export
pnpm data:delete
```

Die Löschung ist fail-closed und benötigt:
- archivierte Organisation
- bestätigten Export
- exakte Organisations-ID als zweite Bestätigung
- keinen aktiven/Trial-Billingstatus
- bestätigte Bereinigung allfälliger externer Azure-Blobs

Details:
`docs/customer-data-lifecycle.md`

## Health und Readiness

Liveness:

```text
/api/health
```

Production Readiness:

```text
/api/health/ready
```

Der Readiness-Endpunkt prüft:
- PostgreSQL
- App-Verschlüsselung
- Microsoft-Graph-Konfiguration
- Stripe-Konfigurationsvollständigkeit

In Produktion werden keine Secret-Details ausgegeben.

## GitHub Actions

Wichtige Workflows:

- **Quality**
  - Release Gates
  - Tests
  - ESLint
  - Dependency Security Audit
  - CSS Architecture
  - TypeScript
  - Production Build
  - Runtime Smoke Tests

- **Deploy Azure App Service**
  - Datenbankmigration
  - Datenbankprüfung
  - Retention Cleanup
  - Standalone Artifact
  - Azure OIDC Login
  - Microsoft-Graph-Konfigurationsprüfung
  - App-Service-Deploy
  - Worker-Konvergenz
  - Health-/Readiness-Prüfung
  - Produktions-Smoke-Tests

- **Microsoft Graph Mail Readiness**
  - Client-Credentials-Prüfung
  - echter Graph-`sendMail`-Selbsttest

- **Stripe Billing Configuration**
  - Live-Billing-Konfiguration ohne Zahlung

- **Retention Maintenance**
  - tägliche Auth-/Session-Bereinigung

- **Azure Architecture Audit**
  - App Service, Entra, PostgreSQL, Storage und Monitoring-Inventar

- **Production Monitoring Readiness**
  - Application Insights
  - Action Group
  - mindestens eine aktive Alert-Regel

- **PostgreSQL Backup Readiness**
  - Serverzustand
  - konfigurierte Backup-Retention

## Lokale Entwicklung

Die aktuelle Beispielkonfiguration steht in `.env.example`.

Minimal:

```env
APP_MODE=local
APP_URL=http://localhost:3000
DATABASE_URL=
APP_ENCRYPTION_KEY=

GRAPH_TENANT_ID=
GRAPH_CLIENT_ID=
GRAPH_CLIENT_SECRET=
GRAPH_SENDER_USER_ID=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

Keine Secrets mit `NEXT_PUBLIC_` veröffentlichen.

QA:

```powershell
corepack enable
corepack prepare pnpm@10.0.0 --activate
pnpm install --frozen-lockfile
pnpm release:check
pnpm test
pnpm lint
pnpm security:scan
pnpm css:check
pnpm typecheck
pnpm build
```

## Go-live

Der verbindliche aktuelle Stand steht in:

`docs/production-launch-checklist.md`

Dokumentierte Betriebsverfahren:
- `docs/production-rollback.md`
- `docs/azure-postgresql-backup-restore.md`
- `docs/customer-data-lifecycle.md`
- `docs/incident-response-and-retention.md`
- `docs/graph-mail-least-privilege.md`

Domain-/Custom-Hostname-Konfiguration wird separat durchgeführt und ist nicht Bestandteil dieses Readiness-Blocks.
