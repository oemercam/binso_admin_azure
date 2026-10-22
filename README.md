# Binso One

Aktueller Einstieg: [Lieferstand, Konzeptablage und GitHub-Abhängigkeiten](docs/architecture/delivery-status.md).
Dieser Bericht bewahrt datierte Nachweise; den aktuellen Head und CI im verlinkten PR prüfen.

Binso One ist die app-first Business-Plattform der Binso GmbH für Schweizer KMU.

## Projektorientierung für Entwicklungsaufträge

Verbindlicher Arbeitsablauf: [AGENTS.md](AGENTS.md). Diese Orientierung ist ein
Wegweiser; historische Berichte ersetzen weder aktuelle Regeln noch aktuelle
Prüfergebnisse. Nur die für den konkreten Auftrag relevanten Quellen lesen.

| Gesucht | Einstieg |
| --- | --- |
| V26 Revision3, lokale Umsetzung ohne Push | [Tatsächlicher Paketstand und Prüfgrenzen](docs/architecture/v26-execution.md), [Modul-/Übergabeverträge](docs/architecture/v26-module-contracts.md), [Gap-Matrix und Pakete](docs/architecture/v26-gap-and-packages.md) |
| Freigegebene UX und Rangfolge | [Originalreferenzen](docs/audit/v24/reference/IMPLEMENTIERUNG.md), [Vorschau](docs/audit/v24/reference/index.html) |
| UI-Architektur und Komponenten-Owner | [Reference Foundation](docs/architecture/reference-foundation.md), `app/design-system/manifest.json` |
| Laufzeit, Sicherheit und Daten | Architektur-/Sicherheitsübersicht unten; `app/`, `lib/server/`, `database/migrations/` gezielt nach betroffener Funktion |
| Aktuelle Projektregeln | [AGENTS.md](AGENTS.md), `package.json`, `pnpm-workspace.yaml`; Windows-Runtime: Workspace-`../runtime.ps1` und `../AGENTS.md` |
| QA-Auswahl und Ausführung | `scripts/qa-plan.mjs`, `scripts/qa.mjs`, `package.json`; Pflicht-Gates: `.github/workflows/quality.yml` |
| Gemeinsame App-Abnahme für Kunden und One Admin | [Prüfprotokoll, Rollen, Geräte und offene Nachweise](docs/architecture/app-acceptance.md), [vollständige Routen-/Unteransichtsmatrix](docs/architecture/app-acceptance-routes.md) |
| V25.4 Public Trial, Tarife, Modulprofile und Nachweisgrenzen | [Umsetzung und Freigaben](docs/architecture/v25-4-ux-marketing-app-ready.md), [124 BP-/UX-Fälle](docs/architecture/v25-4-acceptance-tracking.csv) |
| Aktuelle Revision 7, 56 Kapitel/P0–P2 | [Umsetzung und vollständiges Abnahmeregister](docs/architecture/v25-revision7.md) |
| Historischer V25-Master vom 21.10.2026 | [Aktuelle Umsetzung, Migrationen und Abnahmegrenzen](docs/architecture/v25-complete-master-20261021.md) |
| V25.5 Lifecycle und Sicherheitsgrenzen | [Ist/Delta und abhängige Basis](docs/architecture/v25-5-platform-lifecycle.md), [aktives Register aller 390 PL/BP/UX/Gate-IDs](docs/architecture/v25-5-traceability.csv) |
| Aktuelle technische Foundation-Korrekturen und verbleibende Abnahmegrenzen | [Foundation-Status](docs/architecture/foundation-status.md); historische V21/V22-Inventare sind keine aktuellen Produktregeln |
| Systemaudit-Korrekturen: Auth, Benachrichtigungen, Uploads und historische Berechtigungspfade | [Umsetzung, Migrationen und offene Sicherheits-/Gerätenachweise](docs/architecture/system-audit-corrections.md) |
| Historische Nachweise | `docs/audit/`, `docs/assets/`, `docs/evidence/`, datierte Inventare unter `docs/architecture/`; [V24-Bericht](docs/audit/v24/README.md) und [älterer QA-Audit](docs/ux-audit-fast-development.md) nur bei Bedarf |

Kurze QA-Auswahl (aus dem Repository, nach Runtime-Aktivierung):

```powershell
pnpm qa:plan --files components/records.tsx  # nur Auswahl anzeigen
pnpm qa:fast --files components/records.tsx  # passende lokale Tests/Lint
pnpm typecheck                             # relevante TypeScript-Änderungen
# Gezielt, wenn die Änderung Browsernachweise braucht:
pnpm qa:fast --browser --files components/records.tsx
# Breite Integration/Release-Abnahme, nicht nach jeder Einzeländerung:
pnpm qa:standard --base origin/main
pnpm qa:full --base origin/main
```

Die Dateipfade sind Beispiele und durch den vollständigen betroffenen Umfang zu
ersetzen. `origin/main` nur als bereits vorhandene, vereinbarte Basis verwenden.
Genaue Test-/Browserpflichten stehen in AGENTS.md. `.rgignore` nimmt grosse
generierte Bestände aus Standardsuchen; für gezielte Audits beispielsweise
`rg --no-ignore 'Suchbegriff' docs/architecture/ux-inventory.json` verwenden.

## Produktionsarchitektur

- Next.js 16 App Router
- React 19 / TypeScript
- Azure App Service
- Azure Database for PostgreSQL
- serverseitige, datenbankgestützte Sessions
- E-Mail + Passwort, E-Mail-Verifikation, freiwillige TOTP/Recovery Codes und sitzungsgebundene Bestätigung kritischer Aktionen
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
- TOTP ist für Kundenrollen freiwillig; aktivierte Faktoren bleiben beim Login verbindlich. Kritische Änderungen benötigen frische sitzungsgebundene Bestätigung.
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

Die einzige aktive und kanonische Migrationslinie liegt unter:

```text
database/migrations/
```

Frühere Backend-/Migrationslinien sind nicht Bestandteil des aktiven Repositorys.

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

Windows-Runtime im bestehenden BINSO-ONE-Workspace (je neuer Tool-Shell):

```powershell
. ../runtime.ps1
git --version
node --version
pnpm --version
```

Erwartet: Git 2.55, Node 24.20.0 und pnpm 10.17.1. Die Aktivierung ist
prozesslokal und prüft `packageManager`; keine globale Corepack-Aktivierung.
In anderen Checkouts die vorhandene Umgebung gegen `package.json` prüfen und
fehlende Voraussetzungen melden. Installation nur im vereinbarten Auftragsumfang.

Breite QA-/Einrichtungsbefehle nach Bedarf; keine automatisch auszuführende
Checkliste für jeden Entwicklungsauftrag:

```powershell
pnpm install --frozen-lockfile
pnpm repository:clean
pnpm docs:check
pnpm release:check
pnpm test
pnpm lint
pnpm security:scan
pnpm security:scan:all
pnpm css:check
pnpm typecheck
pnpm build
```

## Go-live

Der verbindliche aktuelle Stand steht in:

`docs/production-launch-checklist.md`

Dokumentierte Betriebsverfahren:
- `docs/auth-security-flow.md`
- `docs/entra-operator-sso.md`
- `docs/production-rollback.md`
- `docs/azure-postgresql-backup-restore.md`
- `docs/customer-data-lifecycle.md`
- `docs/incident-response-and-retention.md`
- `docs/graph-mail-least-privilege.md`
- `docs/security-review-2026-10-05.md`

Domain-/Custom-Hostname-Konfiguration wird separat durchgeführt und ist nicht Bestandteil dieses Readiness-Blocks.
