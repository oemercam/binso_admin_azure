import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const css = readFileSync('app/styles/mobile-pwa-system.css', 'utf8')
const responsive = readFileSync('tests/e2e/responsive-robustness.spec.ts', 'utf8')
const core = readFileSync('tests/e2e/core-flows.spec.ts', 'utf8')
const mobileNav = readFileSync('components/navigation/mobile-pill-nav.tsx', 'utf8')
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

assert.equal(pkg.version, '0.81.19.2')
assert.match(css, /html\{[\s\S]*overflow-x:clip;[\s\S]*overflow-y:auto;/)
assert.match(css, /body\{[\s\S]*overflow:visible;/)
assert.doesNotMatch(css, /body\{overflow-y:auto\}/)
assert.match(responsive, /locator\('\.mobile-primary-nav'\)/)
assert.doesNotMatch(responsive, /locator\('\.mobile-pill'\)/)
assert.match(core, /name: 'Hauptnavigation'/)
assert.match(mobileNav, /className="mobile-primary-nav"/)
assert.match(mobileNav, /aria-label="Hauptnavigation"/)

console.log('V81.19.2 scroll ownership and mobile navigation regression checks passed.')
