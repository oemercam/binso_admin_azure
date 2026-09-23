# Binso One

Binso One ist die von Binso GmbH entwickelte und betriebene SaaS-Plattform für Schweizer Dienstleistungsunternehmen.

## Technischer Stand

- Next.js 16 / React 19 / Node.js 24
- Azure App Service
- PostgreSQL mit tenant-gebundener Persistenz und RLS
- Azure App Service Authentication / Microsoft Entra ID bzw. External ID
- Stripe Checkout, Billing Portal und Webhooks
- Account, Organisationen, Rollen und Memberships
- Trial, Preispläne und modulbasierte Entitlements
- Binso-GmbH-Plattform-/Betreiberbereich
- Desktop, Mobile und PWA
- Microsoft-Graph-Mail für Organisationseinladungen optional integriert
- automatischer Subscription-Lifecycle und Billing-Recovery für abgelaufene Trials

## Qualitätsprüfung

```powershell
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm verify
```

Für den produktiven Go-live zusätzlich:

```powershell
pnpm db:migrate
pnpm production:preflight
```

Produktionsdetails: `docs/GO-LIVE-V68.md` und `docs/DEPLOYMENT.md`.
