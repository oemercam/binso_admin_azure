# V73 – SaaS Platform Foundation

V73 extends the existing Binso One codebase without replacing the V72 business workflows.

## Implemented in code

- Expanded operator roles: Platform Owner, Admin, Support, Billing and Auditor.
- Operator identity boundary for `@binso.ch`; Entra single-tenant/MFA remain external Azure controls.
- Platform sub-navigation and dedicated Customers, Subscriptions, Registrations, Support, Operations, Audit and Settings views.
- Digital in-app support cases with human-readable BS numbers, conversation history, safe page/build context and operator replies.
- Existing temporary support-access grants remain separate and auditable.
- Guided five-step onboarding with persisted progress, module preferences and business settings.
- Feature flags separated from permissions and subscription entitlements, with change reason and platform audit entry.
- Entitlement override storage separated from plan catalog.
- In-app notification storage foundation.
- `/api/health/live` and `/api/health/ready` health probes without sensitive configuration data.
- PostgreSQL RLS enabled for tenant support and notification data.

## Security boundaries

Plan, entitlement, role/permission, tenant lifecycle and feature flags remain separate concepts. UI visibility is not authorization. Tenant support APIs resolve server-side membership and never accept a browser-supplied tenant as authority.

Operator authentication must additionally be configured in Azure for the Binso Microsoft Entra tenant with MFA/Conditional Access. The application does not attempt to manage Azure RBAC or credentials.

## External configuration still required

The repository cannot provision or prove `admin.binso.ch`, Entra single-tenant settings, MFA Conditional Access, Azure deployment slots, PostgreSQL PITR policy, Application Insights alerts or Key Vault. These remain infrastructure tasks and must be verified before production-readiness is claimed.
