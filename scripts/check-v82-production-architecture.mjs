import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { assertVersionAtLeast } from './version-check.mjs'

const required=[
  'database/migrations/0015_v82_normalized_business_core.sql',
  'lib/db/repositories/normalized-business-state.ts',
  'lib/db/repositories/business-lists.ts',
  'lib/db/repositories/document-counters.ts',
  'lib/db/repositories/idempotency.ts',
  'lib/db/repositories/business-state-backfill.ts',
  'app/api/business/records/route.ts',
  'app/api/internal/business-state-backfill/route.ts',
  'modules/shared/money.ts','modules/shared/pagination.ts','modules/shared/state-machine.ts',
  'app/styles/typography-system.css',
]
for(const file of required) assert.ok(existsSync(file),`V82 missing ${file}`)
const pkg=JSON.parse(readFileSync('package.json','utf8'))
assertVersionAtLeast(assert, pkg.version, '0.82.1.2')
const migration=readFileSync('database/migrations/0015_v82_normalized_business_core.sql','utf8')
for(const token of ['external_id','business_document_counters','business_idempotency_keys','enable row level security','organization_id, external_id','version integer']) assert.ok(migration.includes(token),`V82 migration missing ${token}`)
const tenantState=readFileSync('lib/db/repositories/tenant-state.ts','utf8')
assert.match(tenantState,/persistNormalizedCoreState/)
assert.match(tenantState,/removeNormalizedCoreFromLegacyState/)
const normalizedPersist=readFileSync('lib/db/repositories/normalized-business-state/persist.ts','utf8')
assert.match(normalizedPersist,/allocateDocumentNumber/)
assert.match(normalizedPersist,/assertTransition/)
const money=readFileSync('modules/invoices/calculations.ts','utf8')
assert.match(money,/toMinorUnits/)
assert.doesNotMatch(money,/line\.quantity \* line\.unitPrice/)
const layout=readFileSync('app/layout.tsx','utf8')
assert.doesNotMatch(layout,/next\/font\/google/)
assert.match(layout,/@fontsource-variable\/inter/)
assert.doesNotMatch(layout,/@fontsource-variable\/plus-jakarta-sans/)
assert.match(layout,/typography-system\.css/)
const typography=readFileSync('app/styles/typography-system.css','utf8')
const tokens=readFileSync('app/styles/tokens.css','utf8')
assert.match(typography,/--font-brand/)
assert.match(tokens,/--type-page-title:24px/)
assert.match(tokens,/--public-h1:clamp\(34px/)
const workflow=readFileSync('.github/workflows/main_binso-admin-prod.yml','utf8') + readFileSync('package.json','utf8')
assert.match(workflow,/pnpm run v82\.0:check/)
console.log('V82 production architecture checks passed.')
