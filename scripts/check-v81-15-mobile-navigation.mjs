import fs from 'node:fs'

const menu = fs.readFileSync('components/public/public-mobile-menu.tsx', 'utf8')
const css = fs.readFileSync('app/styles/marketing-v80.css', 'utf8')
const e2e = fs.readFileSync('tests/e2e/responsive-robustness.spec.ts', 'utf8')

const checks = [
  ['mobile menu uses a document.body portal', menu.includes('createPortal(panel, document.body)')],
  ['mobile panel has explicit open state class', menu.includes("'v80-mobile-menu-panel is-open'")],
  ['body scroll is restored safely', menu.includes('previousOverflow')],
  ['portal panel has top-level mobile positioning', css.includes('body>.v80-mobile-menu-panel{')],
  ['open portal is interactive', css.includes('body>.v80-mobile-menu-panel.is-open') && css.includes('pointer-events:auto!important')],
  ['desktop portal is hidden', css.includes('@media(min-width:821px){body>.v80-mobile-menu-panel{display:none!important}}')],
  ['E2E clicks and verifies mobile navigation', e2e.includes('V81.15 mobile public navigation opens, closes and stays above content')],
]

const failed = checks.filter(([, ok]) => !ok)
if (failed.length) {
  for (const [name] of failed) console.error(`FAIL: ${name}`)
  process.exit(1)
}
console.log('V81.15 mobile public navigation checks passed')
