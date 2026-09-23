import fs from 'node:fs'

const domain = fs.readFileSync('types/domain.ts', 'utf8')
const store = fs.readFileSync('components/state/business-store.tsx', 'utf8')
const schema = fs.readFileSync('database/schema.sql', 'utf8')

const requiredDomain = [
  'export type Organization =',
  'organizationId?: OrganizationId',
]

const requiredStore = [
  'organizations: Organization[]',
  'currentOrganizationId: string',
  'currentOrganization: Organization',
  'DEFAULT_ORGANIZATION_ID',
  'scopeRecords',
]

const requiredSchema = [
  'create table if not exists organizations',
  'organization_id uuid references organizations(id)',
  'uq_customers_org_customer_no',
  'uq_quotes_org_quote_no',
  'uq_contracts_org_contract_no',
]

const missing = [
  ...requiredDomain.filter((token) => !domain.includes(token)).map((token) => `domain:${token}`),
  ...requiredStore.filter((token) => !store.includes(token)).map((token) => `store:${token}`),
  ...requiredSchema.filter((token) => !schema.includes(token)).map((token) => `schema:${token}`),
]

if (missing.length) {
  console.error(`SaaS foundation check failed:\n${missing.join('\n')}`)
  process.exit(1)
}

console.log('SaaS organization foundation check passed.')
