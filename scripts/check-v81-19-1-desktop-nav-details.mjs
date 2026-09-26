import fs from 'node:fs'
import assert from 'node:assert/strict'
import { assertVersionAtLeast } from './version-check.mjs'

const nav = fs.readFileSync('components/navigation/desktop-nav.tsx', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

assertVersionAtLeast(assert, pkg.version, '0.81.19.1')
assert.ok(nav.includes('open={moreActive || undefined}'))
assert.ok(!nav.includes('defaultOpen='))
assert.ok(nav.includes('desktop-nav-more'))

console.log('V81.19.1 desktop navigation details compatibility check passed.')
