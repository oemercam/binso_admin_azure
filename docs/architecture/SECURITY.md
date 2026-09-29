# Security Baseline – Binso One v1.2.0

## Web
- CSP
- HSTS
- `nosniff`
- `DENY` Framing / `frame-ancestors 'none'`
- strikte Referrer Policy
- Permissions Policy
- COOP/CORP
- API `Cache-Control: no-store`

## Auth
- Scrypt
- HttpOnly Sessions
- Secure Cookie in Produktion
- MFA / Recovery Codes
- E-Mail-Verifikation
- Passwort-Reset Token mit Ablauf und Einmalnutzung
- getrennte Operator Sessions

## Mandantentrennung
- `organization_id`
- serverseitige RBAC-Prüfung
- Tenant Filter
- PostgreSQL RLS
- FORCE RLS auf kritischen Tabellen
- automatisierter Tenant-Schema-Test

## API
- Same-Origin Check bei Browser-Mutationen
- Body Limits
- Validierung
- verteiltes DB-basiertes Rate Limiting in Production
- serverseitige Berechtigungsprüfung

## Secrets
Keine Secrets im Repository. Produktionssecrets gehören in sichere Azure Settings bzw. Key Vault. `APP_ENCRYPTION_KEY` wird für MFA-Geheimnisse benötigt.

## Storage
- kein Public Blob Access
- TLS
- Managed Identity / RBAC oder kontrollierter SAS-Fallback
- Tenant-Metadaten in DB

## Logging / Audit
- strukturierte Logs
- Redaction sensibler Schlüssel
- Kunden-Audit
- Plattform-Audit
- Supportdiagnose mit zusätzlicher Redaction

## Stripe
- keine Kartendaten
- signierte Webhooks
- Zeitfensterprüfung
- mehrere `v1` Signaturen unterstützt
- idempotente/deduplizierte Verarbeitung
- Fehler führen nicht zu einem fälschlich abgeschlossenen Event

## Vor Go-Live
- SAST/CodeQL
- Dependency Audit
- Tenant-Isolationstest
- Staging Pen-Test / Security Review
- Backup-/Restore-Test
- Secrets Rotation Plan
- Incident Runbook
