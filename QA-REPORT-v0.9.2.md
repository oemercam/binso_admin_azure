# QA v0.9.2

Behoben aus lokaler `pnpm typecheck` / `pnpm build` Ausgabe:

- `lib/server/logger.ts`
  - Rückgabewert von `redact(context)` wird vor dem Object-Spread explizit als `Record<string, unknown>` typisiert.
  - Damit ist der Spread für TypeScript eindeutig ein Objekt und `TS2698` entfällt.

Erwartung:
- `pnpm lint` weiterhin grün.
- `pnpm typecheck` ohne den Logger-Fehler.
- `pnpm build` kann danach die nächste echte Build-Stufe prüfen.
