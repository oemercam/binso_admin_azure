# Binso One v1.3.0 – Production Architecture

## Zielbild
Binso One ist eine mandantenfähige B2B-SaaS-Plattform. Kundenmandanten und Binso-Plattformbetreiber sind technisch und berechtigungsseitig getrennt.

## Runtime
- Next.js App Router auf Node.js Runtime
- Azure App Service Linux / Standalone Output
- PostgreSQL 16
- Azure Blob Storage für Dateien
- Application Insights / Log Analytics
- Stripe für Billing
- Resend für transaktionale E-Mails

## Modi
### Local
UI-/Workflow-Demo mit lokalen Datensätzen. Keine echten Kundendaten.

### Production
Serverseitige Authentifizierung, PostgreSQL, Storage, Billing, E-Mail und APIs. `lib/client/data-service.ts` dient als Dual-Mode-Abstraktion für die Fachmodule.

## Tenant Isolation
- `organization_id` auf tenantbezogenen Datensätzen
- serverseitige Permission Checks
- explizite Tenant-Filter in Repositories/APIs
- `withTenant()` setzt DB-Kontext nur innerhalb einer Transaktion
- PostgreSQL RLS
- `FORCE ROW LEVEL SECURITY` auf kritischen tenantbezogenen Tabellen
- Runtime soll mit einer dedizierten Rolle ohne `BYPASSRLS` laufen

## Identitäten
### Kunden
`users` + `sessions`, HttpOnly Session Cookie, RBAC, MFA/TOTP, Recovery Codes, E-Mail-Verifikation, Passwort-Reset, Sessionwiderruf.

### Betreiber
`platform_users` + separate Operator Sessions/Cookies und eigene RBAC-Domäne. Supportrollen erhalten keinen generellen Business-Data-Endpunkt.

## Support
Supporttickets sind organisationsbezogen. Diagnose und Screenshots werden nur nach Benutzeraktion angehängt. Technische Ereignisse werden redigiert. Produktive Dateien liegen in Blob Storage. Temporärer Supportzugriff ist explizit, begründet, zeitlich limitiert und auditierbar.

## Billing
Stripe Checkout/Portal/Webhooks. Webhook-Signaturen werden geprüft, Events dedupliziert und erst nach erfolgreicher Verarbeitung als verarbeitet markiert. Organisationen speichern Stripe Customer/Subscription Referenzen, nicht Kartendaten.

## E-Mail
Zentrale Provider-Schicht mit Templates für Verifikation, Passwort-Reset, Einladung und weitere transaktionale Nachrichten. Der Provider ist über Umgebungsvariablen konfiguriert.

## Dateien
Azure Blob Storage über Managed Identity oder SAS-Fallback. Uploads haben serverseitige Grössen-/MIME-Limits. Download erfolgt über autorisierte API-Endpunkte. Vor breitem produktivem Dateibetrieb sollte Malware Scanning aktiviert werden.

## Observability
- strukturierte, redigierte Serverlogs
- `/api/health`
- Application Insights / Log Analytics
- Audit Logs
- Betreiber-Metriken
- Supportdiagnose

## Deployment
GitHub Actions führt Release Check, Tests, Lint, Typecheck, Audit und Build aus. Anschliessend wird `.next/standalone` als Artifact per Azure OIDC nach App Service deployed und der Health Endpoint geprüft.

## Fachmodul-Grenze
Die generische `records`-API ist weiterhin ein Migrations-/Abstraktionslayer für mehrere Fachmodule. Finanz-, Lohn-, Steuer- und Bankfunktionen sollen vor einem regulierten oder buchhalterisch verbindlichen Vollbetrieb schrittweise in normalisierte Fachschemata und geprüfte Integrationen überführt werden.
