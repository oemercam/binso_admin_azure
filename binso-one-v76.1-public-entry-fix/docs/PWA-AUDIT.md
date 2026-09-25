# Binso Admin PWA audit — V13

## Install identity and icons
- Next.js file-based `app/icon.png`, `app/apple-icon.png`, and `app/favicon.ico` all use the canonical Binso icon.
- Apple touch icon is 180×180 PNG with an opaque white background.
- Manifest contains 192×192, 512×512 and 1024×1024 regular PNG icons.
- Manifest contains dedicated 192×192 and 512×512 maskable PNG icons.
- Maskable artwork stays within a conservative safe zone and uses an opaque background.
- Manifest icon URLs are versioned with the deployment build ID.
- Manifest and icon responses are configured to revalidate rather than stay pinned to an old deployment.

## Manifest
- Stable `id` and `scope`.
- `name`, `short_name`, `description`.
- `start_url` points to the authenticated app entry.
- `display: standalone`.
- `background_color` and `theme_color`.
- business/productivity/finance categories.
- install icons include regular and maskable variants.

## Service worker
- Registered only in production and versioned by build ID.
- `updateViaCache: none`.
- New worker waits for explicit user update approval.
- App reloads only after that approved worker becomes active.
- Navigation is network-first with offline fallback.
- Next.js JS/CSS/chunks are network-first, preventing stale deployment bundles.
- Install metadata and icons are network-first with cache fallback.
- Old versioned caches are removed on activation.
- API and authentication traffic is not intercepted/cached.
- Push navigation is restricted to same-origin app paths.
- Notification icon and badge are build-versioned.

## Update detection
- Checks at initial registration.
- Checks again when the app returns to the foreground.
- Checks after `pageshow` and when the device comes back online.
- Checks are throttled to avoid repeated update traffic.

## Mobile/iOS
- `viewportFit: cover` is configured.
- `appleWebApp.capable` is enabled.
- File-based Apple touch icon is present.
- Theme colors are supplied for light/dark browser chrome.

## Security/privacy
- HTTPS is provided by Azure App Service.
- Security headers include CSP, HSTS, nosniff, frame protection and permissions policy.
- API responses are `no-store`.
- Business data is not cached for offline use by the service worker.

## Important platform limitation
An icon already pinned to an iOS Home Screen may remain cached by iOS. V13 ensures that a NEW installation uses the correct Binso icon and that web/manifest icon references are versioned for future deployments. An already installed iOS Home Screen shortcut may still need to be removed and added again if iOS keeps its previously installed icon.
