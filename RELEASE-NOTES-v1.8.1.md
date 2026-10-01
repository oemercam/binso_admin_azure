# Binso One v1.8.1

Mobile/PWA mockup completion release on top of v1.8.0.

## Mobile/PWA
- Added standalone PWA splash using the original Binso branding.
- Added a three-step introduction before the existing company onboarding on compact viewports.
- Added centralized mobile loading, empty, error, offline and feedback primitives.
- Module lists now expose explicit loading/error/empty states and a multi-selection mode.
- Search remains inline, filter and sort remain bottom-sheet based, and view switching stays direct.
- Added a dedicated mobile profile/settings menu while preserving existing settings content and permissions.
- Kept the app-first dashboard, module launcher, detail top bars, guided forms, timer states, floating navigation and top-positioned feedback from v1.8.0.
- Extended DE/EN/FR/IT/TR translations for all new visible copy.

## Architecture
- New mobile-only primitives are hidden above the canonical mobile breakpoint.
- No database migration.
- No permission, tenant-isolation, session or API-guard changes.
- Desktop presentation remains frozen.
