# Mobile/PWA UI audit — V23

## Canonical list-page pattern

`Mitarbeitende` is the reference layout for mobile master-data/list pages.

The same pattern is now applied to:
- Kunden
- Mitarbeitende
- Verträge
- Angebote
- Aufträge
- Rechnungen

## Rules

### Header
- same side gutter
- same title scale
- description directly below title
- same page-primary-action geometry
- maximum two lines for title/description where applicable

### List
- no card shell
- no table header on mobile
- one primary title
- one compact mobile summary
- chevron on the right
- one subtle separator between rows
- no grey active/pressed background
- minimum touch-friendly row height

### Desktop-only supplemental content
Desktop KPI blocks that would make a mobile master-data page structurally different are hidden on mobile when they are not required to perform the primary task. Contract KPIs remain on Web/Desktop but no longer interrupt the mobile contract list.

### Forms
Form presentation is not forced to be identical:
- short forms may use a bottom sheet
- long business workflows use fullscreen on Mobile/PWA
- Desktop uses bounded dialogs
The business controls and styling remain canonical.

### Functional pages
Dashboard, Finanzen, Buchhaltung, Zeiterfassung and Einstellungen keep specialised content because their purpose differs from a master-data list. They still inherit the same mobile page typography, gutters, touch sizes and flat visual system.
