# Binso One v1.7.1 – Pre-deployment cleanup

## Completed in source
- Removed dead legacy mobile navigation component.
- Removed corresponding unused legacy navigation CSS.
- Corrected stale release-check version contract from 1.6.9 to 1.7.1.
- Updated mobile visual guard to validate the current floating pill and reject legacy navigation CSS.
- Added current release/audit/navigation/visual-QA documents.
- No new database migration.

## Verification in assistant environment
Static Node selfchecks that do not require installed npm dependencies are executed separately. Full lint, typecheck, build, browser E2E and visual regression require the normal project dependency/runtime environment and must not be marked PASS unless actually run.
