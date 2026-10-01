# Release Notes — v1.8.3

## Mobile/PWA splash lint correction

- Fixes the React ESLint `react-hooks/set-state-in-effect` failure in `MobileSplashGate`.
- The splash is now shown from a `requestAnimationFrame` callback instead of synchronously mutating React state inside the effect body.
- Adds deterministic cleanup for both the animation frame and hide timer.
- Keeps the existing standalone-PWA-only, mobile-only and once-per-session behaviour unchanged.
- No database migration.
- Desktop presentation remains unchanged.
