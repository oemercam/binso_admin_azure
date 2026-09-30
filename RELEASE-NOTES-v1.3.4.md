# Binso One v1.3.4

## Mobile/PWA overlays

- Bottom sheets and modal sheets use one centralized overlay layer in `styles/overlays.css`.
- All mobile/PWA sheets are anchored to the visual viewport with `position: fixed` backdrops and dynamic `100dvh` sizing.
- iOS/Android safe-area top, side and bottom insets are applied consistently.
- Legacy `position:absolute` sheet positioning is overridden centrally to prevent clipped or displaced sheets.
- Sheet content uses contained scrolling and cannot push the page behind the overlay.
- A shared `useOverlayLock` hook prevents background scrolling for search, navigation, confirmation, cookie/privacy, document, payroll and edit overlays.
- Two-action sheet flows use equal-width controls, including Back/Next, Cancel/Save and confirmation actions.
- Sticky action areas remain above the iOS home indicator.
- Filter and relationship pickers are constrained above the fixed mobile navigation and safe area.
- The document preview keeps a dedicated near-full-height sheet layout while using the same viewport/safe-area rules.

## Quality

- Added `overlay-selfcheck.mjs` to the standard test chain.
- Release version updated to 1.3.4.
