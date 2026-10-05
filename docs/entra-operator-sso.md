# Binso One internal Microsoft Entra access

Internal Binso employees authenticate to One Admin with Microsoft Entra ID. Customer authentication remains separate.

## App roles
Configure these App Roles on the Entra application used by Azure App Service Authentication:

- `Binso.Platform.Owner` -> full platform ownership
- `Binso.Platform.Admin` -> platform administration
- `Binso.Platform.Support` -> support/customer visibility
- `Binso.Platform.Billing` -> subscriptions and billing
- `Binso.Platform.Auditor` -> read/audit access

Assign users or Entra groups to those application roles. Binso One maps the signed/validated Easy Auth role claims to its existing `platform_*` permission model.

## MFA
Microsoft Entra controls MFA. Microsoft Authenticator can be required using Conditional Access / Authentication Strength policies. Binso One does not store a second internal password for employees.

## Trust boundary
Production operator API access requires both:
1. a valid Binso operator session, and
2. a current Azure App Service Easy Auth principal whose tenant/object identity and App Role still match the session.

The default allowed email domain is `binso.ch`. `OPERATOR_ENTRA_TENANT_ID` can additionally pin the accepted tenant ID.

## Azure App Service
The application intentionally keeps customer/public routes anonymous. Internal login is initiated explicitly through:
`/.auth/login/aad`

After Microsoft authentication, Azure injects the validated `X-MS-CLIENT-PRINCIPAL` header. The application never trusts a browser-supplied email or role.

The architecture audit prints only non-secret Easy Auth settings so the production configuration can be verified without exposing credentials.
