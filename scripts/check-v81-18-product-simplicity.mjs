import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { assertVersionAtLeast } from './version-check.mjs'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
assertVersionAtLeast(assert, pkg.version, '0.81.18')

const nav = readFileSync('components/navigation/nav-items.ts', 'utf8')
const desktop = readFileSync('components/navigation/desktop-nav.tsx', 'utf8')
const mobile = readFileSync('components/navigation/mobile-pill-nav.tsx', 'utf8')
const shell = readFileSync('components/app-shell/app-shell.tsx', 'utf8')
const work = readFileSync('app/(app)/work/page.tsx', 'utf8')
const finance = readFileSync('app/(app)/finance/page.tsx', 'utf8')
const accounting = readFileSync('app/(app)/accounting/page.tsx', 'utf8')
const settings = readFileSync('app/(app)/settings/page.tsx', 'utf8')
const quick = readFileSync('components/navigation/action-items.ts', 'utf8')
const css = readFileSync('app/styles/product-simplicity.css', 'utf8')
const routes = readFileSync('lib/navigation/routes.ts', 'utf8')
const workflow = readFileSync('.github/workflows/main_binso-admin-prod.yml', 'utf8')
const e2e = readFileSync('tests/e2e/responsive-robustness.spec.ts', 'utf8')

for (const label of ['Übersicht', 'Kunden', 'Arbeit', 'Zeit', 'Rechnungen']) {
  assert.match(nav, new RegExp(`label: '${label}'[\\s\\S]*placement: 'primary'`), `${label} must be primary`)
}
assert.equal((nav.match(/placement: 'primary'/g) ?? []).length, 5, 'exactly five primary navigation areas')
for (const label of ['Angebote', 'Aufträge', 'Verträge']) assert.match(nav, new RegExp(`label: '${label}'[\\s\\S]*placement: 'work'`))
for (const label of ['Offene Posten', 'Daten', 'Organisation', 'Mein Konto']) assert.match(nav, new RegExp(`label: '${label}'[\\s\\S]*placement: 'hidden'`))
assert.match(routes, /work: '\/work'/)
assert.ok(existsSync('app/(app)/work/page.tsx'))
assert.match(work, /Angebote, Aufträge und Verträge an einem Ort/)
assert.match(desktop, /desktop-nav-more/)
assert.match(mobile, /mobile-primary-nav/)
assert.match(mobile, /title="Mehr"/)
assert.match(shell, /aria-label="Neu erstellen"/)
assert.match(shell, /topbar-mobile-search/)
assert.match(finance, /Offene Posten und Kosten/)
assert.match(accounting, /title="Offene Posten"/)
assert.doesNotMatch(accounting, /title="Buchhaltung"/)
assert.match(settings, /Organisation und Abo/)
assert.match(settings, /Mein Konto/)
assert.match(settings, /href="\/data"/)
assert.equal((quick.match(/label: '(?:Kunde erfassen|Angebot erstellen|Auftrag erstellen|Zeit erfassen|Rechnung erstellen)'/g) ?? []).length, 5)
assert.doesNotMatch(quick, /label: 'Vertrag erfassen'/)
assert.doesNotMatch(quick, /label: 'Zahlung erfassen'/)
assert.match(css, /Product simplicity/)
assert.match(workflow, /pnpm run v81\.18:check/)
assert.match(e2e, /V81\.18 authenticated navigation exposes only the simple product model/)

console.log('V81.18 product simplicity checks passed.')
