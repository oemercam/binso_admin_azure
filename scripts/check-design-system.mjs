import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const globals = readFileSync(join(root, 'app/globals.css'), 'utf8')
const appUi = readFileSync(join(root, 'app/app-ui.css'), 'utf8')
const identity = readFileSync(join(root, 'lib/config/app-identity.ts'), 'utf8')
const publicSite = readFileSync(join(root, 'lib/config/public-site.ts'), 'utf8')
const publicShell = readFileSync(join(root, 'components/public/public-shell.tsx'), 'utf8')
const contact = readFileSync(join(root, 'app/contact/page.tsx'), 'utf8')
const imprint = readFileSync(join(root, 'app/legal/imprint/page.tsx'), 'utf8')
const privacy = readFileSync(join(root, 'app/legal/privacy/page.tsx'), 'utf8')

const productVisuals = readFileSync(join(root, 'components/public/product-visuals.tsx'), 'utf8')
const cookieConsent = readFileSync(join(root, 'components/public/cookie-consent.tsx'), 'utf8')

const requiredTokens = [
  '--font-sans',
  '--font-size-display-xl',
  '--font-size-display-lg',
  '--font-size-display-md',
  '--font-size-title-lg',
  '--font-size-title-md',
  '--font-size-body-lg',
  '--font-size-body',
  '--font-size-small',
  '--font-size-caption',
  '--font-size-micro',
  '--space-4',
  '--space-8',
  '--space-16',
  '--radius-sm',
  '--radius-md',
  '--radius-lg',
  '--radius-xl',
  '--control-height',
  '--control-height-touch',
  '--content-public',
  '--content-reading',
]

for (const token of requiredTokens) {
  if (!globals.includes(`${token}:`)) throw new Error(`Missing canonical design token ${token}`)
}

const forbiddenLegacyVars = ['var(--background)', 'var(--foreground)']
for (const value of forbiddenLegacyVars) {
  if (globals.includes(value) || appUi.includes(value)) throw new Error(`Legacy CSS variable remains: ${value}`)
}

const canonicalMarker = '/* V70.2 — canonical Binso One public brand, product entry and authentication */'
if (appUi.split(canonicalMarker).length !== 2) throw new Error('Canonical V70.2 public/auth style block must exist exactly once')
if (appUi.includes('V52 public product/registration pages')) throw new Error('Obsolete V52 public style block still exists')
if (appUi.includes('Binso One — public product authentication')) throw new Error('Obsolete duplicate authentication style block still exists')

for (const value of ["name: 'Binso One'", "company: 'Binso GmbH'", 'phoneDisplay:', 'address: {']) {
  if (!identity.includes(value)) throw new Error(`Central app identity is incomplete: ${value}`)
}

for (const value of ['primaryNavigation', 'productNavigation', 'helpNavigation', 'legalNavigation']) {
  if (!publicSite.includes(value)) throw new Error(`Public navigation is not centralized: ${value}`)
}

if (!publicShell.includes("from '@/lib/config/public-site'")) throw new Error('Public shell must consume centralized public navigation')

if (!publicShell.includes('<BinsoLogo />')) throw new Error('Public header must use the canonical original Binso logo')
if (publicShell.includes('<span>One</span>')) throw new Error('Public header must not reconstruct the logo with separate text')
if (!publicShell.includes("light ? 'public-site-light'")) throw new Error('Public shell must support the fixed light landing mode')
if (!appUi.includes('.public-site-light{')) throw new Error('Fixed light public landing theme is missing')

const hardCodedContactPattern = /Weissbadstrasse 8b|\+41 58 510 77 58|oemer\.cam@binso\.ch/
for (const [name, source] of [['contact', contact], ['imprint', imprint], ['privacy', privacy]]) {
  if (hardCodedContactPattern.test(source)) throw new Error(`${name} page contains hard-coded contact data instead of appIdentity`)
}


for (const value of ['DashboardProductVisual', 'LandingProofVisual', 'FeatureStoryVisual', 'BusinessFlowVisual', 'OnboardingVisual']) {
  if (!productVisuals.includes(value)) throw new Error(`Missing public product visual: ${value}`)
}

for (const value of ['Alle akzeptieren', 'Nur notwendige', 'Auswahl speichern', 'cookie-settings-panel']) {
  if (!cookieConsent.includes(value)) throw new Error(`Cookie consent is missing canonical control: ${value}`)
}

for (const obsolete of ['.public-hero-preview{', '.preview-window-head{', '.public-module-grid{', '.cookie-layer{', '.cookie-panel{']) {
  if (appUi.includes(obsolete)) throw new Error(`Obsolete public style remains: ${obsolete}`)
}

console.log('Design-system checks passed (tokens, public/auth ownership, original logo, fixed-light landing, marketing visuals, cookie consent, centralized brand/contact/navigation).')
