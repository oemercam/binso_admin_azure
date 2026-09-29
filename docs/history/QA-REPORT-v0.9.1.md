# QA v0.9.1

Behoben aus lokaler `pnpm lint` Ausgabe:

- `app/api/records/route.ts`
  - lokale Variable `module` in `moduleKey` umbenannt.
  - damit kein Konflikt mit Next.js `no-assign-module-variable`.

- `components/shell.tsx`
  - unbenutzte Imports `saveAppPreferences`, `saveSettings` und `notify` entfernt.

- `lib/server/db.ts`
  - unbenutzte ESLint-disable-Direktive entfernt.

Erwartung:
- `pnpm lint` ohne diese 6 Meldungen.
- `pnpm typecheck` unverändert.
- danach `pnpm build`.
