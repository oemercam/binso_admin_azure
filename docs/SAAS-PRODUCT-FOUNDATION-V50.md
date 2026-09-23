# V50 — Complete SaaS product foundation

This release converts the codebase from a Binso-only demo architecture into a product-oriented SaaS foundation while preserving the approved UI.

## Implemented in code

### Tenant model
- Organizations
- current organization
- organization ownership on business data
- scoped data exposed by BusinessStore
- membership-aware organization switching
- compatibility migration for older localStorage demo data

### Identity and authorization
- organization memberships
- roles per organization
- explicit permission catalogue
- role-to-permission mapping
- effective current user role from membership
- organization/member management surface

### Commercial product model
- subscription plan/status
- organization entitlements/features
- seat/storage limits data model

### Audit
- audit event model
- audit persistence in demo store
- audit schema/indexes
- organization UI showing recent audit events

### Numbering
- per-organization number-sequence model
- PostgreSQL sequence table
- transactional `next_business_number()` function

### Data portability
- import-job model and UI foundation
- export-job model and UI foundation
- data page

### Search and object-centric UX
- contacts included in global search
- companies open their 360° hub
- existing contact -> company -> business-object flow preserved

### PostgreSQL / security foundation
- memberships
- subscriptions
- entitlements
- number sequences
- audit
- import/export jobs
- tenant indexes
- row-level-security foundation
- organization membership policy
- tenant context helper contract

## Intentionally not faked

The repository still uses its demo/localStorage persistence for the running prototype.
The following require real external infrastructure and credentials and therefore cannot truthfully be marked production-complete from source code alone:

- PostgreSQL connection/repository implementation
- production identity-to-membership lookup
- transactional DB request context (`app.organization_id`, `app.user_id`)
- actual email delivery provider
- actual subscription payment provider
- file/blob storage
- malware scanning
- real CSV/XLSX file processing
- bank integration
- production backup/restore operations

The code and target schema are prepared for these connections, but they must be implemented and tested against the selected production services.

## UX contract

No redesign was introduced. Existing Desktop, Mobile and PWA visual standards remain canonical.
