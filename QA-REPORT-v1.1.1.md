# QA v1.1.1

Behoben aus dem lokalen v1.1.0 Prüflauf:

- Permission-Guard-Abhängigkeiten in Dokumenteditor und Formularen korrigiert.
- `onboarding-checklist.tsx`: keine synchrone `setState()`-Ausführung mehr direkt im Effect.
- `support-detail.tsx`: Loader mit `useCallback` stabilisiert und Effect sauber gemacht.
- `brand-logo.tsx`: natives `<img>` durch `next/image` ersetzt.

Erwarteter Prüflauf:
- `pnpm permissions:test`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
