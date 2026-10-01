# Binso One v1.7.4 — CI cleanup and release identity

## Implementiert

- Nicht verwendete `shell`-Variable in `scripts/rendering-selfcheck.mjs` entfernt.
- Release-Version auf 1.7.4 aktualisiert.
- `lib/site-config.ts`, Release-Check und kanonische Mobile/PWA-Release-Markierung auf 1.7.4 synchronisiert.
- Keine Desktop-Änderung.
- Keine Datenbankänderung.

## Verifikation

Die dependency-freien Selfchecks wurden nach der Änderung erneut ausgeführt. Dependency-basierte Gates werden im vollständigen lokalen/CI-Release-Gate ausgeführt.
