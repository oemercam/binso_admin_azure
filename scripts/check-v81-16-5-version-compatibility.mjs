import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { versionAtLeast } from './version-check.mjs'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
assert.ok(versionAtLeast(pkg.version, '0.81.16.5'))
assert.ok(versionAtLeast(pkg.version, '0.81.16'))
assert.ok(versionAtLeast('0.81.16.5', '0.81.16'))
assert.ok(versionAtLeast('0.82.0', '0.81.16'))
assert.equal(versionAtLeast('0.81.15', '0.81.16'), false)

for (const file of [
  'scripts/check-v76-public-entry.mjs',
  'scripts/check-v77-cicd-performance.mjs',
  'scripts/check-v78-public-site.mjs',
  'scripts/check-v80-public-redesign.mjs',
  'scripts/check-v819-public-visual.mjs',
  'scripts/check-v8110-public-visual-fixes.mjs',
  'scripts/check-v8111-public-e2e-reliability.mjs',
  'scripts/check-v81-12-register-shell.mjs',
  'scripts/check-v81-13-public-route-qa.mjs',
]) {
  const source = readFileSync(file, 'utf8')
  assert.match(source, /assertVersionAtLeast/)
  assert.doesNotMatch(source, /\.includes\((?:pkg|packageJson)\.version\)/)
}

console.log('V81.16.5 version compatibility checks passed')
