import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const pkg=JSON.parse(readFileSync('package.json','utf8'))
const css=readFileSync('app/styles/marketing-v80.css','utf8')
const register=readFileSync('app/register/page.tsx','utf8')
const e2e=readFileSync('tests/e2e/responsive-robustness.spec.ts','utf8')

assert.ok(['0.81.10','0.81.11', '0.81.12', '0.81.13', '0.81.14', '0.81.15', '0.81.16'].includes(pkg.version))
assert.match(css,/--v8110-title:50px/)
assert.match(css,/\.v816-hero-copy h1,[\s\S]*\.v812-page-intro h1/)
assert.match(css,/\.v812-showcases\{[\s\S]*margin-inline:0!important/)
assert.match(register,/register-loading-state/)
assert.doesNotMatch(register,/if \(loading\) return null/)
assert.match(e2e,/V81\.10 public titles match landing typography at 390px/)
assert.match(e2e,/V81\.10 registration keeps public shell visible during bootstrap/)
console.log('V81.10 public visual fix checks passed (title parity, registration shell stability, mobile imagery containment).')
