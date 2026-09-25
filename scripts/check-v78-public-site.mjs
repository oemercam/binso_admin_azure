import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
assert.ok(['0.78.0', '0.79.0', '0.80.0', '0.81.0', '0.81.2'].includes(packageJson.version))

const required = [
  'app/admin-access/page.tsx',
  'app/admin-access/layout.tsx',
  'app/sign-in/page.tsx',
  'components/public/marketing-screenshot.tsx',
  'lib/config/public-site.ts',
]
for (const file of required) assert.ok(existsSync(file), `Missing V78 file: ${file}`)

const shell = readFileSync('components/public/public-shell.tsx', 'utf8')
const navigation = readFileSync('lib/config/public-site.ts', 'utf8')
const signIn = readFileSync('app/sign-in/page.tsx', 'utf8')
const admin = readFileSync('app/admin-access/page.tsx', 'utf8')
const landing = readFileSync('app/page.tsx', 'utf8')
const authRoute = readFileSync('app/api/auth/login/route.ts', 'utf8')

assert.match(shell, /href="\/sign-in">Kundenlogin/)
assert.match(navigation, /Admin-Zugang/)
assert.match(navigation, /Kunden-Login/)
assert.doesNotMatch(navigation, /primaryNavigation:[\s\S]*?Startseite/)
assert.match(signIn, /Zum Kunden-Login/)
assert.match(signIn, /customerSignInUrl/)
assert.doesNotMatch(signIn, />Mit Microsoft anmelden</)
assert.match(admin, /Mit Microsoft anmelden/)
assert.match(admin, /adminSignInUrl/)
assert.match(authRoute, /audience === 'admin'/)
assert.match(authRoute, /authAdminProviderName/)
assert.match(landing, /MarketingScreenshot name="dashboard" priority/)
assert.match(readFileSync('.github/workflows/main_binso-admin-prod.yml', 'utf8'), /pnpm run v78:check/)
assert.doesNotMatch(landing, /DashboardProductVisual/)

for (const shot of ['dashboard','customers','quotes','orders','time','invoices']) {
  assert.ok(existsSync(`public/marketing/screenshots/${shot}-desktop.png`), `Missing real marketing screenshot: ${shot}-desktop.png`)
}

function walk(dir, result = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path, result)
    else if (/\.(tsx|ts)$/.test(name)) result.push(path)
  }
  return result
}

function routeExists(href) {
  if (href === '/') return existsSync('app/page.tsx')
  if (href.startsWith('/api/')) return true
  const clean = href.replace(/^\//, '')
  return existsSync(`app/${clean}/page.tsx`) || existsSync(`app/(app)/${clean}/page.tsx`)
}

const files = [...walk('app'), ...walk('components/public')]
const failures = []
for (const file of files) {
  const source = readFileSync(file, 'utf8')
  for (const match of source.matchAll(/href=["'](\/[^"'?#${}]*)["']/g)) {
    const href = match[1]
    if (!routeExists(href)) failures.push(`${relative('.', file)} -> ${href}`)
  }
}
assert.deepEqual(failures, [], `Broken static internal links:\n${failures.join('\n')}`)

console.log(`V78 public site checks passed (${files.length} source files, customer/admin login separated, static links validated).`)
