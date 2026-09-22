# Architecture

## Application shell and routing

`AppShell` owns the authenticated application frame: canonical topbar, `DesktopNav`, shared `MobilePillNav`, global overlays and page content. Mobile browser and installed PWA use the same component tree. Route groups remain thin and business-page concerns stay outside the shell.

Authenticated app routes use server-side session checks. Role-sensitive route groups additionally use `requireRole()` so navigation visibility is not treated as a security boundary. Shared role capabilities live in `lib/auth/capabilities.ts`; pages should consume those helpers instead of duplicating role expressions.

## Navigation

`components/navigation/nav-items.ts` is the only navigation data source. `navForRole()` filters `owner`, `admin`, `finance` and `employee`. `DesktopNav` and `MobilePillNav` both consume that result. `NavigationItem` owns row geometry and active/focus states.

## Providers and viewport state

`AppProviders` composes Theme, Device Environment, Network and Feedback providers plus PWA update handling. Browser viewport APIs belong to `DeviceEnvironmentProvider`; pages must not install competing listeners.

Stable environment data is kept in React context. High-frequency `visualViewport.scroll` changes update CSS viewport tokens only and do not trigger broad context rerenders. Normal window scrolling is distributed through one shared passive, requestAnimationFrame-throttled observer in `lib/browser/window-scroll.ts`; header visibility and scroll restoration subscribe to it instead of installing competing window listeners.

## Scroll and overlays

Normal application pages scroll through the document/window. App pages do not introduce a second normal vertical page scroller.

`ResponsiveOverlay`, `AppSheet`, `StandardFormSheet` and `ResponsivePreview` share `OverlayManager`. The manager owns Escape handling, focus return/trapping and reference-counted background scroll locking, including exact document-scroll restoration. Inside AppSheet only the content region scrolls; header and footer remain outside it.

Safe-area ownership is explicit: the shell/header owns the top inset, page/sheet content owns the canonical horizontal gutter, and mobile sheet footers own the bottom inset.

## Forms and reusable UI

`components/ui/form-controls.tsx` provides canonical `Input`, `Textarea`, `SearchField`, `Checkbox`, `Select`, `DatePicker` and `FormField` controls. `Select` uses a controlled desktop listbox and the shared responsive overlay architecture on mobile/PWA. Large datasets can opt into search. DatePicker shows Swiss dates (`DD.MM.YYYY`) while keeping ISO values internally.

`StatusBadge` owns business-status labels and semantic tones. Pages must not define their own status-colour systems. `EmptyState`, semantic interactive rows and the canonical close/back/remove controls provide shared interaction patterns.

## Domain logic

Reusable business rules live under `modules/` rather than in page JSX. Current examples include:

- order metrics and labels
- invoice and quote calculations
- document numbering
- time-entry eligibility
- dashboard financial trend calculations

Visible currency, date, month and duration formatting is centralized in `lib/format/locale.ts`.

Quote-to-order conversion uses `Order.sourceQuoteId` as the canonical source relation instead of matching by title/customer.

## Current business data layer

The current application still uses `BusinessStoreProvider` as a browser-backed reference/demo data layer. Persistence is versioned and user-specific, employee sessions receive a minimized scoped dataset, and browser persistence writes are coalesced instead of synchronously writing after every individual state change. This is useful for the current application/reference build but is **not** the final multi-user production persistence/security boundary.

`database/schema.sql` documents the current PostgreSQL target model, including quote/order relations, recipient fields, order policies, assignment rules and time evidence. A production migration must move business mutations and authorization to a server/database-backed data layer before the browser store is treated as durable multi-user production storage.

## External integration boundaries

The current reference build does not pretend that unavailable integrations are active. Quote and invoice actions can record recipient and sent/reminder status, but actual Microsoft Graph delivery is not connected. Time-evidence capture currently records file metadata and verification state; binary document storage must be connected to durable Azure/blob storage before it is treated as an uploaded document. Push subscription creation reports the server capability and remains disabled until durable subscription persistence exists.

## Authentication and authorization

Azure App Service authentication is parsed centrally in `lib/auth/server.ts`. Local development may use the configured local auth mode. Production always resolves to Azure authentication even if `AUTH_MODE=local` is accidentally supplied. Protected data/actions must ultimately be enforced in the production server/data layer as well as through route guards; client-side role checks exist for UX, not as the sole security control.

## App identity and PWA

`lib/config/app-identity.ts` is the identity/config source. `AppLogo` owns application branding. Canonical source assets are `public/brand/logo-black.svg` and `public/brand/icon-black.svg`; PNG derivatives are used for install surfaces.

`app/manifest.ts`, platform icons, `public/sw.js`, `PWAUpdateManager` and `DeviceEnvironmentProvider` make up the PWA layer. The service worker does not cache API/auth responses and never serves stale Next.js JS/CSS cache-first. New service workers wait until the user explicitly selects **Jetzt aktualisieren**; an installation must not reload an active form/session automatically. Push notification navigation is restricted to same-origin application paths.

## Architecture guardrails

`scripts/check-architecture.mjs` prevents important regressions such as parallel navigation sources, page-level viewport listeners, page-specific document scroll locks, raw business form controls, duplicate mobile gutters, non-central locale formatting, forced service-worker activation, unsafe production local-auth bypasses and false push-persistence acknowledgements. `scripts/test-core.mjs` adds lightweight executable regression checks for numbering, invoice totals, order metrics, role capabilities and selected PWA/security invariants.
