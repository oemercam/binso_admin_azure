# V10 UI consistency audit

## Scope

Every current route and sub-route was included in the code-level UI QA pass:

- `/dashboard`
- `/customers`
- `/customers/[id]`
- `/quotes`
- `/orders`
- `/orders/[id]`
- `/contracts`
- `/time`
- `/invoices`
- `/finance`
- `/accounting`
- `/employees`
- `/settings`
- `/sign-in`
- `/offline`
- `/access-denied`
- `/_not-found`
- global error view

## Canonical presentation rules

1. Every authenticated page uses the `page apple-page` root.
2. Route hierarchy uses the shared `PageHeader` pattern.
3. Sections use one grouped/inset surface language.
4. Metrics use one shared grouped presentation.
5. Detail pages use the same header, metric and grouped-navigation language.
6. Primary text, descriptions and row metadata are limited to two visible lines.
7. Buttons, status chips, navigation labels and compact actions remain one line.
8. Rows have a consistent minimum touch/reading height.
9. Interactive controls use at least 44 px touch targets on mobile/PWA.
10. Nested lists do not introduce a second competing card/border system.
11. Mobile/PWA uses the same content hierarchy as desktop; only responsive geometry changes.
12. Very narrow phones stack metrics rather than squeeze text into unreadable columns.

## Two-line policy

Two-line maximum:
- page titles
- page descriptions
- section titles/descriptions
- row titles
- row metadata
- card descriptions
- customer/order/invoice/activity labels

Single line:
- buttons
- status chips
- compact actions
- navigation labels
- KPI labels and values

The rules are centralised in `app/app-ui.css` under the V10 final visual QA layer.


## V12 flat-content rule

Normal page content must not use framed card containers.

Allowed:
- whitespace
- typography hierarchy
- subtle row/column separators
- buttons/inputs as controls
- segmented control in settings
- modal/sheet surfaces
- mobile bottom pill

Not allowed for normal page content:
- card borders around KPI groups
- bordered section boxes
- rounded cards around lists
- nested cards
- shadowed content containers

This rule applies to all authenticated routes and sub-routes through the central `.apple-page` styling layer.
