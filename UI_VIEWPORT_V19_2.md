# UI Viewport v19.2

Mobile/PWA sizing is now driven by the actual visible viewport.

- `visualViewport.width/height` are exposed as `--app-vw` / `--app-vh`.
- iOS safe areas are respected on all four edges.
- Page gutters adapt by screen width instead of using one fixed value.
- Fullscreen editors use the visible viewport dimensions.
- Narrow phones use smaller gutters; larger phones get slightly more breathing room.
- Tablet gutters are handled separately.


## V19.3 central correction

- Floating mobile pill is positioned by one final canonical CSS layer and centered with `left:0; right:0; margin:auto`.
- Search / Plus / Menu always use a symmetric 1fr / 60px / 1fr grid.
- `AppSheet` is portalled to `document.body`, locks page scrolling and handles Escape centrally.
- Navigation and Quick Create use `AppSheet`; legacy page form sheets inherit the same canonical viewport/safe-area geometry.
- Historical mobile CSS remains for compatibility but is overridden by the final V19.3 authority block.
