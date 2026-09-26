import fs from 'node:fs'

const menu = fs.readFileSync('components/public/public-mobile-menu.tsx', 'utf8')
const e2e = fs.readFileSync('tests/e2e/responsive-robustness.spec.ts', 'utf8')

const checks = [
  ['menu trigger is disabled before hydration', menu.includes('disabled={!mounted}')],
  ['menu trigger exposes hydration readiness', menu.includes("data-hydrated={mounted ? 'true' : 'false'}")],
  ['tablet navigation test waits for enabled trigger', e2e.includes('await expect(trigger).toBeEnabled()')],
  ['tablet navigation test waits for hydrated trigger', e2e.includes("await expect(trigger).toHaveAttribute('data-hydrated', 'true')")],
]

const failed = checks.filter(([, ok]) => !ok)
if (failed.length) {
  for (const [name] of failed) console.error(`FAIL: ${name}`)
  process.exit(1)
}
console.log('V81.16.4 mobile menu hydration readiness checks passed')
