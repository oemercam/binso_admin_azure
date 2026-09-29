# QA v0.6.1

Gezielt behoben aus der lokalen `pnpm lint`-Ausgabe:

1. `app/loading.tsx`
   - versehentliches literales `\n` am Dateiende entfernt.

2. `components/business-document-editor.tsx`
   - fehlende schliessende Klammer im `onChange` des MWST-Selects ergänzt.

3. `components/client-providers.tsx`
4. `components/toast-host.tsx`
5. `lib/notify.ts`
6. `lib/use-unsaved-changes.ts`
   - versehentliche Zeichen vor `"use client";` entfernt.

7. `components/locale-provider.tsx`
   - `setCurrent(initial)` wird nicht mehr synchron im Effect aufgerufen,
     sondern über einen 0-ms-Timer ausgelöst und beim Cleanup aufgeräumt.

Zusätzliche statische Prüfungen:
- alle betroffenen Dateien beginnen korrekt
- kein literales `\n` mehr in `loading.tsx`
- MWST-Select-Handler ist syntaktisch geschlossen
- Locale-Effect enthält kein direktes `setCurrent(initial)`
