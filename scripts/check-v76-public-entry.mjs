import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { assertVersionAtLeast } from './version-check.mjs'

const landing = readFileSync('app/page.tsx', 'utf8')
const signIn = readFileSync('app/sign-in/page.tsx', 'utf8')
const onboarding = readFileSync('app/onboarding/page.tsx', 'utf8')
const shell = readFileSync('components/public/public-shell.tsx', 'utf8')
const consent = readFileSync('components/public/cookie-consent.tsx', 'utf8')
const marketing = readFileSync('lib/config/marketing-content.ts', 'utf8')
const language = readFileSync('lib/config/product-language.ts', 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))

assertVersionAtLeast(assert, packageJson.version, '0.76.0')
assert.match(landing, /(?:public-landing-v(?:76|78)|v80-main|v816-home)/)
assert.match(landing, /Marketing(?:Dashboard)?Screenshot/)
assert.match(signIn, /entry-auth-page/)
assert.match(signIn, /Kunden-Login/)
assert.match(onboarding, /const steps = \['Angaben prüfen', 'Unternehmen ergänzen', 'Fertig'\]/)
assert.doesNotMatch(onboarding, /Module auswählen|onboarding-module-grid/)
assert.match(onboarding, /Kein Pflichtfeld in diesem Schritt/)
assert.match(shell, /href="\/sign-in"/)
assert.ok(/NEXT_PUBLIC_OPTIONAL_ANALYTICS/.test(consent) || /publicEnv\.optionalAnalytics/.test(consent))
assert.match(consent, /showBanner = OPTIONAL_ANALYTICS_ENABLED/)
assert.match(marketing, /Kunden und Kontakte/)
assert.match(language, /quote: 'Angebot'/)
assert.ok(packageJson.scripts['marketing:screenshots'])

console.log('V76 public entry, login, onboarding and marketing checks passed.')
