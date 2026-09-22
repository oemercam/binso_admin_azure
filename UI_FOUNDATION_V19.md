# Binso Admin v19 – UI Foundation Cleanup

Dieser Stand konsolidiert die historische UI-CSS-Kaskade in eine einzige Foundation.

## Regeln
- `app/globals.css`: Basis-Tokens und bestehende Kernstile.
- `app/documents.css`: A4-/Dokumentdarstellung.
- `app/ui-foundation-v19.css`: einzige responsive/UX Foundation.
- Keine versionierten Patch-CSS-Dateien mehr im Layout.
- Das Binso-Logo besteht aus genau einem IMG; Dark Mode nutzt einen Filter.
- Toggle, Close-Button, Sheets, Mobile-Gutter und Mobile-Navigation haben je eine kanonische Geometrie.
- Neue UI-Korrekturen werden nicht mehr als zusätzliche Versions-CSS-Dateien angelegt.
