# Mobile/PWA Master Audit v1.7.3

The v1.7.2 app-first UI contract remains the visual baseline. v1.7.3 removes a parallel ownership path that still existed in `styles/shell.css`: authenticated mobile topbar, account trigger and bottom-nav geometry were defined there and later overridden by the canonical `styles/mobile-pwa.css` layer.

The authenticated Mobile/PWA shell is now owned centrally by `styles/mobile-pwa.css`. Desktop remains outside the <=760 px contract and its shell rules were not changed.

Static verification passed for the central app-first contract, route matrix (69 workspace pages), navigation architecture, Quick Create/Profile sheets, i18n hardcode coverage (209 TSX surfaces), and UI consistency. No migration was added.
