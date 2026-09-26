import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { assertVersionAtLeast } from './version-check.mjs'

const register = readFileSync('app/register/page.tsx', 'utf8')
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

assertVersionAtLeast(assert, pkg.version, '0.81.12')
assert.match(register, /function RegisterLoadingShell\(\)/)
assert.match(register, /<Suspense fallback={<RegisterLoadingShell \/>}>/)
assert.match(register, /<PublicShell light>/)
assert.match(register, /Registrierung wird vorbereitet\./)
console.log('V81.12 registration shell reliability checks passed')
