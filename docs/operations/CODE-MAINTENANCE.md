# Code maintenance ownership

## Canonical modules

### Application UI

`app/app-ui.css` is the stable entry point only. The ordered implementation lives in:

1. `app/styles/app-ui/01-foundation.css`
2. `app/styles/app-ui/02-interactions.css`
3. `app/styles/app-ui/03-application.css`
4. `app/styles/app-ui/04-mobile-pwa.css`
5. `app/styles/app-ui/05-public-auth.css`

The import order is part of the visual contract. New rules must be added to the module that owns the concern instead of appending another version block to the entry point.

### Business store

- `business-store.tsx`: React provider and business commands.
- `business-store-types.ts`: public store/state contracts.
- `business-store-state.ts`: tenant state creation, bootstrap and snapshots.
- `business-store-utils.ts`: pure business-store calculations and formatting helpers.

New domain behaviour should move toward dedicated `modules/*` commands instead of increasing the provider again.

### Normalized business repository

- `normalized-business-state.ts`: compatibility facade.
- `normalized-business-state/persist.ts`: writes and lifecycle transition enforcement.
- `normalized-business-state/load.ts`: normalized reads and reconstruction.
- `normalized-business-state/shared.ts`: constrained DB mapping helpers.
- `normalized-business-state/legacy.ts`: strangler cleanup of legacy state.

## Quality commands

- `pnpm run static:check`: current architecture/security/product invariants.
- `pnpm run compatibility:check`: retained historical regression contracts.
- `pnpm run verify`: lint, typecheck, tests, both check suites and production build.
- `pnpm run release:check`: canonical release gate; currently aliases `verify`.

Historical version-specific checks remain available for diagnosis but should not be copied into new CI steps individually.
