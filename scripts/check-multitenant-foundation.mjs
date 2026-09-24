import fs from 'node:fs'

const read = (file) => fs.readFileSync(file, 'utf8')
const domain = read('types/domain.ts')
const migration = read('database/migrations/0009_multitenant_rbac_business_model.sql')
const permissions = read('lib/auth/permissions.ts')
const access = read('lib/auth/access-policy.ts')
const tenantServer = read('lib/auth/tenant-server.ts')
const registration = read('app/api/registration/route.ts')
const onboarding = read('lib/db/repositories/onboarding.ts')
const support = read('lib/db/repositories/support-access.ts')

const checks = [
  ['strict domain tenancy', domain.includes('organizationId: OrganizationId') && !domain.includes('organizationId?: OrganizationId')],
  ['tenant lifecycle', domain.includes("'grace_period'") && domain.includes("'read_only'") && domain.includes("'archived'")],
  ['permission model', permissions.includes("'subscription.manage'") && permissions.includes("'billing.manage'") && permissions.includes("'support.request'")],
  ['permission + entitlement + lifecycle gate', access.includes('canTenantAction') && access.includes('permissionFeature') && access.includes('tenantAccessMode')],
  ['authorized tenant context', tenantServer.includes('resolveAuthorizedTenantContext') && tenantServer.includes('canTenantAction')],
  ['multiple organizations per user', !registration.includes('Für dieses Konto besteht bereits eine aktive Organisation.') && !onboarding.includes('select organization_id\n         from organization_memberships')],
  ['strict child ownership', migration.includes('alter table quote_lines add column if not exists organization_id') && migration.includes('alter table invoice_lines alter column organization_id set not null')],
  ['cross-tenant foreign keys', migration.includes('fk_quotes_tenant_customer') && migration.includes('fk_invoice_lines_tenant_invoice')],
  ['tenant-local identifiers', migration.includes('uq_invoices_org_invoice_no') && migration.includes('uq_employees_org_email_ci')],
  ['role catalogue', migration.includes('organization_roles') && migration.includes('organization_role_permissions')],
  ['usage limits', migration.includes('organization_usage_counters') && migration.includes('max_api_requests_per_month')],
  ['audited support access', migration.includes('support_access_grants') && support.includes('platform_audit_events')],
  ['RLS for new tenant tables', migration.includes("'organization_roles','organization_role_permissions','organization_usage_counters','support_access_grants'")],
]

const failed = checks.filter(([, ok]) => !ok)
if (failed.length) {
  console.error(`Multi-tenant foundation checks failed (${failed.length}):`)
  for (const [name] of failed) console.error(`- ${name}`)
  process.exit(1)
}
console.log(`Multi-tenant foundation checks passed (${checks.length} controls).`)
