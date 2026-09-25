# V59 – Authentication and Memberships

V59 moves organization onboarding from browser-only state into PostgreSQL while retaining the existing browser business store as a temporary compatibility presentation layer.

## Authentication

Production authentication remains Microsoft Entra ID through Azure App Service Authentication. The application reads the verified `x-ms-client-principal` header. Local authentication remains development-only and is automatically disabled in production.

## Identity and authorization

- `app_users` stores the authenticated external user identifier, normalized email, display name and account status.
- `organization_memberships` remains the authoritative tenant membership and business role source.
- Platform operator roles continue to come from Entra application roles (`platform_owner`, `platform_admin`, `platform_support`).
- A tenant ID received from a request is only a selector. Access still requires an active membership.

## Onboarding

`POST /api/onboarding` requires an authenticated session, requires the signup email to match the authenticated Microsoft identity and creates the organization in one database transaction. The transaction creates the owner membership, trial subscription, entitlements, number sequences, platform tenant record and audit event.

The UI mirrors the new organization into the existing browser store only so the current V58 business screens keep working. That mirror is not the authority. Subsequent versions migrate each business module to repositories/APIs and remove the browser persistence layer.

## Environment and migrations

`npm run db:migrate` now loads `.env.local` automatically. Azure PostgreSQL TLS URLs using `sslmode=require` are normalized internally to `sslmode=verify-full` to preserve certificate verification and avoid the pg connection-string compatibility warning.
