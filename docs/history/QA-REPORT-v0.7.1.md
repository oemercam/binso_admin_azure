# QA v0.7.1

Behoben aus lokaler `pnpm lint` Ausgabe:

- `components/entity-form.tsx`
  - unbenutzte Variable `d` entfernt.

- `components/relationship-picker.tsx`
  - unnötige `open`-Dependency aus `useMemo` entfernt.

Erwartung:
- `pnpm lint` ohne Warnungen.
- `pnpm typecheck` weiterhin grün.
