import assert from 'node:assert/strict'
import fs from 'node:fs'

const read=(p)=>fs.readFileSync(p,'utf8')
const required=[
  'database/migrations/0013_v75_complete_product_foundation.sql',
  'lib/db/repositories/platform-operators.ts',
  'lib/db/repositories/platform-customer-detail.ts',
  'lib/db/repositories/platform-workflows.ts',
  'lib/db/repositories/help-center.ts',
  'lib/db/repositories/data-lifecycle.ts',
  'lib/db/repositories/billing-reconciliation.ts',
  'app/api/internal/billing-reconcile/route.ts',
  'app/api/internal/release-event/route.ts',
  'app/api/analytics/event/route.ts',
  'app/api/platform/operators/route.ts',
  'app/api/platform/analytics/route.ts',
  'app/api/platform/incidents/route.ts',
  'app/api/platform/releases/route.ts',
  'app/help/page.tsx',
  'app/(app)/platform/analytics/page.tsx',
  'app/(app)/platform/data-lifecycle/page.tsx',
  'app/(app)/platform/help/page.tsx',
  'app/api/platform/help/route.ts',
  'scripts/platform-operator-bootstrap.mjs',
]
for(const f of required) assert.ok(fs.existsSync(f),`Missing V75 file: ${f}`)
const migration=read(required[0])
for(const needle of ['platform_operator_assignments','platform_internal_notes','organization_milestones','product_events','help_center_articles','data_lifecycle_requests','billing_reconciliation_runs','platform_incidents','platform_release_events','rate_limit_buckets']) assert.match(migration,new RegExp(needle))
assert.match(read('lib/db/client.ts'),/PLATFORM_DATABASE_URL/)
assert.match(read('lib/auth/server.ts'),/PLATFORM_ROLE_SOURCE/)
assert.match(read('lib/auth/server.ts'),/if \(!session\.user\.platformRole\) return null/)
assert.match(read('lib/http/rate-limit.ts'),/enforceDistributedRateLimit/)
assert.match(read('.github/workflows/main_binso-admin-prod.yml'),/Ensure staging slot exists/)
assert.match(read('.github/workflows/main_binso-admin-prod.yml'),/configuration-source binso-admin-prod/)
assert.match(read('.github/workflows/main_binso-admin-prod.yml'),/Required staging setting/)
assert.match(read('.github/workflows/main_binso-admin-prod.yml'),/Sync missing staging runtime settings/)
assert.match(read('.github/workflows/main_binso-admin-prod.yml'),/--slot-settings APP_BASE_URL/)
assert.match(read('scripts/smoke-url.mjs'),/attempt <= 30/)
console.log('V75 complete product foundation checks passed.')
