# V60 – Registration & Onboarding

V60 moves the registration and onboarding lifecycle from browser-only draft state to Azure PostgreSQL.

## Flow

1. The user signs in with Microsoft.
2. `/register` loads the authenticated identity from the server.
3. The business email is bound to the authenticated Microsoft account and cannot be changed in the registration form.
4. Registration data is stored in `signup_requests` as the single open registration draft for the authenticated user.
5. `/onboarding` reloads that draft from PostgreSQL, so the process can be resumed after refresh or a new browser session.
6. Starting the trial consumes the persisted signup inside a transaction and creates the organization, owner membership, subscription, entitlements, company profile, number sequences, platform tenant and audit event.
7. Repeated onboarding submissions are idempotent: an existing active membership is reused instead of creating a duplicate tenant.
8. `/post-login` routes returning users to the dashboard, users with an open registration to onboarding, and new users to pricing.
9. The protected app shell bootstraps authoritative organization, membership, subscription, entitlement and company-profile data from PostgreSQL after login.

## Compatibility

Business modules still persist their operational records in the browser store. The PostgreSQL bootstrap is authoritative for tenant identity and commercial access, while the existing browser data layer remains temporarily in place until the business repositories are migrated in the next stages.
