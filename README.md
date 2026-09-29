# Binso One v1.3.0

Binso One ist eine mandantenfähige Schweizer SaaS-Plattform für KMU. Der aktuelle Stand kombiniert eine lokale Demo mit einer produktiven Serverarchitektur für Azure App Service, PostgreSQL, Azure Blob Storage, Stripe und Resend.

## Funktionsbereiche

- Verkauf: Kunden, Offerten, Aufträge, Rechnungen und Zahlungen
- Projekte: Projekte, Aufgaben, Zeiterfassung und Spesen
- Einkauf: Lieferanten und Eingangsrechnungen
- Finanzen: Buchhaltung, Bank, MWST und Berichte
- Personal: Mitarbeitende, Abwesenheiten und Lohn-Workflows
- Administration: Produkte, Dokumente, Verträge, Einstellungen
- SaaS: Registrierung, Login, Onboarding, Tarife und Abonnementverwaltung
- Sicherheit: RBAC, getrennte Betreiberkonten, MFA/TOTP, Sessionverwaltung, E-Mail-Verifikation, Passwort-Reset und Audit
- Support: Tickets, Kommunikation, Diagnose, Screenshot, Anhänge und zeitlich begrenzter Supportzugriff
- Betreiber: Mandanten, Abos, Support, Feedback, Feature Flags, Ankündigungen, Audit und Plattformmetriken

## Laufzeitmodi

### `local`
Lokale Produktdemo mit Browser-Speicherung für schnelle UX- und Workflow-Tests. Nicht für echte Geschäftsdaten gedacht.

### `production`
Serverseitige Authentifizierung, PostgreSQL, Tenant-Isolation, Azure Storage, Stripe und E-Mail-Integration. Die zentrale Datendienst-Schicht schaltet geeignete Fachmodule im Production Mode auf `/api/records` bzw. spezialisierte APIs um.

## Technologie

- Next.js 16.3.6 / App Router
- React 19.3
- TypeScript 5.9
- Node.js 24 Zielruntime
- PostgreSQL 16
- Azure App Service Linux
- Azure Blob Storage
- Stripe Billing
- Resend E-Mail
- GitHub Actions + Azure OIDC

## Lokaler Qualitätslauf

```powershell
corepack enable
pnpm install
pnpm release:check
pnpm permissions:test
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

Danach:

```powershell
pnpm dev
```

## Produktion

1. Azure-Infrastruktur bereitstellen.
2. PostgreSQL-Migrationen mit dem DB-Admin ausführen.
3. Dedizierte Runtime-DB-Rolle gemäss `database/bootstrap/app-role.sql` einrichten.
4. Produktions-Secrets und App Settings setzen.
5. Ersten Betreiber mit `pnpm operator:bootstrap` erstellen und MFA aktivieren.
6. GitHub OIDC konfigurieren.
7. `main` deployen und `/api/health` prüfen.

Details stehen in:

- `docs/operations/PRODUCTION-RUNBOOK.md`
- `docs/deployment/GITHUB-AZURE.md`
- `docs/architecture/SECURITY.md`
- `docs/architecture/PERMISSION-CONCEPT.md`

## Wichtige Produktgrenze

Die Plattformarchitektur ist produktionsorientiert, aber einzelne fachlich und regulatorisch kritische Bereiche wie vollständige Schweizer Lohnabrechnung, Steuer-/MWST-Einreichung, Bankanbindung und gesetzlich verbindliche Buchhaltungslogik benötigen vor einem kommerziellen Vollbetrieb eine fachliche Integration, Validierung und Abnahme. UI-Demos oder simulierte Funktionen dürfen nicht als behördliche oder bankseitige Integration verstanden werden.
