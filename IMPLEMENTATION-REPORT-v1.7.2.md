# Binso One v1.7.2 — Mobile/PWA Mockup Parity

## Scope
Full-project successor to v1.7.1. The release applies the approved App-first Mobile/PWA visual contract centrally to the authenticated workspace while keeping desktop rules outside the <=760px contract unchanged.

## Root cause fixed
`app/globals.css` previously contained additional CSS after the `mobile-pwa.css` import. Those later rules could override the canonical Mobile/PWA layer. `app/globals.css` is now import-only and `mobile-pwa.css` is the final stylesheet in the cascade. Existing global rules were consolidated into the earlier `app.css` layer.

## Implemented
- Floating pill navigation: Start / Kunden / Neu / Zeit / Profil.
- No permanent authenticated mobile logo/header/avatar.
- Compact page headings and icon-first contextual actions.
- Flat two-line lists with dividers instead of record cards.
- Flat detail hierarchy, progressive additional fields and contextual workflow actions.
- Single-column progressive create/edit forms with mobile-safe controls.
- Content-driven bottom sheets for Quick Create, profile and short action surfaces.
- Dashboard, settings, support, documents and time tracking aligned to the same mobile visual system.
- Strict white/black light mode and black/white dark mode; muted greys limited to text/borders.
- Safe-area, short-height and 375–430px viewport contracts.
- Production deployment verification now checks HTTP 200 + status=ok + package version + 12-character Git SHA, so an old Azure worker cannot create a false-green deployment.
- No database migration.

## Verification in artifact build environment
PASS: release:check.
PASS: architecture, UI consistency, rendering, content, i18n/mobile, UI standards, hardcoding, runtime boundary, trial/demo, overlay, mobile portal visual, responsive layout, document preview, customer portal branding/activity, portal workflow, search effect, theme/i18n, i18n completeness, UI interaction, productivity UX, mobile/PWA standard, full audit, navigation architecture, mobile navigation, master audit, final contract, route matrix and i18n/hardcode self-checks.
PASS: 69 workspace routes remain covered by the route matrix self-check.
PASS: 209 TSX surfaces remain covered by the Mobile/PWA i18n/hardcode self-check.
NOT EXECUTED here: pnpm lint, pnpm typecheck, pnpm build and browser screenshot regression because the source artifact intentionally contains no node_modules and this isolated artifact environment has no dependency install step. The provided local release procedure executes those gates before Git push.
