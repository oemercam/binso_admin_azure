import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = process.cwd()
const sourceRoots = ['app', 'components', 'lib', 'hooks', 'modules', 'types']
const files = []
for (const base of sourceRoots) {
  const directory = join(root, base)
  if (existsSync(directory)) walk(directory)
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path)
    else if (/\.(tsx?|css)$/.test(name)) files.push(path)
  }
}

const failures = []
const rel = (path) => relative(root, path).replaceAll('\\', '/')
const content = new Map(files.map((file) => [file, readFileSync(file, 'utf8')]))

function forbid(pattern, message, allow = () => false) {
  for (const [file, text] of content) {
    if (allow(rel(file))) continue
    if (pattern.test(text)) failures.push(`${rel(file)}: ${message}`)
  }
}

forbid(/\b(?:mobileNavItems|pwaNavItems|desktopNavItems)\b/, 'parallel navigation data source is forbidden')
forbid(/(?:Pwa|PWA)(?:Menu|Navigation|Header)/, 'PWA-specific visual navigation/header component is forbidden')
forbid(/window\.visualViewport|window\.innerHeight/, 'viewport APIs must stay in DeviceEnvironmentProvider', (f) => f === 'components/providers/device-environment-provider.tsx')
forbid(/--app-mobile-gutter\s*:/, 'mobile gutter may only be defined in app/app-ui.css', (f) => f === 'app/app-ui.css')
forbid(/<select\b|<textarea\b|<input\b/, 'business/shared UI must use canonical form controls', (f) => f === 'components/ui/form-controls.tsx')
forbid(/(?:>\s*[×X]\s*<|name=["']close["'])/, 'raw close/remove controls are forbidden', (f) => f === 'components/ui/close-button.tsx')
forbid(/\/brand\/(?:logo|icon)-black\.svg/, 'app identity assets must be rendered through AppLogo', (f) => f === 'components/ui/binso-logo.tsx' || f === 'components/documents/business-document.tsx')

const navSource = readFileSync(join(root, 'components/navigation/nav-items.ts'), 'utf8')
for (const role of ['owner', 'admin', 'finance', 'employee']) {
  if (!navSource.includes(`'${role}'`)) failures.push(`nav-items.ts: role ${role} is missing`)
}
for (const nav of ['components/navigation/desktop-nav.tsx', 'components/navigation/mobile-pill-nav.tsx']) {
  const text = readFileSync(join(root, nav), 'utf8')
  if (!text.includes('navForRole(')) failures.push(`${nav}: must consume navForRole()`)
}
const appShell = readFileSync(join(root, 'components/app-shell/app-shell.tsx'), 'utf8')
if (!appShell.includes('<MobilePillNav')) failures.push('AppShell: MobilePillNav must remain the shared mobile/PWA entry point')

const css = readFileSync(join(root, 'app/app-ui.css'), 'utf8')
for (const selector of ['mobile-menu-sheet', 'mobile-menu-nav', 'navigation-item-mobile', 'ui-overlay-control']) {
  const pattern = new RegExp(`\\.${selector}\\s*\\{`, 'g')
  const count = (css.match(pattern) || []).length
  if (count !== 1) failures.push(`app/app-ui.css: expected exactly one canonical .${selector} definition, found ${count}`)
}
if ((css.match(/--app-mobile-gutter\s*:/g) || []).length !== 1) failures.push('app/app-ui.css: --app-mobile-gutter must have one declaration')

if (failures.length) {
  console.error(`Architecture checks failed (${failures.length}):`)
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log(`Architecture checks passed (${files.length} source/style files scanned).`)
