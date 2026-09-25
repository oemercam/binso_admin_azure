import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, extname, join, resolve } from 'node:path'

const ROOT = process.cwd()
const sourceRoots = ['app', 'components', 'lib', 'modules', 'types']
const extensions = ['.ts', '.tsx', '.mjs', '.js', '.css']

function walk(directory, out = []) {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name)
    const stat = statSync(path)
    if (stat.isDirectory()) walk(path, out)
    else if (/\.(?:ts|tsx|mjs|js|css)$/.test(name)) out.push(path)
  }
  return out
}

const files = sourceRoots.flatMap((root) => walk(root))
const failures = []
const fail = (message) => failures.push(message)
const relativePath = (file) => file.replaceAll('\\', '/')

function resolveLocalImport(fromFile, specifier) {
  let base
  if (specifier.startsWith('@/')) base = join(ROOT, specifier.slice(2))
  else if (specifier.startsWith('.')) base = resolve(dirname(join(ROOT, fromFile)), specifier)
  else return true
  if (existsSync(base) && statSync(base).isFile()) return true
  if (extname(base)) return existsSync(base)
  for (const ext of extensions) if (existsSync(base + ext)) return true
  for (const ext of extensions) if (existsSync(join(base, `index${ext}`))) return true
  return false
}

for (const file of files.filter((file) => /\.(?:ts|tsx|mjs|js)$/.test(file))) {
  const source = readFileSync(file, 'utf8')
  for (const match of source.matchAll(/(?:from\s+|import\s*\()(['"])([^'"]+)\1/g)) {
    const specifier = match[2]
    if ((specifier.startsWith('@/') || specifier.startsWith('.')) && !resolveLocalImport(file, specifier)) {
      fail(`${file}: unresolved local import ${specifier}`)
    }
  }
}

const rawFetchAllowlist = new Set([
  'lib/http/api-client.ts',
  'lib/email/graph.ts',
  'lib/billing/stripe.ts',
  'components/state/business-store.tsx',
  'app/error.tsx',
])
for (const file of files.filter((file) => /\.(?:ts|tsx)$/.test(file))) {
  const source = readFileSync(file, 'utf8')
  const normalizedFile = relativePath(file)
  if (/\bfetch\(/.test(source) && !rawFetchAllowlist.has(normalizedFile)) fail(`${normalizedFile}: use apiRequest instead of ad-hoc fetch`)
  if (/process\.env\.[A-Z0-9_]+/.test(source) && !normalizedFile.startsWith('lib/config/')) fail(`${normalizedFile}: environment access must go through lib/config`)
  if ((/Intl\.(?:NumberFormat|DateTimeFormat)\(/.test(source) || /toLocale(?:String|DateString)\(['"]de-CH['"]\)/.test(source)) && normalizedFile !== 'lib/format/locale.ts') fail(`${normalizedFile}: de-CH formatting must use lib/format/locale`)
  if (/console\.(?:log|info|warn|error)\(/.test(source) && normalizedFile !== 'lib/logging/server.ts') fail(`${normalizedFile}: runtime logging must use lib/logging/server`)
}

for (const file of files.filter((file) => relativePath(file).startsWith('app/api/') && /route\.ts$/.test(file))) {
  const source = readFileSync(file, 'utf8')
  const normalizedFile = relativePath(file)
  if (source.includes('NextResponse.json')) fail(`${normalizedFile}: JSON responses must use server-api helpers`)
  if (source.includes('request.json()')) fail(`${normalizedFile}: request bodies must use bounded readJsonBody`)
  if (/readJsonBody(?:<[^>\n]*>)?\(\s*request\s*,\s*[0-9][0-9_]*/.test(source)) fail(`${normalizedFile}: request-body byte limits must use PRODUCT_LIMITS`)
}

const routesSource = readFileSync('lib/navigation/routes.ts', 'utf8')
function routeKeys(section) {
  const match = routesSource.match(new RegExp(`${section}: \\{([\\s\\S]*?)\\n  \\},`))
  if (!match) return new Set()
  return new Set([...match[1].matchAll(/^\s{4}([A-Za-z0-9_]+):/gm)].map((item) => item[1]))
}
const routeSections = new Map(['public', 'auth', 'app', 'platform'].map((section) => [section, routeKeys(section)]))
for (const file of files.filter((file) => /\.(?:ts|tsx)$/.test(file))) {
  const source = readFileSync(file, 'utf8')
  for (const match of source.matchAll(/ROUTES\.(public|auth|app|platform)\.([A-Za-z0-9_]+)/g)) {
    if (!routeSections.get(match[1])?.has(match[2])) fail(`${file}: unknown route key ROUTES.${match[1]}.${match[2]}`)
  }
}

const standardized = readFileSync('app/standardized-ui.css', 'utf8')
for (const css of ['tokens.css', 'base.css', 'app-shell.css', 'public.css', 'pricing.css', 'forms.css', 'data.css', 'overlays.css']) {
  if (!standardized.includes(`./styles/${css}`)) fail(`app/standardized-ui.css: missing ${css}`)
}

const layout = readFileSync('app/layout.tsx', 'utf8')
const legacyIndex = layout.indexOf("./app-ui.css")
const standardIndex = layout.indexOf("./standardized-ui.css")
if (legacyIndex < 0 || standardIndex < 0 || standardIndex < legacyIndex) fail('app/layout.tsx: standardized-ui.css must load after legacy app-ui.css')

const appShellCss = readFileSync('app/styles/app-shell.css', 'utf8')
if (!appShellCss.includes('left:50%!important') || !appShellCss.includes('translateX(-50%)!important')) fail('mobile pill must be anchored to the viewport centre')
if (!appShellCss.includes('var(--ui-safe-bottom)')) fail('mobile pill must respect bottom safe area')

const product = readFileSync('lib/config/product.ts', 'utf8')
for (const marker of ['TRIAL_DAYS = 14', 'DEMO_ACCESS_HOURS = 24', 'MIN_TOUCH_TARGET_PX = 44', 'defaultApiBodyBytes']) {
  if (!product.includes(marker)) fail(`lib/config/product.ts: missing ${marker}`)
}

if (failures.length) {
  console.error(`Code consistency check failed (${failures.length}):`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log(`Code consistency checks passed (${files.length} source/style files scanned).`)
