# V79 – Final UX, PWA and architecture foundation

V79 consolidates the public site, authenticated customer app and operator area without introducing a new visual language inside the existing customer application.

## UI and responsive ownership

The legacy styles remain for compatibility, while `app/standardized-ui.css` is loaded last as the canonical ownership layer. It imports centralized tokens and bounded ownership files for base geometry, authenticated app layout, public pages, pricing, forms, data/list overflow and overlays.

Key rules:
- fluid typography and shared spacing/radius/z-index tokens,
- safe-area-aware mobile geometry,
- minimum 44 px interactive targets,
- one mathematically centred mobile pill,
- no viewport-wide horizontal overflow in public or authenticated routes,
- forms, lists, tables and sheets keep `min-width: 0` and explicit overflow ownership,
- representative automated viewports from 320 px mobile through 1920 px desktop.

## Navigation and product language

`lib/navigation/routes.ts` is the canonical route map. Public navigation and authenticated app navigation consume it instead of duplicating route strings. Customer-visible product terminology stays in Swiss German and uses the existing business concepts: Kunde, Angebot, Auftrag, Zeiterfassung, Rechnung, Mitarbeitende, Einstellungen and Abonnement.

## Authentication and PWA separation

Customer and Binso operator authentication are intentionally separate:
- public website manifest starts at `/`,
- customer PWA manifest starts at `/post-login` and therefore returns to the customer login when no session exists,
- Binso Admin PWA manifest starts at `/admin-access` and uses the internal Microsoft provider,
- customer login uses the configured customer identity provider,
- operator login uses Microsoft Entra ID.

## Demo and real trial

Registration supports two explicit modes:
- `trial`: a real 14-day customer workspace,
- `demo`: an isolated seeded demo workspace for 24 hours.

Demo organizations are marked with `is_demo=true`. Demo access centrally blocks billing and external lifecycle/support actions, does not contribute to business metrics, and expires to a blocked state. Demo data is fictitious and seeded through the shared demo-workspace service.

## Central application contracts

V79 introduces or strengthens these shared layers:
- `lib/config/product.ts`: product limits and durations,
- `lib/config/public-env.ts` / `lib/config/server-env.ts`: environment access,
- `lib/validation/common.ts`: normalization and shared validation,
- `lib/http/server-api.ts`: bounded request parsing and standard response envelope,
- `lib/http/api-client.ts`: browser request timeouts, GET retry, error/correlation handling and JSON body helper,
- `lib/http/errors.ts`: canonical client error model,
- `lib/status/presentation.ts`: one status label/tone source,
- `lib/format/locale.ts`: Swiss date, number and CHF formatting,
- `lib/logging/server.ts`: structured PII-conscious server logging,
- `lib/auth/platform-permissions.ts`: centralized operator permission groups,
- `lib/auth/access-policy.ts`: tenant/plan/demo authorization policy.

Ordinary customer and operator UI requests use `apiRequest` rather than repeating raw `fetch` and error parsing. Special persistence/provider integrations keep their purpose-built request handling where required.

## API consistency

API routes use the central server helper for JSON responses and bounded JSON bodies. Error responses have a stable envelope with code/message and correlation ID. Body-size and rate-limit constants are held in product configuration instead of being repeated as magic numbers.

## Status and feedback consistency

Reusable `StatusBadge` derives labels and semantic tones from `lib/status/presentation.ts`. Save/error actions use the existing feedback provider, avoiding silent failures on standardized screens.

## Regression checks

`scripts/check-v79-foundation.mjs` verifies the architecture contracts above. `tests/e2e/responsive-robustness.spec.ts` verifies public and authenticated routes at representative phone, tablet, desktop and wide-desktop viewports and checks the mobile pill centre mathematically.

### V79.6 responsive hardening
Tablet widths now keep swipe-pricing containers within their parent width and collapse the five-part public footer before its intrinsic minimum columns can exceed the viewport. The 720 px single-column footer remains unchanged.

## V79.7 authentication presentation hardening
- Customer login and Binso admin login now share one canonical `app/styles/auth.css` presentation layer loaded after legacy UI CSS.
- Desktop keeps the split brand/login composition; mobile collapses to one clean login surface with safe-area aware spacing.
- The login cards no longer inherit the legacy boxed `v78-login-card` presentation.
- Responsive E2E coverage now validates `/sign-in` and `/admin-access` at phone, tablet and desktop widths.


## V80.1 mobile public navigation hardening
The V80 mobile navigation now uses the rendered `aria-hidden` state as the CSS source of truth for visibility. This removes transition/visibility race conditions in Chromium, keeps the full-screen mobile menu deterministic, and preserves body scroll locking while the menu is open.
