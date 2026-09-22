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

`components/ui/form-controls.tsx` provides canonical `Input`, `Textarea`, `SearchField`, `Checkbox`, `Select`, `DatePicker` and `FormField`. Select uses a controlled popover on desktop and the existing responsive overlay architecture on mobile/PWA; large datasets can opt into search. DatePicker displays Swiss dates (`DD.MM.YYYY`) while preserving ISO values internally. Business pages do not create parallel form-control geometry.

## App identity

`lib/config/app-identity.ts` is the identity/config source. `AppLogo` owns application branding. Canonical source assets are `public/brand/logo-black.svg` and `public/brand/icon-black.svg`; PNG derivatives are generated for platform install surfaces.

## Data and auth

HTTP behaviour is centralized under `lib/http/`. Authentication logic is centralized under `lib/auth/`. The current demo business store persists locally; `database/schema.sql` documents the PostgreSQL target schema.

## PWA

`app/manifest.ts`, generated PNG icons, `public/sw.js`, `PWAUpdateManager` and `DeviceEnvironmentProvider` make up the PWA layer. The service worker does not cache API/auth responses and uses network-first navigation with offline fallback.

## Azure

Production targets Azure App Service. GitHub Actions builds a Next.js standalone artifact and authenticates to Azure through OIDC/federated credentials.

## Business flow

Customer records support a lightweight `prospect` state so quotes can be drafted before full master data is required. Accepted quote conversion reuses the same customer record and activates the prospect when an order is created. Contextual actions pass known order/customer context into time and invoice creation instead of asking for it again.

## Scroll ownership

Normal application scrolling has one primary page owner. `DeviceEnvironmentProvider` keeps stable environment state in React while high-frequency visual viewport offsets are written through lightweight CSS-variable updates. Overlays use `OverlayManager` for background locking and AppSheet content remains the only scroll region inside a sheet.
