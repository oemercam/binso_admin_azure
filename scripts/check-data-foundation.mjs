import fs from 'node:fs'

const requiredFiles = [
  'lib/db/client.ts',
  'lib/db/tenant.ts',
  'lib/db/repositories/memberships.ts',
  'lib/db/repositories/organizations.ts',
  'database/migrations/0001_baseline.sql',
  'scripts/db-migrate.mjs',
]

const failures = requiredFiles.filter((file) => !fs.existsSync(file)).map((file) => `missing:${file}`)
const tenant = fs.readFileSync('lib/db/tenant.ts', 'utf8')
const schema = fs.readFileSync('database/migrations/0001_baseline.sql', 'utf8')
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))

for (const token of ["set_config('app.organization_id'", "set_config('app.user_id'"]) {
  if (!tenant.includes(token)) failures.push(`tenant:${token}`)
}
for (const token of ['enable row level security', 'create table if not exists organization_memberships', 'next_business_number']) {
  if (!schema.includes(token)) failures.push(`migration:${token}`)
}
if (!packageJson.dependencies?.pg) failures.push('package:pg')
if (!packageJson.scripts?.['db:migrate']) failures.push('script:db:migrate')

if (failures.length) {
  console.error(`Data foundation check failed (${failures.length}):`)
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log('Production data foundation check passed.')
