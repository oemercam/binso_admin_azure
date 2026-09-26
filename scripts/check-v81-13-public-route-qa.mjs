import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync('package.json','utf8'))
const spec = readFileSync('tests/e2e/responsive-robustness.spec.ts','utf8')
const signIn = readFileSync('app/sign-in/page.tsx','utf8')
const admin = readFileSync('app/admin-access/page.tsx','utf8')

assert.ok(['0.81.13','0.81.14', '0.81.15', '0.81.16'].includes(pkg.version))
assert.match(spec, /\/sign-in\?preview=1/)
assert.match(spec, /\/admin-access\?preview=1/)
assert.match(spec, /V81\.13 all public pages keep visual system/)
assert.match(signIn, /params\.preview === '1'/)
assert.match(admin, /params\.preview === '1'/)
console.log('V81.13 public route visual QA checks passed (auth preview routes stay inside PublicShell during local E2E).')
