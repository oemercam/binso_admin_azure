import process from 'node:process'

const base = (process.env.APP_BASE_URL || '').trim().replace(/\/$/, '')
if (!base || !/^https:\/\//i.test(base)) {
  console.error('FAIL: APP_BASE_URL must be the HTTPS production URL.')
  process.exit(1)
}

const checks = [
  ['/api/health', 'application/json'],
  ['/', 'text/html'],
  ['/pricing', 'text/html'],
  ['/register?mode=trial&plan=business', 'text/html'],
  ['/register?mode=subscription&plan=business', 'text/html'],
  ['/register?mode=demo', 'text/html'],
  ['/legal/privacy', 'text/html'],
  ['/legal/terms', 'text/html'],
  ['/legal/dpa', 'text/html'],
  ['/legal/subprocessors', 'text/html'],
]

let failed = false
for (const [path, expectedType] of checks) {
  const url = `${base}${path}`
  try {
    const response = await fetch(url, { redirect: 'follow', cache: 'no-store', signal: AbortSignal.timeout(15_000) })
    const type = response.headers.get('content-type') || ''
    if (!response.ok || !type.includes(expectedType)) {
      failed = true
      console.error(`FAIL: ${path} -> HTTP ${response.status}, content-type=${type || 'missing'}`)
      continue
    }
    console.log(`OK: ${path} -> ${response.status}`)
  } catch (error) {
    failed = true
    console.error(`FAIL: ${path} -> ${error instanceof Error ? error.message : 'request failed'}`)
  }
}

if (failed) process.exit(1)
console.log('Production public acceptance smoke passed.')
