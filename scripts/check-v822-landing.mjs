import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { assertVersionAtLeast } from './version-check.mjs'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const landing = readFileSync('app/page.tsx', 'utf8')
const responsiveCss = readFileSync('app/styles/public-responsive-system.css', 'utf8')
const screenshots = readFileSync('components/public/marketing-screenshot.tsx', 'utf8')
const responsiveTests = readFileSync('tests/e2e/responsive-robustness.spec.ts', 'utf8')
const visualTests = readFileSync('tests/e2e/visual-all-pages.spec.ts', 'utf8')

assertVersionAtLeast(assert, pkg.version, '0.82.2.0')

const requiredLandingSections = [
  'v822-home',
  'v822-hero',
  'v822-benefits',
  'v822-benefit-grid',
  'v822-workflow',
  'v822-flow',
  'v822-product',
  'v822-product-stage',
  'v822-scenes',
  'v822-scene-grid',
  'v822-trust',
  'v822-final',
]

for (const section of requiredLandingSections) {
  assert.ok(
    landing.includes(section),
    `V82.2 landing is missing required section: ${section}`,
  )
}

const requiredScreenshots = [
  'dashboard',
  'orders',
  'time',
  'invoices',
]

for (const screenshot of requiredScreenshots) {
  assert.ok(
    landing.includes(`name="${screenshot}"`),
    `V82.2 landing is missing real product screenshot: ${screenshot}`,
  )
}

const requiredWorkflowSteps = [
  'Kunde',
  'Angebot',
  'Auftrag',
  'Zeit',
  'Rechnung',
]

for (const workflowStep of requiredWorkflowSteps) {
  assert.ok(
    landing.includes(workflowStep),
    `V82.2 landing workflow is missing: ${workflowStep}`,
  )
}

assert.match(landing, /PublicShell/)
assert.match(landing, /MarketingScreenshot/)
assert.match(landing, /30 Tage kostenlos testen/)
assert.match(landing, /Demo ansehen/)

assert.doesNotMatch(landing, /SwipeCarousel/)
assert.doesNotMatch(landing, /06:42h|75%|82%|\+6%|68%/)

const requiredResponsiveSelectors = [
  '.v822-home',
  '.v822-benefit-grid',
  '.v822-product-stage',
  '.v822-scene-grid',
  '.v822-trust',
]

for (const selector of requiredResponsiveSelectors) {
  assert.ok(
    responsiveCss.includes(selector),
    `V82.2 responsive CSS is missing: ${selector}`,
  )
}

assert.match(
  screenshots,
  /marketing-real-screenshot/,
)

assert.match(
  responsiveTests,
  /V82\.2 landing tells one clear product story on mobile/,
)

assert.match(
  responsiveTests,
  /V81\.16 public layout matrix stays clean across/,
)

assert.match(
  visualTests,
  /v822-hero-product/,
)

assert.match(
  visualTests,
  /v822-product-stage/,
)

assert.match(
  visualTests,
  /v822-scene-wide/,
)

console.log(
  'V82.2 landing checks passed: structure, workflow, real screenshots and responsive regression coverage.',
)
