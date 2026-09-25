# Desktop/Web UI audit — V21

## Goal
Desktop/Web is not a stretched mobile layout. It uses the same business components and data, but a different responsive presentation where that improves usability.

## Page canvas
- authenticated pages are bounded to a readable desktop width
- large monitors gain whitespace instead of oversized controls
- headers use a title/content column plus compact action area
- descriptions stay within a readable line length

## Lists and tables
- denser desktop row heights
- compact table headers
- full desktop columns remain visible
- mobile summaries remain mobile-only
- no card shells are reintroduced

## Detail pages
- order/detail hubs use a desktop master-detail layout
- left navigation is sticky
- detail content stays in a readable column
- mobile retains drill-in/fullscreen navigation

## Forms
- long flows: fullscreen on Mobile/PWA, bounded wide dialog on Desktop/Web
- two-column field rhythm on desktop
- full-width fields only where semantically useful
- compact footer buttons rather than full-width 50/50 controls
- scroll remains inside the dialog

## Invoice and quote preview
Desktop:
- large document workspace on the left
- dedicated action rail on the right
- actions are vertical, readable and never duplicated with the mobile menu
- zoom controls stay above the document
- A4 geometry is unchanged

Mobile/PWA:
- fullscreen preview
- compact primary actions at the bottom
- additional actions remain under `Mehr`
- pinch/pan and fit controls remain unchanged

## Settings
- bounded content width
- sticky desktop category tabs
- flat sections, no card shells

## Responsive ownership
Business logic stays shared. Presentation changes through central responsive components/CSS:
- StandardFormSheet
- ResponsiveOverlay
- ResponsivePreview
- app/app-ui.css

No parallel desktop business logic is introduced.
