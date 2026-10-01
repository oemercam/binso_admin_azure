# Binso One v1.8.3 — Exact Mobile/PWA Mockup Parity

## Scope
v1.8.3 is a visual-parity release based on the approved **Binso One Mobile App — Alle Seiten & Komponenten** reference board.

## Completed
- approved blue/navy accent palette rather than a false monochrome approximation
- exact mobile bottom-navigation proportions, active state and blue central create control
- compact local page headers/topbars with no permanent workspace logo/avatar/header
- dashboard pastel KPI tiles and compact activity rows
- module launcher icon palette and row density
- compact search/toolbars and flat list rows
- bottom sheets with dimmed backdrop, rounded top corners and grabber
- compact form fields, blue focus state, primary/secondary controls
- semantic status tags and feedback states
- Splash, login and introduction sizing/proportions aligned to the board
- timer idle/running/global indicator visual contract
- profile/settings row density
- light/dark variants and short-height/small-width behaviour

## Desktop
Desktop >= 761 px remains unchanged by the v1.8.3 visual contract.

## Database
No schema migration is required.

## v1.8.3 correction
`MobileSplashGate` no longer performs a synchronous state update inside `useEffect`; display is scheduled with `requestAnimationFrame` and all scheduled work is cleaned up on unmount.
