# QA v0.6.2

Behoben aus der lokalen `pnpm lint` / `pnpm typecheck` Ausgabe:

- `components/business-document-editor.tsx`
  - unbenutzte Variable `backHref` entfernt bzw. direkte Navigation verwendet.

- `lib/i18n.ts`
  - doppelte Objekt-Keys entfernt:
    - `Preis`
    - `Gültig bis` in Englisch
    - `Gültig bis` in Französisch
    - `Gültig bis` in Italienisch
