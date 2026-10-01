# Binso One Mobile/PWA App-First Final Implementation

## Scope
Final App-first pass based on v1.6.9 R3. Desktop presentation remains outside the mobile-only `@media (max-width:760px)` contract.

## Implemented
- Authenticated Mobile/PWA shell has no permanent logo/avatar/topbar.
- Floating pill is `Start · Kunden · Neu · Zeit · Profil`.
- Profile opens a content-driven bottom sheet; competing More navigation was removed from the shell.
- Quick Create remains a content-driven bottom sheet.
- Dashboard exposes the complete permission-aware business module map on Mobile without adding every module to the pill.
- Original Binso logo/icon assets remain canonical under `public/brand` and are retained for login/public/desktop surfaces.
- Mobile Light/Dark remains strict white/black in the canonical mobile layer.
- Mobile list/detail/create/edit families remain centralized across the 69 workspace routes.
- Quote/invoice guided mobile flow, progressive entity forms, compact detail hierarchy, local search/filter/sort, top toasts, safe areas, persistent server timer and active timer indicator remain part of the v1.6.9 baseline.
- Binary notification settings and billable time state use Switch/Toggle rather than checkboxes. Legal consent remains a checkbox because it is a consent selection.
- New labels `Profil` and `Bereiche` are covered in DE/EN/FR/IT/TR.
- Legacy self-check contracts were updated where the old `Mehr`/header architecture was intentionally superseded by the final App-first contract.

## Verification performed in this environment
- Mobile/PWA route matrix: PASS — 69 workspace pages inventoried.
- Mobile/PWA i18n/hardcode scan: PASS — 210 TSX surfaces.
- i18n completeness: PASS — 1263 visible/dynamic keys DE/EN/FR/IT/TR.
- All static selfchecks that do not require the TypeScript npm package: PASS.

## Not executable in this environment
`pnpm install`, full `pnpm test`, lint, typecheck and build cannot be executed here because pnpm/dependencies are not installed and outbound registry access is unavailable. Tests importing the `typescript` package therefore cannot execute here. The release PowerShell gate must execute these locally before commit/push/deployment.

## Database
No new database migration. This release is presentation/interaction architecture only.

## Desktop freeze
Changes to the visual system are scoped to the canonical Mobile/PWA stylesheet under the mobile breakpoint. Shared shell markup was changed to remove the authenticated mobile header and replace the mobile More item, while desktop sidebar/search/account paths remain present. Full desktop visual regression requires the local browser test environment and is therefore NOT EXECUTED here.
