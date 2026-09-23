# Mobile/PWA consolidation — V38

V38 replaces the accumulated page-level mobile patches with one canonical presentation layer.

## Single ownership

The canonical Mobile/PWA layer now owns:

- page gutters and page start
- page header title/description/action geometry
- master/list page rows
- mobile-only row summaries
- three-value KPI layouts
- four-value KPI layouts
- time summary layout
- dashboard focus area
- customer detail mobile overview
- first-content spacing

Overlay, navigation, document preview and full-screen editor mechanics remain in their dedicated shared systems and were intentionally not folded into the page-presentation layer.

## Removed duplication

Legacy rules for the canonical selectors were removed from older Mobile/PWA media blocks. Historical V23/V25/V30/V34/V35/V36/V37 patch sections were removed because their intended behaviour is now represented once in V38.

## Guard

`scripts/check-mobile-ui.mjs` prevents a second canonical mobile page layer from being introduced. Run:

`npm run mobile-ui:check`

The normal `npm run verify` command now includes this check.

## Rule for future changes

Do not add page-specific Mobile/PWA geometry for shared components. Change the shared component or the V38 canonical layer.
