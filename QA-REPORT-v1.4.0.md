# Binso One v1.4.0 – UI Foundation Cleanup QA

## Scope

This release consolidates the presentation layer after the v1.3.x mobile/PWA iterations. The goal is to remove layered CSS patches, standardize overlays and safe areas, and make future UI work occur in central primitives instead of version-specific override files.

## Completed

- CSS entrypoints reduced to four active files: `tokens.css`, `app.css`, `responsive-central.css`, `overlays.css`.
- Removed obsolete active CSS layers from v1.3.x and the old legacy/design-system/responsive entrypoints.
- Rebuilt overlays around one portal-based `ResponsiveOverlay` component with scroll lock, focus handling, ESC/backdrop close, safe areas, fixed header/body/footer geometry and equal mobile action widths.
- Migrated search, more navigation, confirmation, privacy, document preview/send, payroll and edit overlays to the shared overlay component.
- Removed legacy overlay markup classes from current React components.
- Fixed mobile pricing carousel centering so it never scrolls the page vertically; active indicator follows the swiped plan.
- Removed the full-page marketing reveal and route-level forced scroll reset.
- Centralized mobile/PWA page gutters, fixed header offset, bottom navigation spacing and safe-area handling.
- Improved explicit i18n usage on shared shell/navigation and auth security pages. The legacy DOM translation bridge remains temporarily for legacy screens not yet migrated to explicit translation calls.
- Service-worker cache generation bumped to `v8`.
- Architecture/release/overlay self-checks strengthened to reject obsolete CSS layers and legacy overlay markup.

## Static validation performed in the cleanup workspace

- TypeScript/TSX syntax parse: passed.
- CSS parser validation for all four active stylesheets: passed with zero parser errors.
- Architecture self-check: passed.
- Overlay self-check: passed.
- Production self-check: passed.
- Plan/demo self-check: passed.
- Release self-check: passed for v1.4.0.

## Validation required after installation

The cleanup workspace does not contain project `node_modules` or `pnpm`, therefore the authoritative project pipeline must still run on the developer machine before commit/deployment:

- `pnpm install --frozen-lockfile`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm release:check`
- `pnpm build`

Mobile/PWA visual QA should cover at least 320, 375, 390, 430 and 768 px, installed iOS/Android PWA safe areas, keyboard-open forms, dark/light mode and every shared overlay.
