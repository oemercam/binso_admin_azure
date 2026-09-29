# Binso One v1.2.0 – Final QA / Release Candidate

## Automatisch im Arbeitscontainer erfolgreich

- Release-Dateiprüfung: bestanden
- Production-Selfcheck: bestanden
- Permission-Selfcheck: bestanden
- TypeScript/TSX Syntax-Scan: 0 Syntaxfehler
- lokale Import-Auflösung: 0 fehlende interne Imports
- PWA Manifest/Icon-Prüfung: bestanden
- Migrationssequenz 001–006: vollständig

## Zusätzlich umgesetzt / geprüft

- zentrale Feature Flags mit mandantenspezifischem Override
- Pilotfeedback respektiert Feature Flag
- Ankündigungen respektieren Feature Flag
- Onboarding-Checkliste respektiert Feature Flag
- Sidebar-Hover vs. aktiver Zustand getrennt
- Desktop-Unterseiten ohne redundanten Zurück-Link
- Dokumentdetail: einzeilige Desktop-Aktionsbuttons und ausgerichtetes Layout
- Privacy-Center-Toggles lokal gescoped
- Feedback-Kontaktcheckbox lokal gescoped
- redundante Desktop-Lupe entfernt, Mobile-Suche bleibt
- transparente Brand-SVGs und grössere Headerdarstellung
- Light / Dark / System inklusive Brand-Varianten
- Boot-/Route-Ladeanimation mit Binso Icon
- Responsive Desktop/Laptop/Tablet/Mobile/PWA
- SEO, Sitemap, Robots, JSON-LD, Open Graph, Favicons/PWA Icons
- eigene Features- und Preise-Landingpages
- Supportdiagnose, Screenshot, Eventlog und temporärer Supportzugriff
- MFA, Passwort-Reset, Verifikation, Sessions, Einladungen
- Notifications, Audit, Suche, Files, Account Export/Delete Request
- Stripe Checkout/Portal/Cancel/Webhooks
- Betreiberbereich mit Metrics, Support, Feedback, Feature Flags, Ankündigungen, Audit und Security
- Azure Bicep mit VNet, privatem PostgreSQL, Storage, Managed Identity, Application Insights
- Storage RBAC für App-Service-Identity
- GitHub Actions, CodeQL, Dependabot

## Muss lokal mit installierten npm-Abhängigkeiten bestätigt werden

Der Arbeitscontainer hat keinen Internetzugriff und konnte `pnpm install` nicht vollständig ausführen. Deshalb müssen diese vier Befehle auf dem Windows-Entwicklungsrechner als abschliessendes Gate laufen:

```powershell
pnpm test
pnpm release:check
pnpm lint
pnpm typecheck
pnpm build
```

## Muss gegen echte Staging-Infrastruktur bestätigt werden

- `pnpm db:check`
- `pnpm db:migrate`
- `pnpm tenant:test`
- Stripe Testmode E2E
- E-Mail-Zustellung
- Azure Blob Upload/Download
- MFA Recovery
- Support Screenshot/Diagnose
- Browser-/Geräte-Matrix
- Backup/Restore

## Release-Status

Codebasis: **v1.2.0 Release Candidate**.

Produktivfreigabe erst nach den lokalen Quality Gates und dem Staging-/Tenant-Test.
