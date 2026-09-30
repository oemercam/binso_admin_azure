# Binso One Architektur

Binso One bleibt eine Next.js-Anwendung, trennt aber drei Oberflächen logisch: öffentliche Website (`/`), Kundenportal (`/portal` als Einstieg, fachliche Module nach erfolgreicher Sitzung) und Betreiberbereich (`/operator`). Eine spätere Zuordnung zu `binso.ch`, `app.binso.ch` und `admin.binso.ch` ist dadurch vorbereitet.

UI-Komponenten verwenden zentrale Tokens aus `styles/tokens.css`; Komponenten-, Responsive- und Overlay-Regeln liegen zentral in `styles/app.css`, `styles/responsive-central.css` und `styles/overlays.css`. Interaktive Standardbausteine liegen unter `components/ui`. Business- und Datenzugriffslogik bleibt ausserhalb von Präsentationskomponenten in `lib/server`, Repositories und API-Routen. Rollen und Berechtigungen sind zentral in `lib/permissions.ts` definiert.

## Canonical application shell

Since v1.4.x, authenticated workspace routes live below the Next.js route group `app/(workspace)` and share one persistent `Shell` through `app/(workspace)/layout.tsx`. Individual pages must not mount `Shell` themselves.

UI chrome ownership is intentionally separated:

- `styles/shell.css`: application header, sidebar, bottom navigation, account menu, marketing header/mobile menu and public footer.
- `styles/overlays.css`: dialogs, sheets and overlay positioning/focus surfaces.
- `styles/responsive-central.css`: responsive component behaviour that is not application/public shell chrome.
- `styles/app.css`: general component and page styling.
- `styles/tokens.css`: design tokens and compatibility aliases.

`scripts/ui-consistency-selfcheck.mjs` enforces these ownership boundaries during `pnpm test` so duplicate shell implementations cannot silently return.

## Mobile/PWA rendering standard
- Native PWA splash is the only application boot screen; no global React boot overlay.
- Mobile spacing is tokenized in `styles/tokens.css`.
- Shell/fixed chrome remains in `styles/shell.css`; viewport adaptations remain in `styles/responsive-central.css`.
- Mobile marketing content does not use scroll-triggered reveal animations.
- Route changes perform one scheduled scroll reset only.
