import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const v79 = readFileSync('scripts/check-v79-foundation.mjs', 'utf8')
const responsive = readFileSync('tests/e2e/responsive-robustness.spec.ts', 'utf8')

assert.equal(pkg.version, '0.81.19.4')
assert.match(v79, /mobile-primary-nav/)
assert.match(v79, /mobile navigation and wide desktop/)
assert.match(responsive, /mobile-primary-nav/)
assert.doesNotMatch(v79, /responsive regression coverage must include small mobile, tablet, customer app, mobile pill and wide desktop/)

console.log('V81.19.4 legacy V79 responsive coverage compatibility check passed.')
