# V46 — SaaS organization foundation

V46 introduces the organization/tenant boundary underneath the existing UX.

## What changed

- `Organization` is now a first-class domain object.
- The current demo has one organization: Binso GmbH.
- Business records receive `organizationId` during seed loading and legacy localStorage migration.
- Newly added records are stamped with the current organization where the BusinessStore owns creation.
- The PostgreSQL target schema now contains `organizations` and `organization_id` on business tables.
- Customer, quote and contract numbers become unique per organization in the target schema.
- `currentOrganizationId` and `currentOrganization` are available in the BusinessStore.

## Compatibility

The new tenant field is optional in TypeScript during V46 so the existing UI and older demo objects remain compatible.
The store migration assigns missing tenant IDs automatically.

## Deliberately NOT V46

V46 does not claim tenant isolation yet.
The following are separate milestones:
- V47: organization memberships and roles
- V48: enforced tenant isolation / authorization / RLS

Until V48, `organizationId` is ownership metadata and architectural groundwork, not a security boundary.

## UX contract

No presentation changes are part of V46.
The approved desktop, mobile and PWA layouts remain unchanged.
