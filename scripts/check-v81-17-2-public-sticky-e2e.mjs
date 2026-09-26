import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { assertVersionAtLeast } from './version-check.mjs'

const pkg = JSON.parse(readFileSync('package.json','utf8'))
const e2e = readFileSync('tests/e2e/responsive-robustness.spec.ts','utf8')
const workflow = readFileSync('.github/workflows/main_binso-admin-prod.yml','utf8')

assertVersionAtLeast(assert, pkg.version, '0.81.17.2')
assert.match(e2e, /Public marketing routes do not use the authenticated app RouteTransition wrapper/)
assert.match(e2e, /expect\(await page\.locator\('\.route-stage'\)\.count\(\)\)\.toBe\(0\)/)
assert.match(e2e, /const routeStage = page\.locator\('\.route-stage'\)[\s\S]*await expect\(routeStage\)\.toBeVisible\(\)[\s\S]*getComputedStyle\(el\)\.transform/)
assert.match(workflow, /pnpm run v81\.17\.2:check/)

console.log('V81.17.2 public sticky-header E2E scope checks passed.')
