# Binso One V81.19

V81.19 vereinfacht die drei Self-Service-Abos Starter, Business und Professional, koppelt Navigation und Einstellungen konsequent an Entitlements und hält Enterprise ausserhalb des Self-Service.

# Binso One V81.19.1

V81.16.2 keeps the canonical public responsive system and fixes React lint violations in the public mobile navigation.

## V81.15

Mobile public navigation reliability fix.

# Binso One

Binso One ist die von Binso GmbH entwickelte und betriebene SaaS-Plattform für Schweizer Dienstleistungsunternehmen.

## Technischer Stand

- Next.js 16 / React 19 / Node.js 24
- Azure App Service
- PostgreSQL mit tenant-gebundener Persistenz und RLS
- Azure App Service Authentication / Microsoft Entra ID bzw. External ID
- Stripe Checkout, Billing Portal und Webhooks
- Account, Organisationen, Rollen und Memberships
- Drei klare Self-Service-Modelle (Starter, Business, Professional) mit modulbasierten Entitlements; Enterprise individuell
- Binso-GmbH-Plattform-/Betreiberbereich
- Desktop, Mobile und PWA
- öffentliche Produktseite mit Preisen, FAQ, Support, Legal und responsivem Login
- Microsoft-Graph-Mail für Organisationseinladungen optional integriert
- automatischer Subscription-Lifecycle und Billing-Recovery für abgelaufene Trials

## Qualitätsprüfung

```powershell
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm verify
pnpm test:e2e
```

Für den produktiven Go-live zusätzlich:

```powershell
pnpm db:migrate
pnpm production:preflight
```

V70 Public Entry und Authentication: `docs/V70-PUBLIC-ENTRY-AUTH.md`.

V69-Bestandsaufnahme: `docs/V69-INVENTORY-AND-PLAN.md`. Aktueller Review, Implementierungsgrenzen und manuelle Go-live-Schritte: `docs/V69-REVIEW-AND-GO-LIVE.md` und `docs/DEPLOYMENT.md`. Historische Vxx-Dokumente beschreiben frühere Zwischenstände.


V72 Produktvereinfachung und DevSecOps-Basis: `docs/V72-PRODUCT-SIMPLICITY-DEVSECOPS.md`, `docs/development.md`, `docs/testing.md`, `docs/deployment.md` und `docs/security.md`.

## V75 Complete Production Foundation

V75 bündelt Operator-Portal, DB-Rollentrennung, Staging-Härtung, Support/Feedback, Pilot, Leads, Help Center, Analytics, Billing-Reconciliation, Daten-Lifecycle, Incidents und Release-Historie in einem Stand. Details und die verbleibenden externen Azure/Entra/DB-Schritte stehen in `docs/V75-COMPLETE-PRODUCTION-FOUNDATION.md`.


## V76 – Public Entry UX

V76 überarbeitet Landingpage, Login, Registrierung und Onboarding, ohne die Darstellung der authentifizierten Binso-One-Kundenanwendung zu verändern. Die Einrichtung ist auf drei kurze Schritte reduziert. Marketing-Screenshots können mit `pnpm marketing:screenshots` direkt aus der echten Anwendung erzeugt werden. Details: `docs/V76-PUBLIC-ENTRY-UX.md`.

## V77 – CI/CD Performance

V77 parallelisiert Quality, Build, PostgreSQL und Critical E2E, ergänzt Next.js- und Playwright-Caches und schreibt Build-, Artefakt- und Azure-Deploy-Zeiten direkt in die GitHub Step Summary. Produktionskontrollen, Staging-Slot, Healthchecks und Rollback bleiben erhalten. Details: `docs/V77-CICD-PERFORMANCE.md`.

## V78 – Public Site, echte Produktansichten und getrennte Zugänge

V78 ersetzt illustrierte Demo-Ansichten im öffentlichen Auftritt durch echte Screenshots der Binso-One-Anwendung, modernisiert Landingpage, Funktionen und Ablauf und bereinigt Navigation und Footer. `/sign-in` ist der Kunden-Login; der interne Microsoft-Zugang für Binso befindet sich getrennt unter `/admin-access`. Die Provider sind über `AUTH_PROVIDER_NAME` und `AUTH_ADMIN_PROVIDER_NAME` unabhängig konfigurierbar. Details: `docs/V78-PUBLIC-SITE-REDESIGN.md`.

## V81.2 – Complete Public Mockup System

V81.2 vereinheitlicht die gesamte öffentliche Binso-One-Website und die Pre-App-Zugänge nach dem freigegebenen Mockup-System. Landingpage, Funktionen, Preise, FAQ, Kontakt, Ablauf, Sicherheit, Status, Hilfe, Registrierung, Kunden-Login, Admin-Zugang und Legal-Seiten verwenden denselben kompakten Header, dieselben Proportionen, Typografie, Abstände, Mobile-Navigation und Footer. Die authentifizierte Kunden-App unter `app/(app)` bleibt optisch unverändert. Details: `docs/V81.2-COMPLETE-PUBLIC-MOCKUP.md`.


## V81.8
Public/pre-app responsive standardisation across web, mobile and PWA.


## V81.13
Public-route visual QA now uses the canonical local preview mode for sign-in and admin-access so the complete PublicShell is tested instead of intentional authenticated redirects.


## V81.14
Public desktop footer spacing and alignment refined; mobile/PWA behaviour unchanged.


## V81.16.4
Responsive regression fixes for canonical H1 scaling, mobile/tablet menu closed state and exhaustive viewport-matrix timeout.

## V81.17 Mobile/PWA UX

Mobile/PWA now has one canonical safe-area, sticky-header, white-system-surface and motion layer (`app/styles/mobile-pwa-system.css`). The old header hide-on-scroll mechanism and unused global scroll subscriber were removed; route motion is short and reduced-motion aware, while installed-PWA cold start stays white and non-blocking.

- V81.17.1: Sticky public/app headers no longer inherit overflow/transform containment; broad responsive E2E timing hardened.


### V81.17.2
Public sticky-header E2E assertions now follow the actual layout boundary: marketing pages do not wait for the authenticated `.route-stage`; that transform assertion runs after entering `/dashboard`.

## V81.18 – Product Simplicity

Die Kundenanwendung hat nur noch fünf primäre Arbeitsbereiche: Übersicht, Kunden, Arbeit, Zeit und Rechnungen. Angebote, Aufträge und Verträge werden unter Arbeit gebündelt; Finanzen, Mitarbeitende und Einstellungen liegen unter Mehr. Organisation, Konto und Daten bleiben vollständig verfügbar, sind aber bewusst aus der globalen Hauptnavigation entfernt und werden über Einstellungen erreicht. Die globale Neu-erstellen-Aktion ist auf fünf Kernaktionen reduziert.


## V81.19.1
Desktop navigation `<details>` TypeScript compatibility fix; subscription simplicity from V81.19 remains unchanged.


## V81.19.2
Root document scrolling is canonical for sticky headers, and E2E coverage follows the simplified mobile primary navigation introduced in V81.18.
