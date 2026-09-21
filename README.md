# Binso Admin Platform

Production-oriented starter for the Binso internal administration app.

## Architecture

- Next.js App Router + TypeScript strict mode
- Feature/domain modules under `modules/*`
- Cross-cutting infrastructure under `lib/*`
- Reusable UI under `components/*`
- Protected application routes under `app/(app)`
- Azure App Service Authentication / Microsoft Entra ID adapter (`AUTH_MODE=azure`)
- PWA manifest, safe-area support, standalone mode, responsive mobile pill navigation
- System/light/dark theme with pre-hydration theme boot to avoid a light flash in dark mode
- Service worker caches static assets only; authenticated business/API data is intentionally not cached
- Push subscription client and authenticated API boundary prepared for DB persistence
- Role/permission matrix prepared for server-side authorization

## Local start

```bash
cp .env.example .env.local
npm install
npm run dev
```

`AUTH_MODE=local` provides a local demo identity only for development.

## Azure production authentication

Set `AUTH_MODE=azure` and enable App Service Authentication with Microsoft Entra ID. Configure unauthenticated access according to the deployment model. The server reads the platform-provided authenticated principal and does not manage user passwords.

Sign-in and sign-out use Azure's `/.auth/login/aad` and `/.auth/logout` endpoints. Entra/App Service maintains the browser authentication session and SSO.

## Push

Set `NEXT_PUBLIC_VAPID_PUBLIC_KEY`. The API route currently validates authentication and is intentionally a persistence stub. Before production, store push subscriptions in the database bound to the authenticated user and keep the VAPID private key server-side (prefer Key Vault / managed identity based secret loading).

On iOS/iPadOS, Web Push requires the PWA to be installed on the Home Screen. Android/Chromium and supported desktop browsers can use Web Push directly.

## Caching and data security

The service worker does **not** cache `/api`, auth endpoints, pages containing business data, invoices, customers or employee data. It caches only static assets and an offline information screen. Server APIs return `Cache-Control: no-store`.

## Next production steps

1. PostgreSQL/Azure SQL repository implementations behind the repository interfaces.
2. Input validation and Server Actions/API schemas.
3. Audit log and immutable financial-event history.
4. Entra app roles / groups -> application roles.
5. Push subscription persistence + notification worker.
6. Azure Key Vault + Managed Identity.
7. Application Insights / structured PII-minimised logging.
8. Playwright end-to-end tests for iOS-size, Android-size and desktop breakpoints.
9. CSP nonce strategy after all required external origins are known.
10. Backup/restore, retention, invoice PDF generation and accounting exports.
