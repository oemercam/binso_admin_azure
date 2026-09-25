# Page vertical rhythm standard — V37

All normal application pages use one shared vertical rhythm.

## Header
- Title margin: 0
- Description starts 6 px below the title
- Description has no own bottom margin
- Desktop gap from header to first content: 20 px
- Mobile/PWA gap from header to first content: 14 px

## First content
The first content component never adds another top margin. This applies to:
- data lists
- KPI strips/grids
- time summary
- toolbars
- settings navigation
- customer quick actions/KPIs
- object hubs
- operational lists

## Responsive hidden blocks
Responsive helper blocks hidden on Mobile/PWA are fully layout-neutral:
- display none
- zero dimensions
- zero margin/padding/border

This specifically prevents pages such as Verträge from getting a different gap between the page description and the first visible record.
