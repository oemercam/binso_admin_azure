import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { assertVersionAtLeast } from './version-check.mjs'

const pkg = JSON.parse(readFileSync('package.json','utf8'))
const css = readFileSync('app/styles/mobile-pwa-system.css','utf8')
const e2e = readFileSync('tests/e2e/responsive-robustness.spec.ts','utf8')
const workflow = readFileSync('.github/workflows/main_binso-admin-prod.yml','utf8')

assertVersionAtLeast(assert, pkg.version, '0.81.17.1')
assert.match(css, /V81\.17\.1 — sticky-header containment fix/)
assert.match(css, /\.public-site-v80\{\s*overflow-x:visible!important/)
assert.match(css, /\.route-stage\{\s*transform:none!important/)
assert.doesNotMatch(css, /from\{opacity:\.82;transform:translateY\(4px\)\}/)
assert.match(e2e, /V81\.13 all public pages[\s\S]*test\.setTimeout\(120_000\)/)
assert.match(e2e, /getComputedStyle\(el\)\.overflowX/)
assert.match(e2e, /getComputedStyle\(el\)\.transform/)
assert.match(workflow, /pnpm run v81\.17\.1:check/)

console.log('V81.17.1 sticky-header containment and E2E stability checks passed.')
