# Binso One v1.7.2

## Mobile/PWA Mockup-Parität
- Authenticated Mobile/PWA presentation is now controlled by one final cascade layer: `styles/mobile-pwa.css`.
- `app/globals.css` is import-only. Previous post-import mobile rules were moved to `styles/global-extras.css`, preventing legacy CSS from overriding the canonical Mobile/PWA contract.
- Floating navigation is fixed to Start / Kunden / Neu / Zeit / Profil.
- Lists are compact two-line divider rows without outer card landscapes.
- Details are flat information rows with contextual actions and progressive additional information.
- Create/edit forms are single-column, progressive and mobile-first.
- Short overlays, filters, profile and Quick Create use content-driven bottom sheets.
- Dashboard, settings, support, documents and time tracking share the same mobile hierarchy.
- Light mode uses white/black; dark mode uses black/white. Grey is limited to muted text and borders.
- Desktop >= 761px is intentionally unchanged by the v1.7.2 parity contract.

## Deployment safety
- Production health verification must validate HTTP status, release version and the 12-character Git commit instead of accepting any HTTP 200 response.
- No database migration is introduced by this release.
