# Binso One v1.3.0 – Production Readiness

## Produkt und UX
- zentrale Light/Dark/System-Themes mit frühzeitiger Theme-Initialisierung
- transparentes Binso Branding, PWA-/Browser-/Apple-Icons
- Ladeanimation mit Binso Icon
- Desktop-/Laptop-/Tablet-/Mobile-Responsive Baseline
- bereinigte Sidebar Active/Hover States
- Desktop-Unterseiten ohne redundanten «Zurück»-Text
- konsistente Dokumentdetail-Ausrichtung und einzeilige Desktop-Aktionsbuttons
- eigenständige Features-/Preise-Seiten, FAQ, Kontakt, SEO-Metadaten und strukturierte Daten
- dynamische öffentliche Statusseite ohne falsche «alles betriebsbereit»-Behauptung

## SaaS und Sicherheit
- serverseitige Sessions, RBAC und Tenant-Isolation
- Kunden-/Betreiberrollen getrennt
- MFA/TOTP + Recovery Codes
- Passwort-Reset und Passwortänderung
- E-Mail-Verifikation
- aktive Sessions und Widerruf
- Einladungen inkl. erneutes Senden/Widerruf
- Account Export und geregelte Löschanfrage
- Audit Logs

## Support / Pilot
- eigenes Ticketing
- technische Diagnose mit Redaction
- freiwilliger Browser-Screenshot
- Dateianhänge und Mobile-Kamera
- Blob-Storage für produktive Anhänge
- Anhänge vor Ticketzuordnung wieder löschbar
- zeitlich begrenzter Supportzugriff
- Pilotfeedback, Feature Flags, Ankündigungen und Changelog

## Betrieb
- Migration Ledger
- PostgreSQL RLS + FORCE RLS
- PostgreSQL-backed Rate Limits im Production Mode
- Stripe Lifecycle/Webhook Hardening
- Azure App Service/PostgreSQL/Storage/Application Insights Bicep
- GitHub Actions OIDC + Standalone Artifact + Health Check
- Production Runbook und GitHub/Azure Deployment Guide

## Offene fachliche Abnahmen vor Vollbetrieb
Rechtlich/fachlich kritische Funktionen wie vollständige Schweizer Lohn-/Steuer-/Bank-/Buchhaltungsintegrationen benötigen weiterhin fachliche Validierung bzw. externe Integrationen. v1.3.0 ist dafür eine technische SaaS-Plattformbasis, keine implizite behördliche Zertifizierung.
