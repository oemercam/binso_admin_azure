# Binso Admin v10 – Release Validation

Vor dem Verpacken wurden folgende Prüfungen durchgeführt:

- 53 statische E2E-Verdrahtungsprüfungen erfolgreich
- 58 TypeScript/TSX-Produktivdateien syntaktisch geprüft
- lokale Imports auf vorhandene Dateien geprüft
- benannte lokale Imports gegen vorhandene Exporte geprüft
- QA-Shims vollständig aus dem Release entfernt
- `qa` aus dem Produktiv-`tsconfig` ausgeschlossen
- GitHub Actions führt künftig vor jedem Next.js-Build `npm run verify:release` aus
- `verify:release` führt E2E-Audit, Release-Strukturprüfung und `tsc --noEmit` aus

Hinweis: `package-lock.json` ist absichtlich nicht im Paket. Die bestehende, funktionierende Datei im GitHub-Repository muss erhalten bleiben. Der echte Next.js-Build läuft nach dem Upload in GitHub Actions mit dieser Lock-Datei.
