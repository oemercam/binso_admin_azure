# Binso Admin – Standardization Report v20

## Verification summary

This report distinguishes implemented/verified work from remaining work. The repository was reviewed before finalizing this standardization. Static checks currently pass:

- Architecture check: **20 rules passed**.
- Static E2E wiring audit: **67 checks passed**.
- Release source check: **81 TS/TSX files parsed; local imports and named exports consistent** (run with the available TypeScript parser only).
- Full production install/build/lint/typecheck/browser-E2E/visual-regression are **not verified** because this source archive has no `package-lock.json` and no installed dependencies. The Azure workflow uses `npm ci`, so the lockfile must be restored/generated before a reproducible release can be claimed.

## 1. Repository issues found

The repository already had useful shared primitives, but global behaviour was still duplicated across components/pages. Direct storage calls, direct `fetch()`, independent viewport/theme listeners, page-generated sheet shells, page-generated document preview shells and header-scroll logic were identified. Responsive CSS also retained historical 760/761px breakpoints and missing safe-area variables. The CSS surface is still large: `app/globals.css`, `app/ui-foundation-v19.css` and `app/documents.css` total roughly 7,096 lines.

## 2. Components centralized

Central owners now include `AppProviders`, `ThemeProvider`, `DeviceEnvironmentProvider`, `NetworkProvider`, `ResponsiveOverlay`, `AppSheet`, `StandardFormSheet`, `ResponsivePreview`, `PWAUpdateManager`, `useHeaderVisibility`, browser storage/actions helpers, a central API client, HTTP error mapping, server API helpers, authentication URL helpers and typed environment configuration.

## 3. Components removed

Obsolete `components/ui/viewport-metrics.tsx` and `components/pwa/service-worker-register.tsx` were removed after their responsibilities moved to the centralized providers/PWA update manager. Page-local overlay/form shell infrastructure was migrated to the shared sheet system rather than retained as parallel infrastructure.

## 4. Design system changes

Safe-area variables now include top/right/bottom/left centrally. Responsive JavaScript breakpoints are centralized in `lib/ui/breakpoints.ts`. The existing semantic CSS/token system remains the visual base. Historical duplicate CSS overrides remain technical debt and were not blindly deleted because doing so without visual regression coverage would be unsafe.

## 5. Responsive architecture

The active mobile boundary is standardized at 820px/821px across the CSS files and JavaScript helper. Capability queries are owned by `DeviceEnvironmentProvider`. Pages no longer own device/browser viewport infrastructure. Layout decisions are based on available space/capabilities rather than named device models.

## 6. Desktop behaviour

Desktop continues to use the authenticated AppShell and desktop navigation. Shared overlay mechanics support dialog/fullscreen modes without each page recreating backdrop/focus/scroll behaviour.

## 7. Mobile behaviour

Normal create/edit forms are routed through `StandardFormSheet`; responsive overlays use the centralized overlay system. Safe-area variables, a shared breakpoint and a single scroll-lock/focus implementation prevent the former page-by-page Mobile/PWA divergence. The mobile navigation uses the same responsive overlay owner for its menu.

## 8. PWA behaviour

`PWAUpdateManager` owns service-worker registration/update handling. `public/sw.js` supports `SKIP_WAITING` and a versioned cache. Network state is exposed centrally. A remaining gap is that update activation does not yet coordinate with a global unsaved-form registry before reloading.

## 9. Bottom sheet/dialog architecture

`ResponsiveOverlay` decides presentation. `AppSheet` owns portal rendering, backdrop, body scroll lock, Escape close, focus entry/trapping/restoration and ARIA dialog semantics. `StandardFormSheet` migrates business-specific form content into this infrastructure. Page files no longer generate the legacy `overlay-layer sheet-layer` + `form-sheet` infrastructure themselves.

## 10. Document preview architecture

`ResponsivePreview` is the shared outer preview shell. Quote and invoice pages use it instead of creating page-specific preview overlays. The existing `DocumentPreviewFrame` keeps document sizing/rendering responsibilities but no longer owns global body-scroll locking.

## 11. Theme implementation

`ThemeProvider` supports `system`, `light` and `dark`, persistence and OS preference changes. The root inline theme bootstrap is retained intentionally to avoid a flash of the wrong theme before hydration.

## 12. Header/navigation implementation

The AppShell remains the owner for authenticated shell composition. Header visibility/scroll direction has been moved into `useHeaderVisibility` so page/component code does not create competing scroll listeners. Mobile menu presentation is delegated to `ResponsiveOverlay`.

## 13. Authentication architecture

Authentication is centralized around Azure App Service Easy Auth headers through `lib/auth/server.ts`. Authentication URLs are centralized in `lib/auth/urls.ts`. Production configuration guards against accidentally running the local authentication mode unless explicitly permitted.

## 14. Authorization architecture

Role-to-permission mapping is centralized in `lib/security/permissions.ts`. This establishes a single UI/server permission vocabulary, but full resource-level authorization cannot be considered complete while business records still live in the client-side demo store rather than a real server data layer.

## 15. Logout/session handling

Logout uses the centralized sign-out URL instead of page-local URL construction. Azure Easy Auth remains the session authority. A more advanced session renewal/re-authentication manager is not implemented in this source tree.

## 16. Network/offline strategy

`NetworkProvider` owns online/offline/reconnecting state and `NetworkStatus` provides global feedback. The service worker handles the application shell/cache lifecycle. The repository still needs an explicit per-feature offline capability matrix before offline business data behaviour can be called production-complete.

## 17. Cache strategy

The service worker uses a versioned cache and handles update activation. Sensitive authentication/business mutations are not treated as static cache entries. A documented multi-layer policy covering HTTP cache, query cache, server/database cache and CDN is still required once the production data backend exists.

## 18. Data layer changes

Direct client `fetch()` usage has been consolidated into `lib/http/api-client.ts`; API error mapping and server response helpers are centralized. The major remaining limitation is `components/state/business-store.tsx`, which is still a client-side demo store persisted locally. `lib/storage/repository.ts` is an interface, not an implemented Azure SQL/PostgreSQL repository.

## 19. Security changes

`next.config.ts` centralizes CSP, HSTS, nosniff, frame protection, referrer policy, permissions policy, COOP/CORP and DNS-prefetch policy. Push API input now has centralized JSON/body validation helpers and authentication checks. Remaining security work includes production persistence/validation for push subscriptions, rate limiting, audit-log persistence, secure file storage/scanning, and infrastructure-level Key Vault/Managed Identity integration. CSP still permits `unsafe-inline`, primarily because of the theme bootstrap/Next.js runtime compatibility.

## 20. Accessibility changes

`AppSheet` now has dialog semantics, focus entry, focus trapping, Escape handling and focus return. Shared close actions carry accessible labels. The application must still undergo actual keyboard/screen-reader/200%-zoom/WCAG contrast testing; static code review is not a substitute.

## 21. Performance improvements

Global environment listeners are consolidated instead of being recreated by pages. Large preview/overlay infrastructure is shared. No formal automated performance budget was added in this pass, so bundle/runtime performance must still be measured after dependencies are restored.

## 22. Testing added

`scripts/architecture-check.mjs` enforces the one-owner architecture and rejects known regressions such as direct page storage, `fetch()`, device queries and legacy page-local form overlays. `scripts/e2e-audit.mjs` checks 67 static wiring expectations. `scripts/release-check.mjs` performs source parsing/import/export consistency checks. Browser E2E and visual regression tooling are still missing.

## 23. Build/lint/typecheck results

**Passed:** architecture check (20), static E2E audit (67), source/release parsing check (81 TS/TSX).  
**Not verified:** `npm ci`, production Next.js build, lint, full project TypeScript check, browser E2E and visual regression. The source ZIP does not contain `package-lock.json` or `node_modules`. An offline attempt to create the lockfile could not resolve all packages from cache. Because CI uses `npm ci`, restoring/generating the lockfile online is a release prerequisite.

## 24. Remaining technical debt

- Restore/generate and commit `package-lock.json`.
- Run clean `npm ci`, build, lint and `tsc --noEmit`.
- Add Playwright/Cypress browser E2E and visual regression at the required viewports/PWA mode.
- Consolidate the historical ~7k-line CSS override stack deliberately.
- Replace the local demo business store with a server-backed Azure SQL/PostgreSQL data layer.
- Enforce tenant/resource ownership server-side when multi-tenancy is introduced.
- Persist push subscriptions securely and implement delivery backend.
- Add distributed rate limiting, audit-log persistence and file malware scanning where required.
- Add Bicep, Managed Identity, Key Vault and Application Insights/Azure Monitor infrastructure.
- Add a global notification/toast service if product requirements need it beyond network/PWA banners.
- Add an unsaved-work registry before forced PWA update reload.
- Add formal cache/offline capability matrices, performance budgets, i18n where required, feature flags/billing if introduced.

## 25. Exceptions to the standard and why

1. **Root theme boot script uses `localStorage` and `matchMedia` directly.** This is intentional and narrowly scoped to run before React hydration so the first paint uses the correct theme. Runtime theme logic is centralized in `ThemeProvider`.
2. **Complex document editors may remain fullscreen on mobile.** They are intentionally not forced into a short bottom sheet because document/long-form workflows need more space.
3. **`unsafe-inline` remains in CSP.** The current Next.js/theme bootstrap implementation requires it; tightening this needs a dedicated nonce/hash strategy and full runtime validation.
4. **Historical CSS remains.** Removing large override sections without visual-regression coverage would risk breaking the current application. Authority has been centralized first; deletion should follow automated screenshots.
5. **Azure Easy Auth is deployment-specific.** It is kept because this application is Azure-hosted; no Vercel-specific runtime dependency was introduced.

## Release conclusion

The cross-application UI/runtime architecture is materially more centralized and static architectural checks pass. The repository must **not** yet be described as fully production-verified until dependency reproducibility, build/lint/typecheck, browser E2E, visual regression and the remaining production backend/security infrastructure are completed.
