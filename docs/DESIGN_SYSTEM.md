# Design system

## Foundations

`app/globals.css` contains base theme tokens and legacy-neutral page structures. `app/app-ui.css` is the current responsibility-based application UI stylesheet. Version-numbered active stylesheets are not used.

The canonical mobile gutter is `--app-mobile-gutter: clamp(14px, 4vw, 18px)`. The same token is used by the mobile topbar, page content, navigation and mobile AppSheet content.

## Typography and fields

- Field label: 13px / medium
- Field value: 14px / regular
- Placeholder: 13px
- Help/error: 12px
- Standard control height: 40px
- Textarea minimum: 88px

`Input`, `Textarea`, `SearchField`, `Select` and `DatePicker` share border, radius, background, focus and disabled states. `Checkbox` is a separate compact control with a touch-friendly target. Controls always use `width:100%`, `max-width:100%`, `min-width:0` and border-box sizing.

## Navigation

Mobile navigation rows are 48px high with 17px icons, a compact icon column, 9px icon/label gap and 15px chevrons. Selected state is deliberately subtle. Mobile/PWA menus are content-sized until the visual viewport max-height is reached.

## Header

The topbar uses one semantic `--header-background`, no blur and no opacity effect. Mobile/PWA content height is 56px plus the safe-area top. The wordmark is optically 26px high. `useHeaderVisibility` is the only scroll visibility behaviour.

## Sheets and actions

AppSheet is flex-column with header/content/footer. Only content scrolls. Mobile sheet gutters use the canonical application gutter. Standard action footers keep two actions side by side, secondary on the left and primary/destructive on the right.

## Switches

The canonical Toggle is visually 36×20px with a 14px thumb. The surrounding settings row provides the larger touch target. Semantic switch tokens keep OFF and ON states visible in Light and Dark themes.

## Feedback

`FeedbackProvider` owns success/info/warning/error toasts. `ConfirmationDialog` owns destructive/discard confirmation. Business pages do not create competing toast or confirmation layouts.

## Close / Back / Remove

- `CloseButton`: closes temporary surfaces
- `BackButton`: previous route or workflow step
- `RemoveButton`: removes a row/item

These controls are not interchangeable.

## Search and status

`SearchField` is the single visual search primitive for global search, list search and searchable selections. The Mobile/PWA pill only opens the shared global search surface. `StatusBadge` maps business states centrally: green is reserved for successful/completed states, blue for active/in-progress states, amber for attention/intermediate states, red for problems/rejections/overdue states and grey for neutral/draft/inactive states.

## Date and selection controls

`DatePicker` uses `DD.MM.YYYY` in the visible Swiss UI and keeps ISO values for application data. `Select` owns keyboard/listbox behaviour and can become searchable for large datasets. Small fixed-option selects remain simple.
