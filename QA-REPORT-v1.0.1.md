# QA v1.0.1

Behoben aus lokalem v1.0.0 Check:

- `components/business-document-editor.tsx`
  - `useRouter()` ergänzt.
  - fehlende `router`-Variable behoben.
  - Permission-Guard verwendet stabile `canModule`-Dependency.

- `components/entity-form.tsx`
  - Permission-Guard verwendet stabile `canModule`-Dependency.

- `lib/client/use-permissions.ts`
  - `can()` und `canModule()` mit `useCallback` stabilisiert.
  - verhindert unnötige Hook-Abhängigkeitswarnungen.
  - Berechtigungsprüfung bleibt rollenabhängig und aktualisiert sich bei Rollenwechsel.

Erwartung:
- `pnpm permissions:test` grün.
- `pnpm lint` ohne die beiden `react-hooks/exhaustive-deps` Warnungen.
- `pnpm typecheck` ohne `router` TS2304.
- anschliessend `pnpm build`.
