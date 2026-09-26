import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { assertVersionAtLeast } from './version-check.mjs'

const architecture = readFileSync('scripts/check-architecture.mjs', 'utf8')
const previous = readFileSync('scripts/check-v81-19-2-scroll-and-mobile-nav.mjs', 'utf8')
const workflow = readFileSync('.github/workflows/main_binso-admin-prod.yml', 'utf8')
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

assertVersionAtLeast(assert, pkg.version, '0.81.19.3')
assert.match(architecture, /existsSync/)
assert.match(architecture, /if \(existsSync\(directory\)\) walk\(directory\)/)
assert.doesNotMatch(previous, /assert\.equal\(pkg\.version, '0\.81\.19\.2'\)/)
assert.match(previous, /assertVersionAtLeast\(assert, pkg\.version, '0\.81\.19\.2'\)/)
assert.match(workflow, /pnpm run v81\.19\.3:check/)

console.log('V81.19.3 optional source-root CI compatibility check passed.')
