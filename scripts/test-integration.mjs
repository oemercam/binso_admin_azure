import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const businessApi = readFileSync(new URL('../app/api/business/state/route.ts', import.meta.url), 'utf8')
assert.match(businessApi, /resolveTenantContext\(body\.organizationId\)/)
assert.match(businessApi, /organizationId: context\.organizationId/)
assert.match(businessApi, /requireSameOrigin/)
const tenant = readFileSync(new URL('../lib/db/tenant.ts', import.meta.url), 'utf8')
assert.match(tenant, /app\.organization_id/)
const registration = readFileSync(new URL('../app/api/registration/route.ts', import.meta.url), 'utf8')
assert.match(registration, /enforceRateLimit/)
const members = readFileSync(new URL('../app/api/organization/members/route.ts', import.meta.url), 'utf8')
assert.match(members, /enforceRateLimit/)
console.log('V72 integration foundation passed.')
