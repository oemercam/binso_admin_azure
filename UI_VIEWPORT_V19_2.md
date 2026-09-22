# UI Viewport v19.2

Mobile/PWA sizing is now driven by the actual visible viewport.

- `visualViewport.width/height` are exposed as `--app-vw` / `--app-vh`.
- iOS safe areas are respected on all four edges.
- Page gutters adapt by screen width instead of using one fixed value.
- Fullscreen editors use the visible viewport dimensions.
- Narrow phones use smaller gutters; larger phones get slightly more breathing room.
- Tablet gutters are handled separately.
