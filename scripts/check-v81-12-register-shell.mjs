import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const register = readFileSync('app/register/page.tsx', 'utf8')
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

assert.ok(['0.81.12', '0.81.13', '0.81.14', '0.81.15', '0.81.16'].includes(pkg.version))
assert.match(register, /function RegisterLoadingShell\(\)/)
assert.match(register, /<Suspense fallback={<RegisterLoadingShell \/>}>/)
assert.match(register, /<PublicShell light>/)
assert.match(register, /Registrierung wird vorbereitet\./)
console.log('V81.12 registration shell reliability checks passed')
