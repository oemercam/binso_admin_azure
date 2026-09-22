# Binso Admin – Central Architecture Standard v20

## Status

This repository follows a single-owner rule for cross-application behaviour: global concerns are implemented once and consumed by pages. Business pages may contain business-specific content and state, but must not recreate app infrastructure.

## Global owners

| Concern | Owner |
|---|---|
| Application providers | `components/providers/app-providers.tsx` |
| Theme | `components/providers/theme-provider.tsx` |
| Device/environment capability | `components/providers/device-environment-provider.tsx` |
| Network state | `components/providers/network-provider.tsx` |
| App shell | `components/app-shell/app-shell.tsx` |
| Header scroll behaviour | `hooks/use-header-visibility.ts` |
| Responsive overlays | `components/ui/responsive-overlay.tsx` |
| Dialog/bottom/fullscreen sheet mechanics | `components/ui/sheet-system.tsx` |
| Business form sheet wrapper | `components/ui/sheet-system.tsx` → `StandardFormSheet` |
| Document preview shell | `components/documents/responsive-preview.tsx` |
| PWA updates | `components/pwa/pwa-update-manager.tsx` |
| Browser storage | `lib/browser/storage.ts` |
| Browser actions | `lib/browser/actions.ts` |
| HTTP client | `lib/http/api-client.ts` |
| HTTP errors | `lib/http/errors.ts` |
| Server API response/validation helpers | `lib/http/server-api.ts` |
| Authentication parsing | `lib/auth/server.ts` |
| Authentication URLs | `lib/auth/urls.ts` |
| Permissions | `lib/security/permissions.ts` |
| Runtime configuration | `lib/config/env.ts` |
| Responsive JS breakpoints | `lib/ui/breakpoints.ts` |
| Architecture enforcement | `scripts/architecture-check.mjs` |

## Responsive architecture

- CSS and JavaScript use one mobile boundary of 820px / 821px.
- Device model names are not used for primary layout decisions.
- `DeviceEnvironmentProvider` owns capability queries such as pointer, hover, standalone display mode, reduced motion, dark preference and contrast preference.
- Safe areas are global CSS variables (`--safe-top`, `--safe-right`, `--safe-bottom`, `--safe-left`).
- Pages must not introduce their own `matchMedia`, `visualViewport`, user-agent or device-model responsive logic.
- Page scrolling is primary. Overlays own internal scrolling while open.

## Overlay architecture

`ResponsiveOverlay` chooses the presentation policy. `AppSheet` owns mechanics such as portal rendering, backdrop, body scroll lock, Escape handling, focus entry/trap/return and ARIA dialog semantics.

Normal create/edit forms use `StandardFormSheet`. Long/complex document editors may use fullscreen mode. Document previews use `ResponsivePreview` and not page-local overlay shells.

## Theme architecture

`ThemeProvider` owns `system`, `light` and `dark`. The small inline boot script in `app/layout.tsx` is an intentional exception to prevent a flash of the incorrect theme before React hydration. It may read only the theme preference and OS colour scheme.

## Data and browser APIs

- Browser storage access goes through `lib/browser/storage.ts`.
- Application HTTP calls go through `lib/http/api-client.ts`.
- Browser side effects such as print/confirm/download go through `lib/browser/actions.ts`.
- Pages must not introduce direct `fetch()`, storage, `matchMedia`, `visualViewport` or overlay infrastructure.

## PWA

`PWAUpdateManager` registers the service worker, detects a waiting worker, presents an update action and reloads after controller change. The service worker supports `SKIP_WAITING`. Authentication/business mutations must not be statically cached.

## Security baseline

Security headers are centralized in `next.config.ts`. Authentication uses the Azure App Service Easy Auth identity header in production. Permissions are centralized in `lib/security/permissions.ts`. UI hiding is not considered a substitute for server authorization.

## Enforcement

Run:

```bash
npm run check:architecture
npm run audit:e2e
npm run verify:release
```

`check:architecture` rejects reintroduction of known local infrastructure patterns. `audit:e2e` is a static wiring audit, not a browser E2E suite. `verify:release` additionally requires installed project dependencies for the TypeScript step.

## Known structural debt

The historical CSS remains large and contains old override layers. Current authority and breakpoint/safe-area behaviour are centralized, but a deliberate CSS consolidation is still required rather than deleting blocks blindly. The application also still uses a client-side demo business store instead of a production Azure-backed data layer.
