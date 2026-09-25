# Binso One – Go-live V68

Stand: 23.09.2026

Dieses Release baut auf dem validierten Produktionsstand `5debdfa` auf und schliesst die wichtigsten Betriebs- und Lifecycle-Lücken für einen echten SaaS-Go-live.

## Neu in V68

- Abgelaufene Trials führen nicht mehr in eine Sackgasse. Geschäftsdaten bleiben gesperrt, aber ein aktiver Organisations-Owner kann über `/subscription-required` weiterhin einen kostenpflichtigen Plan aktivieren.
- Billing-Endpunkte verwenden für Abrechnungsaktionen eine aktive Membership als Identität, nicht den bereits freigeschalteten Produktzugriff. Tenant-Daten bleiben weiterhin über `resolveTenantContext` geschützt.
- Neuer Trial-Lifecycle mit Status `expired` und Migration `0007_subscription_lifecycle.sql`.
- Sicherer interner Lifecycle-Endpunkt `/api/internal/lifecycle`, geschützt mit `INTERNAL_JOB_SECRET`.
- GitHub Actions führt den Lifecycle stündlich aus. Dafür werden `BINSO_ONE_BASE_URL` als Environment Variable und `BINSO_ONE_INTERNAL_JOB_SECRET` als Environment Secret benötigt.
- Produktionsmigrationen laufen in der Deployment-Pipeline vor dem Azure-Deployment. `DATABASE_URL` muss als GitHub Environment Secret `production` vorhanden sein.
- Neuer `pnpm production:preflight` prüft Produktionsvariablen, HTTPS, Stripe, internen Job, optionale Push-Verschlüsselung und den Stand der Datenbankmigrationen.
- `/api/health` liefert in Produktion HTTP 503, wenn PostgreSQL oder die Migrationstabelle nicht betriebsbereit ist.
- Organisationseinladungen können über Microsoft Graph als echte E-Mail versendet werden. Der Versand wird über `EMAIL_DELIVERY_MODE=graph` aktiviert.
- Neuer `pnpm go-live:check` schützt die neuen Go-live-Invarianten in CI und `pnpm verify`.

## GitHub Production Environment

Im GitHub Repository muss das Environment `production` mindestens enthalten:

### Secrets

- `DATABASE_URL`: produktive PostgreSQL-Verbindung für Migrationen.
- `BINSO_ONE_INTERNAL_JOB_SECRET`: identisch mit `INTERNAL_JOB_SECRET` in Azure App Service.
- bestehende Azure OIDC-Secrets für das App-Service-Deployment.

### Variables

- `BINSO_ONE_BASE_URL`: öffentliche HTTPS-Basis-URL, z. B. `https://one.binso.ch`.

## Azure App Service Settings

Mindestens:

- `AUTH_MODE=azure`
- `AUTH_PROVIDER_NAME=<Easy-Auth/External-ID-Provider>`
- `APP_BASE_URL=https://<produktive-domain>`
- `DATABASE_URL=<server-side secret>`
- `DATABASE_SSL=true`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_STARTER`
- `STRIPE_PRICE_BUSINESS`
- `STRIPE_PRICE_PROFESSIONAL`
- optional `STRIPE_PRICE_ENTERPRISE`
- `INTERNAL_JOB_SECRET=<langes zufälliges Secret>`
- optional Push: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` und `PUSH_SUBSCRIPTION_ENCRYPTION_KEY`
- für Einladungsmails: `EMAIL_DELIVERY_MODE=graph`, `GRAPH_TENANT_ID`, `GRAPH_CLIENT_ID`, `GRAPH_CLIENT_SECRET`, `GRAPH_SENDER_USER_ID` (für `production:preflight` erforderlich)

`GRAPH_CLIENT_SECRET`, Stripe-Secrets, Datenbankpasswort und interne Job-Secrets dürfen nie als `NEXT_PUBLIC_*` gesetzt werden.

## Microsoft Graph Mail

Die verwendete Entra-App benötigt für serverseitigen Versand die passende Microsoft-Graph-Anwendungsberechtigung für `Mail.Send` mit Admin Consent. `GRAPH_SENDER_USER_ID` verweist auf das Absenderpostfach. Binso One speichert keine Mail-Passwörter.

## Stripe

Vor Live-Schaltung:

1. Test-Mode mit Starter, Business und Professional vollständig durchspielen.
2. Webhook auf `/api/billing/webhook` konfigurieren.
3. Mindestens Subscription created/updated/deleted sowie relevante Invoice-Events an den Webhook senden.
4. Danach Live-Keys und Live-Price-IDs in Azure setzen.
5. `pnpm production:preflight` mit produktiven Variablen ausführen.

## End-to-End-Abnahme

Vor externen Kunden müssen mindestens folgende Flows real getestet werden:

1. neues Konto → Registrierung → Trial → Dashboard;
2. Trial-Ablauf → Produktzugriff gesperrt → Owner erreicht Billing Recovery;
3. Stripe Checkout → Webhook → Organisation wieder aktiv;
4. Owner lädt Benutzer ein → Graph-Mail → Login mit derselben E-Mail → Membership wird übernommen;
5. Rollen Owner/Admin/Finance/Employee gegen direkte URL-Aufrufe prüfen;
6. Angebot → Auftrag → Zeit → Rechnung → Zahlung/Gutschrift;
7. zweiter Tenant kann keine Daten des ersten Tenants lesen oder ändern;
8. Betreiberbereich zeigt Tenant, Status und Health korrekt;
9. `pnpm verify`, `pnpm production:preflight` und `/api/health` sind grün.

## Bewusste externe Abhängigkeiten

Code kann Azure-, Entra-, Stripe-, PostgreSQL- und Graph-Konfiguration vorbereiten und validieren, aber Secrets, App Registrations, Stripe-Produkte/Price-IDs, DNS und Azure-Ressourcen müssen im jeweiligen Betreiberkonto erstellt bzw. gesetzt werden.
