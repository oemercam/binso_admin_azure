Binso Admin / Business Platform - Current Full V46

V46 introduces the SaaS organization foundation underneath the existing UX.

Implemented:
- Organization domain object
- Binso GmbH as compatibility/default organization
- currentOrganizationId + currentOrganization in BusinessStore
- organizationId migration for existing demo/localStorage data
- organization ownership metadata for business entities
- organization ownership for new records created through the central store
- PostgreSQL organizations table
- organization_id added to target business tables
- per-organization unique customer/quote/contract numbering in target schema
- new automated SaaS foundation check

No visual changes:
- Mobile/PWA compact two-line lists unchanged
- Dashboard/KPI layout unchanged
- Bottom pill unchanged
- sheets/overlays unchanged
- Contacts -> Company product model unchanged

Important:
V46 is NOT yet tenant security. V47 adds memberships/roles. V48 enforces tenant isolation.

Run:
npm run typecheck
npm run lint
npm run architecture:check
npm run actions:check
npm run process:check
npm run mobile-ui:check
npm run saas:check
npm run build
