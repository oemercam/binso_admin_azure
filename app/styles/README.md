# Binso One UI styles

The runtime CSS is intentionally limited to six files, imported by `app/binso-ui.css` in this order:

1. `tokens.css` — colours, spacing, radii, layout constants and safe-area variables.
2. `base.css` — reset, typography, controls and cross-product primitives.
3. `marketing.css` — public marketing, auth, portal entry and demo onboarding.
4. `app.css` — authenticated customer application components.
5. `operator.css` — internal operator workspace.
6. `responsive.css` — the only place for responsive layout rules.

Rules:

- Do not add page-local CSS files.
- Do not use `!important`.
- Do not call `env(safe-area-inset-*)` outside `tokens.css`.
- Do not add responsive `@media` rules outside `tokens.css` and `responsive.css`.
- Use design tokens instead of duplicating colours, gutters, header heights or safe-area formulas.
- Mobile layout is viewport-driven, not device-name-driven.
- Browser mode and installed PWA mode differ only through the safe-area tokens.
- New components must have an explicit selector in the runtime design system; CI checks selector coverage.
