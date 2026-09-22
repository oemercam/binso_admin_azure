# Design system

## Foundations and CSS ownership

`app/globals.css` owns reset/base behaviour and canonical design tokens. `app/app-ui.css` owns application component/layout styling. Active version-numbered stylesheets are not used, and new fixes must modify the canonical rules rather than append another override generation.

The canonical mobile gutter is `--app-mobile-gutter: clamp(14px, 4vw, 18px)`. Safe areas use only `--safe-top`, `--safe-right`, `--safe-bottom` and `--safe-left`.

## Colour and status semantics

The base interface remains neutral. Semantic colour is reserved for meaning:

- green: successful/completed/confirmed
- blue: active/running/informational
- amber: attention/intermediate/risk
- red: error/rejected/overdue/blocking
- grey: draft/inactive/neutral/historical

`StatusBadge` and `statusPresentation()` are the canonical mapping. `active` is informational blue, not success green.

## Typography

- Page title: responsive compact application scale
- Section title: 16px class/token scale where appropriate
- Body/value: 14px
- Field label: 13px / medium
- Placeholder: 13–14px
- Help/error: 12–13px
- Status badge: compact secondary typography

Application pages should not introduce oversized marketing-style headings.

## Fields

Standard controls use the same border, radius, background, focus and disabled language. Normal controls are 40px on desktop and approximately 40–42px on mobile. Controls always protect narrow layouts with `width:100%`, `max-width:100%`, `min-width:0` and border-box sizing.

`Input`, `Textarea`, `SearchField`, `Select` and `DatePicker` form one visual family. `Checkbox` is a separate compact boolean control with a touch-friendly target. `Toggle` is reserved for immediate settings-like boolean state.

## Search

`SearchField` is the single search primitive for global search, list search and searchable selection. The Mobile/PWA pill only opens the shared global search surface. Page search remains domain-local and only appears where finding records adds value.

## Select and DatePicker

`Select` owns listbox keyboard behaviour: arrows, Home/End, Enter/Space and Escape, plus active/selected option semantics. Large dynamic option sets may be searchable; short status/unit lists remain simple.

`DatePicker` displays `DD.MM.YYYY` in the Swiss UI and stores ISO values internally. Desktop uses the Binso calendar popover; mobile/PWA uses the shared responsive overlay architecture.

## Navigation

Mobile navigation rows are compact with a restrained active state: stronger label/icon plus a subtle left indicator instead of a large grey selected block. Hover/pressed motion is short and `prefers-reduced-motion` is respected.

Desktop and Mobile/PWA consume the same navigation model.

## Header and scrolling

The topbar uses one semantic `--header-background`, no blur overlay and no opacity effect over the logo. Header hide/show is transform-only. Mobile/PWA safe areas are part of the shared layout system rather than a separate PWA UI.

## Sheets and actions

AppSheet is flex-column with header/content/footer. Only content scrolls. Mobile sheet content uses the canonical application gutter; the footer owns bottom safe-area spacing. The final content item must remain clearly separated from the footer/home-indicator zone.

Standard action footers keep primary and secondary actions aligned consistently. Close, Back and Remove remain different semantic controls.

## Motion and layering

Shared motion and z-index tokens live in `globals.css`. Component-specific arbitrary z-index escalation should not be introduced. Non-essential motion is disabled under `prefers-reduced-motion`.

## Empty/loading/feedback states

`EmptyState` is the compact canonical empty-state pattern. `FeedbackProvider` owns success/info/warning/error toasts, and `ConfirmationDialog` owns destructive/discard confirmation. Loading UI should preserve final layout dimensions and avoid unnecessary full-page blocking.
