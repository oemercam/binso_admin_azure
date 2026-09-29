# Binso One v1.2.0 – Production Architecture

## Architektur
- Next.js 16 / React 19
- Node Runtime
- PostgreSQL
- Azure App Service
- Azure Blob Storage
- Stripe
- serverseitige Authentifizierung und Sessions

## Multi-Tenant
Tenant-sensitive Daten tragen `organization_id`. Zugriff erfolgt über explizite Tenant-Filter plus PostgreSQL RLS. `withTenant()` setzt `app.organization_id` und `app.user_id` transaktional. Kritische tenant-scoped Tabellen verwenden zusätzlich `FORCE ROW LEVEL SECURITY`.

## Identitätsdomänen
Kunden und Binso-Betreiber besitzen getrennte Tabellen, Cookies, Sessions und RBAC-Matrizen. Operatoren erhalten keine allgemeine API für fachliche Kundendaten.

## Authentifizierung
- Scrypt Passwort-Hashing
- Hash-only Session Tokens
- HttpOnly/Secure Cookies
- E-Mail-Verifikation
- Passwort-Reset
- MFA/TOTP
- Recovery Codes
- Session-Verwaltung

## Datenzugriff
Bestehende Fachmodule verwenden eine mandantenfähige Records-API als Übergangsschicht. Finanz-/Lohn-/Buchhaltungsbereiche sollten bei zunehmender fachlicher Tiefe in normalisierte Domänentabellen migriert werden.

## Billing
Stripe Checkout und Customer Portal werden serverseitig angesprochen. Kartendaten werden nicht in Binso One gespeichert. Webhooks werden signiert, dedupliziert und erst nach erfolgreicher Verarbeitung als verarbeitet markiert.

## Files
Dokumente und Support-Screenshots verwenden Azure Blob Storage. Die App Service Managed Identity erhält Blob Data Contributor. Datenbanktabellen speichern Referenzen und Metadaten.

## Support
Tickets, Nachrichten, Diagnose, Screenshot und temporärer Supportzugriff sind getrennt von normalen Businessdaten. Supportzugriff ist begründet, scope-begrenzt, zeitlich limitiert und widerrufbar.

## Operations
- Health Endpoint
- Application Insights
- Log Analytics
- Operator Dashboard
- Support Queue
- Feedback
- Feature Flags
- Announcements
- Audit

## Deployment
GitHub Actions nutzt OIDC zu Azure. Build und Quality Gate laufen vor dem Deploy. Details stehen unter `docs/operations/AZURE-DEPLOYMENT.md`.
