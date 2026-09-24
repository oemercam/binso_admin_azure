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
- öffentliche Produktseite mit Preisen, FAQ, Support, Legal und responsivem Login
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

V70 Public Entry und Authentication: `docs/V70-PUBLIC-ENTRY-AUTH.md`.

V69-Bestandsaufnahme: `docs/V69-INVENTORY-AND-PLAN.md`. Aktueller Review, Implementierungsgrenzen und manuelle Go-live-Schritte: `docs/V69-REVIEW-AND-GO-LIVE.md` und `docs/DEPLOYMENT.md`. Historische Vxx-Dokumente beschreiben frühere Zwischenstände.
