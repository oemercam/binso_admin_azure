import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { assertVersionAtLeast } from './version-check.mjs'

const pkg = JSON.parse(readFileSync('package.json','utf8'))
const css = readFileSync('app/styles/marketing-v80.css','utf8')
const shell = readFileSync('components/public/public-shell.tsx','utf8')
const register = readFileSync('app/register/page.tsx','utf8')
const e2e = readFileSync('tests/e2e/responsive-robustness.spec.ts','utf8')
const config = readFileSync('lib/config/public-site.ts','utf8')
const workflow = readFileSync('.github/workflows/main_binso-admin-prod.yml','utf8')

assertVersionAtLeast(assert, pkg.version, '0.81.9')
assert.match(pkg.scripts.verify,/v819:check/)
assert.ok(css.includes('V81.9 — exhaustive public visual QA'))
for (const token of ['--v819-content','--v819-h1','--v819-h2','@media(max-width:820px)','@media(max-width:560px)','@media(max-width:360px)','@media(display-mode:standalone)']) assert.ok(css.includes(token), `missing ${token}`)
for (const selector of ['v812-page-intro h1','v812-auth-copy h1','register-start-copy h1','v812-help-article h1','v812-visual .marketing-real-screenshot','v80-mobile-primary a','v80-footer-main','register-start-step','v812-flow']) assert.ok(css.includes(selector), `missing visual standard for ${selector}`)
for (const label of ['Funktionen','Preise','FAQ','Kontakt']) assert.ok(config.includes(`label: '${label}'`), `missing nav ${label}`)
assert.match(shell,/v80-desktop-nav/)
assert.match(shell,/PublicMobileMenu/)
assert.match(register,/register-start-step/)
for (const image of ['dashboard-mockup-desktop.png','orders-mockup-desktop.png','invoices-mockup-desktop.png']) assert.ok(existsSync(`public/marketing/screenshots/${image}`), `missing marketing crop ${image}`)
assert.match(e2e,/V81\.(?:9|13) all public pages keep visual system/)
assert.match(e2e,/V81\.9 mobile demo steps and graphics remain readable/)
assert.match(e2e,/V81\.9 public imagery stays compact/)
assert.match(workflow,/pnpm run v819:check/)
console.log('V81.9 public visual QA checks passed (typography, navigation, imagery, graphics, forms, mobile and PWA CSS).')
