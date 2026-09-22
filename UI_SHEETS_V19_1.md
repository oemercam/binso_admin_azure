# UI Sheets v19.1

## Standard

- Long create/edit tasks on Mobile/PWA are **fullscreen editors**, not bottom sheets.
- Short actions are **bottom sheets** anchored to the lower screen edge.
- Fullscreen editors cover the complete visible viewport, use a sticky header and sticky action footer, and respect iOS safe areas.
- Bottom sheets use a dimmed backdrop, rounded top corners and safe-area-aware actions.
- The global mobile pill is hidden while any sheet/editor is open.

This compatibility bridge also normalises older `form-sheet` markup until every feature page is migrated to `AppSheet`.
