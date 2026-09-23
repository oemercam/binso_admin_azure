# Page spacing and customer overview — V32

## Horizontal page spacing
The application shell is the single owner of horizontal page spacing.

On Mobile/PWA:
- the topbar/logo uses `--app-mobile-gutter`
- `.app-main` uses the same gutter
- individual pages use no additional left/right padding

This prevents double insets such as 16 px app-main + 16 px page padding.

## Customer list
The mobile customer list shows only:
- customer number/name
- contact person
- city

Payment terms and status are not repeated in the mobile list summary.

## Customer detail overview
The general customer overview shows customer master data only:
- customer number
- contact person
- email
- phone
- address

Payment term, status and open amount were removed from this general overview because they belong to commercial/process context rather than the basic customer summary.
