# Architecture

## Application shell

`AppShell` owns the authenticated shell: canonical topbar, `DesktopNav`, shared `MobilePillNav`, global overlays and page content. Mobile browser and installed PWA use the same components; only `DeviceEnvironmentProvider` metrics differ.

## Navigation

`components/navigation/nav-items.ts` is the only navigation data source. `navForRole()` filters `owner`, `admin`, `finance` and `employee` centrally. `DesktopNav` and `MobilePillNav` both consume that result. `NavigationItem` owns row geometry and selected/focus states.

## Providers

`AppProviders` composes Theme, Device Environment, Network and Feedback providers plus PWA update handling. Browser viewport APIs belong to `DeviceEnvironmentProvider`; pages must not install competing listeners.

## Overlays

`ResponsiveOverlay`, `AppSheet`, `StandardFormSheet` and `ResponsivePreview` share the centralized `OverlayManager`. The overlay manager owns Escape handling, focus return/trapping and background scroll lock. In forms, only AppSheet content scrolls; header/footer stay outside the scroll area.

## Forms

`components/ui/form-controls.tsx` provides canonical `Input`, `Textarea`, `Select` and `FormField`. Select uses a controlled popover on desktop and the existing responsive overlay architecture on mobile/PWA. Business pages do not use raw native selects or page-specific control geometry.

## App identity

`lib/config/app-identity.ts` is the identity/config source. `AppLogo` owns application branding. Canonical source assets are `public/brand/logo-black.svg` and `public/brand/icon-black.svg`; PNG derivatives are generated for platform install surfaces.

## Data and auth

HTTP behaviour is centralized under `lib/http/`. Authentication logic is centralized under `lib/auth/`. Production business data is a versioned JSON snapshot per organization in PostgreSQL (`tenant_business_state`), protected by tenant context, role-aware projection/mutation and optimistic concurrency. Relational business tables are historical foundations, not a second authoritative data source. Local development can still use isolated seed data. Sequential files under `database/migrations` are the deployment schema source.

V69 adds durable `mail_outbox`, `job_runs` and private storage metadata. Background work locks each tenant using the same advisory lock as interactive saves. Microsoft Graph acceptance updates document status; ambiguous attempts require operator inspection. `docs/V69-REVIEW-AND-GO-LIVE.md` records implementation boundaries and external acceptance requirements.

## PWA

`app/manifest.ts`, generated PNG icons, `public/sw.js`, `PWAUpdateManager` and `DeviceEnvironmentProvider` make up the PWA layer. The service worker does not cache API/auth responses and uses network-first navigation with offline fallback.

## Azure

Production targets Azure App Service. GitHub Actions builds a Next.js standalone artifact and authenticates to Azure through OIDC/federated credentials.
