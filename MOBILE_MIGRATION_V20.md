# Mobile/PWA migration inventory – v20

The runtime has one mobile owner: `app/ui-foundation-v20.css`.

## Canonical components
- `AppShell`: global shell/header.
- `MobilePillNav`: mobile navigation and contextual create action.
- `AppSheet`: new sheets/dialogs/fullscreen tasks.
- `CloseButton`: all close actions.
- `Toggle`: all binary controls.
- `InteractiveRow`: navigable list rows.
- `SettingsValueRow` / `SettingsToggleRow`: settings progressive disclosure.
- `DocumentPreviewFrame`: A4 document fitting.

## Existing feature markup
Some older feature forms still use `form-sheet` markup. v20 intentionally keeps a **single compatibility contract** in the canonical foundation:
- `.mobile-fullscreen-sheet`, `.document-editor`, `.policy-editor`, `.invoice-builder-sheet` => fullscreen.
- `.bottom-sheet`, `.compact-sheet` => bottom sheet.

No feature page is allowed to define its own mobile geometry.

## Mobile-owned areas
- App header and hide/show behaviour
- page gutters and safe areas
- bottom pill and reserved scroll space
- overview rows
- operational rows / time entries
- settings rows
- forms and toggles
- bottom sheets
- fullscreen editors
- navigation sheet
- document viewer
