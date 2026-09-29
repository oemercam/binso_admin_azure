# QA v0.5.2

Gezielt behoben aus lokalem TypeScript-/Build-Log:

1. `app/layout.tsx`
   - `metadata.title` bleibt als Next.js TitleTemplate erhalten.
   - `appleWebApp.title` ist jetzt ein String (`"Binso One"`), wie vom Typ erwartet.

2. `lib/modules.ts`
   - versehentliches `},,` vor `lieferanten` entfernt.
   - dadurch kein Sparse-Array-/`undefined`-Element mehr in `ModuleConfig[]`.

Statische Prüfungen vor Ausgabe:
- kein `},,` mehr in `lib/modules.ts`
- `appleWebApp.title` ist String
- Paketversion auf 0.5.2 erhöht
