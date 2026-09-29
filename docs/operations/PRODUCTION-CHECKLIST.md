# Production Checklist – Binso One v1.2.0

## Code
- `pnpm test`
- `pnpm release:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `pnpm audit --audit-level high`

## Datenbank
- aktuelle Migrationen auf Staging
- Backup vor Migration
- `pnpm db:check`
- `pnpm tenant:test`
- RLS und FORCE RLS verifizieren
- Restore-Test dokumentieren

## Azure
- App Service Production + Staging prüfen
- PostgreSQL öffentliches Netzwerk deaktiviert
- Storage ohne Public Access
- Managed Identity aktiv
- Storage RBAC vorhanden
- Health Check `/api/health`
- Application Insights verbunden
- Logs ohne PII kontrollieren
- Produktionssecrets nicht im Repository

## Auth / Security
- Registrierung
- E-Mail-Verifikation
- Login / Logout
- Passwort vergessen / Reset
- MFA aktivieren / bestätigen / deaktivieren
- Recovery Code testen
- Sessions anzeigen / widerrufen
- Betreiber-MFA testen
- letzte Owner-/Platform-Owner-Schutzregel testen

## Multi-Tenant
- zwei Organisationen erstellen
- Cross-Tenant Read/Patch/Delete testen
- Own-Record-Scope Member testen
- Operator hat keine Business-Records-API
- temporärer Supportzugriff Ablauf/Widerruf testen

## Billing
- Stripe Test Checkout
- Webhook-Signatur
- Webhook-Retry
- subscription.created/updated/deleted
- invoice.paid/payment_failed
- Portal
- Kündigung / Reaktivierung

## Support
- Ticket erstellen
- Diagnose anhängen
- Screenshot aufnehmen
- Operator Queue
- Antwort Kunde ↔ Support
- temporärer Supportzugriff
- sensible Werte im Diagnose-Log prüfen

## E-Mail
- Absenderdomain SPF/DKIM/DMARC
- Verifikation
- Passwort-Reset
- Einladung
- Dokumentversand
- Supportbenachrichtigung

## UX
- Desktop 1920 / 1440 / 1280
- Laptop 1024–1280
- Tablet Portrait/Landscape
- iPhone Safari/PWA
- Android Chrome/PWA
- Samsung Internet
- Edge/Chrome/Firefox/Safari
- Light/Dark/System
- Tastatur/Fokus
- `prefers-reduced-motion`

## Marketing / SEO
- Search Console
- Bing Webmaster Tools
- `robots.txt`
- `sitemap.xml`
- Canonical URLs
- Open Graph Preview
- Favicon / Apple Touch / PWA Icons
- Google Business Profile
- konsistente NAP-Daten

## Rechtliches
- AGB juristisch prüfen
- Datenschutzerklärung prüfen
- AVV prüfen
- Unterauftragsbearbeiter aktualisieren
- Cookie-/Consent-Kategorien mit realen Tools abgleichen
