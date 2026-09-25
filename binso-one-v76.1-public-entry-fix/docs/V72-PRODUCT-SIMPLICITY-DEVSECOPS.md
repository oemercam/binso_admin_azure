# V72 – Product Simplicity & DevSecOps Baseline

## Produktmodell
Drei Standardmodelle: Starter, Business, Professional. Enterprise ist eine individuell vereinbarte Erweiterung von Professional und kein viertes normales Self-Service-Modell.

### Starter
Vollständiger Kernprozess: Kunden → Angebote → Aufträge → Rechnungen → Zahlungen.

### Business
Starter plus Zeit, Verträge, Mitarbeitende, Spesen, Freigaben, Mahnungen und Finanzübersicht.

### Professional
Business plus Buchhaltung, Kosten/Margen, Audit, Automationen und API.

## UX
Desktop zeigt wenige Hauptbereiche. Mobile/PWA fokussiert Suche, zentrale Neu-Aktion und Menü. Formulare zeigen Kernfelder zuerst; seltene Einstellungen sind eingeklappt.

## Qualitätsbasis
Node 24, pnpm/Frozen Lockfile, TypeScript strict, ESLint, Unit-/Integration-Tests, Playwright-Grundlage, Tenant-Sicherheitschecks, Secret-/Security-Checks, CI und dokumentierter Staging-Pfad.

## Abschlussstatus DevSecOps-Basis

### Bereits korrekt
Node 24/pnpm, TypeScript strict, ESLint, Standalone-Production-Build, bestehende Architektur-/Produktchecks, PostgreSQL-Migrationstests, RLS-Grundlage, Health-Route und manueller Production-Deploy waren bereits vorhanden und wurden weiterverwendet.

### Implementiert
Drei klar getrennte Self-Service-Modelle, Progressive-Disclosure-Formulare, Quick-Create, zentrale Entitlements, Plan-Katalog in PostgreSQL, pragmatische Indizes, Unit-/Integration-/E2E-Grundlage, Secret-/Security-Check, Rate Limits für Registrierung/Einladungen, Dependabot und Staging-Validierungsworkflow.

### Tests
Unit: Plan-/Permission-Regeln. Integration: Auth-/Tenant-/API-Invarianten. PostgreSQL: Migrationen und negativer Cross-Tenant-RLS-Zugriff. E2E: Einstieg/Dashboard, Minimal-Kunde, Kernangebot, einfacher Rechnungsentwurf und Mobile/PWA-Kernnavigation. Login-Redirect und Standalone-Lauffähigkeit bleiben im Smoke-Test abgedeckt.

### Security
Tenant-Kontext bleibt serverseitig. Browserseitige `organization_id` ist keine Vertrauensquelle. Sensitive Serveraktionen verwenden zentrale Membership-/Permission-Prüfungen. Health-Antwort enthält keine Infrastrukturdetails. Secret-Hygiene und grundlegende Rate Limits sind automatisiert geprüft.

### CI/CD
Main/PR: Frozen Install, Typecheck, Lint, Produkt-/Securitychecks, Unit/Integration/Regression, Build, isoliertes Deployment-Artefakt, Smoke, PostgreSQL/RLS sowie separater Playwright-Job. Production bleibt manueller Workflow-Dispatch.

### Manuelle GitHub-Konfiguration
Main-Branch-Schutz, Required Checks, Secret Scanning/Push Protection und Dependabot müssen in den Repository-Einstellungen tatsächlich aktiviert werden, soweit im verwendeten GitHub-Plan verfügbar.

### Manuelle Azure-Konfiguration
Vor echten externen Kunden bleibt ein Staging-Slot oder eine separate Staging-App mit getrennter Testdatenbank einzurichten. Danach `BINSO_ONE_STAGING_URL` und Staging-Secrets im GitHub-Environment hinterlegen. Repository-Code allein verändert diese Azure-Ressourcen nicht.

### Verbleibende P0-Punkte
Staging vor Production real konfigurieren und den vollständigen Playwright-Lauf dort verifizieren. Bereits früher offengelegte echte Credentials rotieren. Erst danach darf der Stand als für echte Kundendaten produktionsbereit bewertet werden.

### P1
Bei wachsendem Datenvolumen die heutige tenantweite Business-State-Ladung in serverseitig paginierte Repositories überführen. Den In-Process-Rate-Limiter bei horizontaler Skalierung durch einen zentralen Store ersetzen. Weitere Staging-E2E-Fixtures für Rollen-/Permission-Negativfälle ergänzen.
