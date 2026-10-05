# Binso One – aktueller Sicherheits- und Betriebsreview

Stand: 5. Oktober 2026

Dieses Dokument beschreibt den aktuellen Quellcode- und Betriebsstand nach dem Production-Readiness-Hardening. Es ist keine Zertifizierung, kein vollständiger Penetrationstest und kein Nachweis einer ISO-/ASVS-Konformität. Operative Punkte, die nur in Azure, Microsoft Entra, Microsoft 365, Stripe oder auf realen Endgeräten bestätigt werden können, bleiben ausdrücklich offen.

## Aktuelle Architektur

- Next.js 16 / React 19 auf Azure App Service
- Azure Database for PostgreSQL als kanonische Datenbank
- kanonische Migrationen ausschliesslich unter `database/migrations/`
- serverseitige Sessions und Rollenprüfung
- PostgreSQL-RLS und serverseitiger Tenant-Kontext
- Microsoft Entra ID für interne Binso-Operatoren
- Microsoft Graph / Microsoft 365 als einziger produktiver E-Mail-Pfad
- Stripe für Binso-One-Abonnemente
- optionale Azure-Blob-Ablage; Dateiinhalt kann auch tenantgebunden in PostgreSQL gespeichert werden
- GitHub Actions mit Quality-Gate und Azure-OIDC-Deployment

## Bereits technisch abgesichert

### Authentifizierung und Sessions
- E-Mail + Passwort mit mindestens 12 Zeichen
- E-Mail-Verifikation
- zusätzlicher Login-Faktor
- TOTP und einmalige Recovery Codes
- Authenticator-Pflicht für privilegierte Kundenrollen
- HttpOnly-/Secure-/SameSite-Session-Cookies
- serverseitige aktive Sitzungen mit Widerruf anderer Geräte
- automatische Bereinigung abgelaufener Auth-Artefakte und Sessions

### Mandantentrennung
- Geschäftsdaten sind einer Organisation zugeordnet.
- Serverzugriffe setzen Organisation und Benutzer transaktionslokal.
- RLS/FORCE-RLS-Mechanismen und explizite Tenant-Prädikate werden automatisiert getestet.
- Der Migrationstest provisioniert mehrere unabhängige Organisationen und prüft Querzugriffe.

### Interne Administration
- produktiver Operatorzugriff basiert auf Microsoft Entra ID / App Service Authentication.
- lokale produktive Operator-Passwörter sind deaktiviert.
- App-Rollen werden auf das interne Operator-RBAC gemappt.
- Operator-Sessions werden gegen die aktuelle Entra-Identität und Rollenlage geprüft.

### E-Mail
- produktiver Versand ausschliesslich über Microsoft Graph.
- Client-Credentials werden im Deploy geprüft.
- eigener Production-Workflow führt einen echten Graph-`sendMail`-Selbsttest durch.
- Least-Privilege-Vorgehen für Exchange Application RBAC ist dokumentiert.

### Billing
- Stripe Checkout wird serverseitig erzeugt.
- Stripe-Webhooks sind signaturgeprüft und idempotent verarbeitet.
- Customer Portal und 14-Tage-Testphase sind implementiert.
- sechs explizite Live-Price-Konfigurationen werden automatisiert auditiert.
- Trial-Ablauf und Nur-Lesen-Zustand werden datenbankseitig getestet.

### Software-Lieferkette
- Release-Checks, Tests, ESLint, TypeScript, Build und Runtime-Smoke-Test laufen in Quality.
- High/Critical-Findings in Produktionsabhängigkeiten blockieren den Release.
- der vollständige Dependency-Audit erlaubt nur die separat dokumentierte, aktuell ungepatchte Development-Tool-Advisory.
- Deployment erfolgt erst nach erfolgreichem Quality-Lauf.
- Azure-Login im Deployment erfolgt per OIDC.

### Datenschutz und Daten-Lifecycle
- technische Aufbewahrungsfristen für Auth-Artefakte und Sessions sind definiert.
- kontrollierter Organisations-Export ist implementiert.
- endgültige Organisationslöschung ist transaktional geschützt und setzt Export-/Billing-/Blob-Bedingungen voraus.
- Datenschutz, AGB, Auftragsbearbeitung und Unterauftragsbearbeiter sind in der Anwendung veröffentlicht.

## Bewusst offene bzw. noch praktisch zu bestätigende Punkte

### Betrieb / Azure
- finaler produktiver Quality- und Deploy-Lauf für den Go-live-Commit
- echter PostgreSQL Point-in-Time-Restore-Test
- Application-Insights-/Alert- und Action-Group-Test inklusive realer Alarmzustellung
- finaler Least-Privilege-Review für Produktions-Secrets und Azure-Rollen
- Log-Retention und Incident-Eskalationsverantwortung organisatorisch bestätigen

### Microsoft
- Entra App Roles mit realen Binso-Mitarbeiterkonten testen
- Conditional Access / Microsoft Authenticator praktisch bestätigen
- Offboarding-Test durchführen
- Microsoft-Graph-`Mail.Send` mittels Exchange Application RBAC auf `one@binso.ch` einschränken und Negativtest mit einer anderen Mailbox durchführen
- SPF, DKIM, DMARC und externe Mailzustellung bestätigen

### Stripe
- kontrollierte Live-Zahlung
- echte `invoice.paid`- und `invoice.payment_failed`-Szenarien
- Kündigung zum Periodenende
- fachliche MWST-/Steuerkonfiguration

### Dateien
Dateiuploads haben Dateityp-/Grössenprüfung, Hash, Tenant-/Rollenprüfung und sichere Download-Header. Ein dedizierter Malware-Scanner wird im aktuellen Code nicht als produktiv angeschlossen nachgewiesen. Bis ein Scanner integriert ist, darf der Status `scan_status='pending'` nicht als Malware-Freigabe interpretiert werden.

### Browser-Security
Die Anwendung setzt CSP, HSTS, No-Sniff, Frame-, Referrer- und Permissions-Policy-Header. Die aktuelle CSP enthält für Next.js noch `'unsafe-inline'` für Scripts/Styles. Ein Nonce-/Hash-basiertes CSP-Hardening ist ein sinnvoller weiterer Security-Schritt, aber kein bereits abgeschlossener Punkt.

### Geräteabnahme
Die finale praktische Abnahme auf Desktop-Browsern, iPhone/PWA, Android/PWA und Tablet sowie Login/MFA/Stripe auf Mobilgeräten bleibt offen.

## Quelle der Wahrheit

- Go-live-Status: `docs/production-launch-checklist.md`
- Authentifizierung: `docs/auth-security-flow.md`
- Entra: `docs/entra-operator-sso.md`
- Graph Least Privilege: `docs/graph-mail-least-privilege.md`
- Stripe: `docs/stripe-billing-setup.md`
- Restore: `docs/azure-postgresql-backup-restore.md`
- Daten-Lifecycle: `docs/customer-data-lifecycle.md`
- Retention/Incident Response: `docs/incident-response-and-retention.md`
- TOM: `docs/technical-organizational-measures.md`

Die Domain-/Custom-Hostname-Umstellung ist bewusst separat und nicht Gegenstand dieses Reviews.
