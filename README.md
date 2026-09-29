# Binso One v1.2.0

Binso One ist eine mandantenfähige Schweizer SaaS-Plattform für KMU. Die Anwendung deckt Verkauf, Projekte, Zeiterfassung, Spesen, Rechnungen, Zahlungen, Einkauf, Buchhaltung, MWST, Personal, Dokumente, Verträge, Support und Plattformbetrieb ab.

## Laufzeitmodi

### Lokal
`APP_MODE=local` / `NEXT_PUBLIC_APP_MODE=local`

- Browser-Demo ohne produktive Kundendaten
- lokale Beispieldaten und lokale Workflows
- geeignet für UI-/Prozessprüfung

### Produktion
`APP_MODE=production` / `NEXT_PUBLIC_APP_MODE=production`

- PostgreSQL auf Azure
- serverseitige Sessions
- Multi-Tenant-RBAC und RLS
- Stripe-Abonnemente
- E-Mail-/Einladungs-/Passwort-Reset-Workflows
- MFA
- Azure Blob Storage
- Audit, Notifications, Support, Operatorbereich

## Produktbereiche

- Dashboard und globale Suche
- Kunden
- Offerten und Aufträge
- Projekte
- Zeiterfassung und Spesen
- Rechnungen und Zahlungen
- Lieferanten und Eingangsrechnungen
- Buchhaltung, Bank und MWST
- Berichte
- Mitarbeitende, Abwesenheiten und Lohn
- Produkte und Leistungen
- Dokumente und Verträge
- Aufgaben
- Einstellungen und Benutzer/Rollen
- Abo und Abrechnung
- Benachrichtigungen
- Support und Pilotfeedback

## SaaS / Marketing

Öffentliche Bereiche:

- `/`
- `/features`
- `/preise`
- `/demo`
- `/kontakt`
- `/status`
- `/impressum`
- `/datenschutz`
- `/agb`
- `/cookies`
- `/auftragsbearbeitung`
- `/unterauftragsbearbeiter`
- `/sicherheit`

Enthalten sind zentrale Metadata, Open Graph, Twitter Cards, `robots.ts`, `sitemap.ts`, Organization-/LocalBusiness-/SoftwareApplication-JSON-LD, Favicon-/Apple-/PWA-Icons sowie eine installierbare PWA.

## UX / Design

- zentrales Design-System
- Light / Dark / System
- automatische passende Schwarz-/Weiss-Brand-Assets
- App-Ladeanimation mit Binso Icon
- Desktop, Laptop, Tablet, Mobile und PWA
- Safe Areas und Touch-Optimierung
- Mobile Bottom Navigation und Sheets
- konsistente Toggles, Formulare, Tabellen, Karten und Aktionsbuttons
- Desktop-Unterseiten ohne redundante Zurück-Navigation
- reduzierte Animationen bei `prefers-reduced-motion`

## Support

Kundensupport beinhaltet:

- Tickets mit Kategorie, Priorität und Status
- Nachrichtenverlauf
- technische Diagnose auf ausdrückliche Benutzeraktion
- Screenshot-Aufnahme über Browserfreigabe
- redigierte technische Ereignisse
- temporären, zeitlich begrenzten Supportzugriff
- Operator-Supportqueue

Technische Diagnose sammelt keine Passwörter oder Cookies. E-Mail-/IBAN-/Secret-ähnliche Werte werden soweit möglich redigiert.

## Sicherheit

- getrennte Kunden- und Betreiberidentitäten
- HttpOnly Sessions
- Scrypt Passwort-Hashing
- MFA/TOTP und Recovery Codes
- rollenbasierte Berechtigungen
- Tenant-Kontext in Transaktionen
- PostgreSQL RLS + FORCE RLS für tenant-sensitive Tabellen
- Same-Origin-Schutz für mutierende Browser-APIs
- Body-Limits und Rate Limiting
- CSP/HSTS/nosniff/Frame-Schutz/Permissions-Policy
- PII-reduziertes Logging
- Audit Logs
- Stripe Webhook-Signatur, Deduplizierung und retry-fähige Verarbeitung
- keine Speicherung von Kartendaten in Binso One

## Betreiberbereich

`/operator`

- Plattformübersicht
- Kunden-/Mandantenmetadaten
- Betreiberbenutzer
- Support
- Feedback
- Feature Flags
- Ankündigungen
- Plattform-Audit
- Sicherheit/MFA

Der Betreiberbereich bietet keinen allgemeinen Zugriff auf fachliche Kundendaten. Temporärer Supportzugriff ist separat, begründet, zeitlich limitiert und auditierbar.

## Produktions-APIs

Unter anderem:

- Auth / MFA / Passwort-Reset / E-Mail-Verifikation
- Organisation / Benutzer / Einladungen / Sessions
- Kunden und generische Records
- Suche
- Notifications und Audit
- Files
- Support / Feedback / Feature Flags / Announcements
- Billing / Stripe
- Operator APIs
- Health

## Datenbank

Migrationen liegen unter `database/migrations/`.

Aktuell:

1. Basisschema
2. Berechtigungen / Operator
3. Pilot / Support / Rechtliches
4. Support-Diagnose
5. Production Readiness
6. Organisationseinstellungen

`pnpm db:migrate` führt Migrationen aus. Vor Produktion immer Backup/Restore-Prozess und Migrationen in Staging prüfen.

## Azure

`infra/main.bicep` stellt die Produktionsbasis bereit:

- Linux App Service
- VNet Integration
- Azure Database for PostgreSQL Flexible Server mit privatem Netzwerk
- Blob Storage ohne Public Access
- Managed Identity
- Storage Blob Data Contributor für die Web App Identity
- Application Insights
- Log Analytics
- Health Check

Zusätzliche Secrets wie Stripe, E-Mail und `APP_ENCRYPTION_KEY` werden nach Provisionierung als sichere Azure App Settings bzw. bevorzugt über Key Vault gesetzt.

## CI/CD

`.github/workflows/azure-webapp.yml`

Pipeline:

1. Install
2. Tests / Release Check
3. Lint
4. Typecheck
5. Security Audit
6. Production Build
7. Deploy-Artefakt
8. OIDC Login zu Azure
9. Deployment auf Azure Web App

Zusätzlich:

- CodeQL
- Dependabot

## Qualitätsprüfungen

```powershell
pnpm install
pnpm test
pnpm release:check
pnpm lint
pnpm typecheck
pnpm build
```

Mit produktiver Testdatenbank zusätzlich:

```powershell
pnpm db:check
pnpm tenant:test
```

## Operator bootstrap

Nach Migration und mit gesetzten Umgebungsvariablen:

```powershell
pnpm operator:bootstrap
```

Danach `/operator/login` verwenden und MFA für Betreiber aktivieren.

## Relevante Dokumentation

- `docs/architecture/PRODUCTION-ARCHITECTURE.md`
- `docs/architecture/SECURITY.md`
- `docs/architecture/PERMISSION-CONCEPT.md`
- `docs/architecture/PERMISSION-MATRIX.md`
- `docs/operations/PRODUCTION-CHECKLIST.md`
- `docs/operations/AZURE-DEPLOYMENT.md`
- `docs/operations/SUPPORT-RUNBOOK.md`

## Vor Go-Live

Die Anwendung ist technisch für Staging/Produktionsintegration vorbereitet. Vor realen Kundendaten müssen insbesondere durchgeführt werden:

- vollständiger lokaler `pnpm check`
- produktiver Tenant-Isolationstest gegen PostgreSQL
- Azure Staging Deployment
- reale Browser-/Gerätetests
- Restore-Test
- Stripe Testmode E2E
- E-Mail-Zustellungstest
- Security Review
- finale juristische Prüfung der Vertrags-/Datenschutzdokumente
- Einrichtung der öffentlichen Mailadressen `info@binso.ch`, `privacy@binso.ch`, `legal@binso.ch`, `support@binso.ch`
