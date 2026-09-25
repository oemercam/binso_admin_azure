# Responsive form presentation — V20

## Principle

Web/Desktop and Mobile/PWA do not need to use the same visual container.

### Desktop/Web
Long creation/editing workflows are shown as centred, bounded work dialogs:
- maximum width around 1040–1080 px
- viewport margin remains visible
- content scrolls inside the dialog
- fields do not stretch across the entire monitor
- footer actions use natural button widths
- primary action remains visually clear
- sections use whitespace and separators rather than card shells

### Mobile/PWA
The same long workflows remain fullscreen:
- uses the available visual viewport
- respects safe areas
- sticky header/footer
- full-width touch targets
- internal scrolling
- no desktop-sized dialog inside a small screen

### Short forms
`mode="auto"` continues to use:
- mobile: bottom sheet
- desktop: compact dialog

### Long forms
Existing `mode="fullscreen"` now means:
- mobile/PWA: fullscreen task
- desktop/web: wide centred dialog

This rule applies centrally through `StandardFormSheet`, including contracts,
quotes, invoice editing, settings editors and order policies.
