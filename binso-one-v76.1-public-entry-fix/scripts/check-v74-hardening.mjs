import assert from 'node:assert/strict'
import fs from 'node:fs'

const read=(path)=>fs.readFileSync(path,'utf8')
const migration=read('database/migrations/0012_v74_production_hardening.sql')
assert.match(migration,/case_type text not null default 'support'/)
assert.match(migration,/with check \(organization_id/)
assert.match(migration,/support_case_number_seq/)
assert.match(migration,/is_pilot_customer/)
assert.match(migration,/is_demo/)
assert.match(migration,/public_leads/)
assert.match(read('proxy.ts'),/BINSO_OPERATOR_HOST/)
assert.match(read('app/robots.ts'),/sitemap/)
assert.match(read('app/sitemap.ts'),/\/pricing/)
assert.match(read('components/public/contact-form.tsx'),/Nachricht senden/)
assert.match(read('scripts/demo-seed.mjs'),/ALLOW_DEMO_SEED/)
assert.match(read('.github/workflows/main_binso-admin-prod.yml'),/deployment slot swap/)
assert.match(read('.github/workflows/main_binso-admin-prod.yml'),/Rolling back/)
console.log('V74 production hardening checks passed.')
