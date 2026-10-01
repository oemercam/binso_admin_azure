# Binso One v1.7.3

## Mobile/PWA architecture cleanup

- Keeps the v1.7.2 visual mockup-parity baseline and Desktop >= 761 px unchanged.
- Removes legacy authenticated Mobile/PWA shell geometry from `styles/shell.css`.
- Makes `styles/mobile-pwa.css` the single owner of authenticated Mobile/PWA shell layout, header suppression, bottom navigation runtime geometry, Quick Create and profile sizing.
- Preserves the floating five-item navigation: Start, Kunden, Neu, Zeit, Profil.
- Preserves exact white/black authenticated Mobile/PWA surfaces and flat divider-based hierarchy.
- Preserves current roles, permissions, tenant isolation, API guards and database lineage.
- No database migration added.

## Quality status in the release workspace

PASS:
- Mobile/PWA final contract self-check
- Mobile/PWA master audit self-check
- Mobile/PWA route matrix self-check: 69 workspace pages
- Mobile/PWA i18n/hardcode self-check: 209 TSX surfaces
- Navigation architecture self-check
- Mobile navigation sheet self-check
- UI consistency self-check
- Release self-check

NOT EXECUTED in the isolated build environment:
- `pnpm install --frozen-lockfile`
- `pnpm test`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm audit --audit-level high`
- `pnpm db:check`
- `pnpm build`

Direct Node execution completed 30 of 31 test-script commands successfully. `permission-selfcheck.mjs` could not start because it imports the project `typescript` package, which is unavailable without dependency installation. The environment has Node.js 22 while the project requires Node.js 24, `pnpm` is not preinstalled and external registry access is unavailable. All dependency-backed gates remain mandatory in the supplied PowerShell release workflow before commit/deployment.
