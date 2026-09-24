import assert from 'node:assert/strict'
const base = process.argv[2]?.replace(/\/$/,'')
if (!base) throw new Error('Usage: node scripts/smoke-url.mjs https://staging.example')
for (const path of ['/','/api/health','/pricing']) {
  const response = await fetch(`${base}${path}`, { redirect: 'manual', signal: AbortSignal.timeout(10_000) })
  assert.ok(response.status >= 200 && response.status < 400, `${path}: HTTP ${response.status}`)
}
console.log('Remote smoke validation passed.')
