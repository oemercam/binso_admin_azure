# Binso One v1.7.3 — Mobile/PWA canonical shell ownership

## Implemented

- Removed obsolete authenticated Mobile/PWA shell geometry from `styles/shell.css`.
- Centralized authenticated <=760 px shell ownership in `styles/mobile-pwa.css`.
- Kept desktop styling and desktop component structure unchanged.
- Kept Quick Create, Profile bottom sheet, floating navigation, safe-area handling and mobile account actions intact.
- Updated application/release version to 1.7.3.
- No database schema change and no migration.

## Verification

30 of 31 individual static test commands pass when run directly with Node. `permission-selfcheck.mjs` requires the project `typescript` dependency and could not start without installed dependencies. Full dependency-backed test/lint/typecheck/audit/build and browser screenshot regression are marked NOT EXECUTED in this sandbox and are included in the release PowerShell gate.
