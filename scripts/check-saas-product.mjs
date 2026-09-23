import fs from 'node:fs'

const read = (file) => fs.readFileSync(file, 'utf8')
const domain = read('types/domain.ts')
const store = read('components/state/business-store.tsx')
const schema = read('database/schema.sql')
const nav = read('components/navigation/nav-items.ts')
const overlays = read('components/shared/app-overlays.tsx')
const permissions = read('lib/auth/permissions.ts')

const checks = [
  ['OrganizationMembership type', domain.includes('export type OrganizationMembership')],
  ['Permission model', domain.includes('export type Permission')],
  ['Subscription model', domain.includes('export type OrganizationSubscription')],
  ['Audit model', domain.includes('export type AuditEvent')],
  ['Import/export model', domain.includes('export type ImportJob') && domain.includes('export type DataExportJob')],
  ['Tenant-scoped public customer data', store.includes("customers: state.customers.filter((item) => item.organizationId === state.currentOrganizationId)")],
  ['Membership-aware store', store.includes('activeMembership:')],
  ['Permission check', store.includes('can(permission)')],
  ['Membership DB', schema.includes('create table if not exists organization_memberships')],
  ['Subscription DB', schema.includes('create table if not exists organization_subscriptions')],
  ['Audit DB', schema.includes('create table if not exists audit_events')],
  ['RLS enabled', schema.includes('enable row level security')],
  ['Transactional numbering', schema.includes('function next_business_number')],
  ['Organization navigation', nav.includes("href: '/organization'")],
  ['Data navigation', nav.includes("href: '/data'")],
  ['Global contact search', overlays.includes('store.customerContacts.map')],
  ['Legacy route role groups preserved', permissions.includes('export const ROLE_GROUPS')],
  ['No membership setState effect', !store.includes('if (!hydrated || !user) return\n    setState((current) =>')],
]

const failed = checks.filter(([, ok]) => !ok)
if (failed.length) {
  for (const [name] of failed) console.error(`FAIL: ${name}`)
  process.exit(1)
}

console.log(`SaaS product checks passed (${checks.length} invariants).`)
