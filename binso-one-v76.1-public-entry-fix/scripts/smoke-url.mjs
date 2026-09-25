import assert from 'node:assert/strict'

const base = process.argv[2]?.replace(/\/$/, '')
if (!base) throw new Error('Usage: node scripts/smoke-url.mjs https://staging.example')

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function waitForHealth() {
  const url = `${base}/api/health`
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(30_000) })
      if (response.status >= 200 && response.status < 400) {
        console.log(`Staging health ready on attempt ${attempt}: HTTP ${response.status}`)
        return
      }
      console.log(`Staging health attempt ${attempt}/30 returned HTTP ${response.status}`)
    } catch (error) {
      console.log(`Staging health attempt ${attempt}/30 failed: ${error instanceof Error ? error.message : String(error)}`)
    }
    if (attempt < 30) await sleep(10_000)
  }
  throw new Error('Staging health did not become ready within the allowed time')
}

async function assertRoute(path) {
  const response = await fetch(`${base}${path}`, { redirect: 'manual', signal: AbortSignal.timeout(30_000) })
  assert.ok(response.status >= 200 && response.status < 400, `${path}: HTTP ${response.status}`)
  console.log(`${path}: HTTP ${response.status}`)
}

await waitForHealth()
await assertRoute('/')
await assertRoute('/pricing')
console.log('Remote smoke validation passed.')
