import fs from 'node:fs'

const tokens = fs.readFileSync('app/styles/tokens.css', 'utf8')
const css = fs.readFileSync('app/styles/public-responsive-system.css', 'utf8')
const e2e = fs.readFileSync('tests/e2e/responsive-robustness.spec.ts', 'utf8')

const checks = [
  ['fluid H1 clears 390px minimum without a breakpoint jump', tokens.includes('--public-h1:clamp(34px,calc(29px + 2vw),50px);')],
  ['closed portal menu is hidden at tablet/mobile widths', css.includes('body>.v80-mobile-menu-panel{\n    display:none!important;')],
  ['open portal menu is explicitly displayed', css.includes('body>.v80-mobile-menu-panel.is-open') && css.includes('[aria-hidden="false"]{display:block!important}')],
  ['responsive matrix has sufficient timeout for full route/viewport sweep', e2e.includes('test.setTimeout(180_000)')],
]

const failed = checks.filter(([, ok]) => !ok)
if (failed.length) {
  for (const [name] of failed) console.error(`FAIL: ${name}`)
  process.exit(1)
}
console.log('V81.16.3 responsive regression checks passed')
