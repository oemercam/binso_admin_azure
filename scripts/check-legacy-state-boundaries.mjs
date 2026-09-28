import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const roots = ['app', 'components', 'lib', 'modules', 'tests', 'types']
const allowed = new Set([
  'lib/db/repositories/business-jobs.ts',
  'lib/db/repositories/business-state-backfill.ts',
  'lib/db/repositories/mail-outbox.ts',
  'lib/db/repositories/onboarding.ts',
  'lib/db/repositories/tenant-state.ts',
])
const violations = []

function visit(path) {
  for (const entry of readdirSync(path)) {
    const full = join(path, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) visit(full)
    else if (/\.(ts|tsx|js|mjs)$/.test(entry)) {
      const rel = relative(process.cwd(), full).replaceAll('\\', '/')
      if (readFileSync(full, 'utf8').includes('tenant_business_state') && !allowed.has(rel)) violations.push(rel)
    }
  }
}

for (const root of roots) visit(join(process.cwd(), root))
if (violations.length) {
  console.error('New direct legacy tenant_business_state dependency detected:')
  for (const file of violations) console.error(`- ${file}`)
  process.exit(1)
}
console.log(`Legacy-state boundary check passed (${allowed.size} transitional repository files allow-listed).`)
