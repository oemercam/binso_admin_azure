import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = process.cwd()
const sourceRoots = ['app', 'components', 'lib', 'hooks', 'modules', 'types']
const files = []
for (const base of sourceRoots) walk(join(root, base))

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
forbid(/window\.addEventListener\(['"]scroll['"]/, 'window scroll listener must stay in the shared scroll observer', (f) => f === 'lib/browser/window-scroll.ts')
forbid(/document\.body\.style\.(?:overflow|overscrollBehavior|position|top|left|right|width)/, 'document scroll locking must stay in OverlayManager', (f) => f === 'components/ui/overlay-manager.ts')
forbid(/new Intl\.(?:NumberFormat|DateTimeFormat)|\.toLocaleString\(|\.toLocaleDateString\(/, 'visible locale formatting must use lib/format/locale', (f) => f === 'lib/format/locale.ts')
forbid(/--app-mobile-gutter\s*:/, 'mobile gutter may only be defined in app/globals.css', (f) => f === 'app/globals.css')
forbid(/<select\b|<textarea\b|<input\b/, 'business/shared UI must use canonical form controls', (f) => f === 'components/ui/form-controls.tsx')
forbid(/<Input\b[^>]*\btype=[\"']date[\"']/, 'business pages must use canonical DatePicker instead of Input type=date')
forbid(/<Input\b[^>]*\btype=[\"']checkbox[\"']/, 'business pages must use canonical Checkbox instead of Input type=checkbox')
forbid(/(?:>\s*[×X]\s*<|name=["']close["'])/, 'raw close/remove controls are forbidden', (f) => f === 'components/ui/close-button.tsx' || f === 'components/ui/form-controls.tsx')
forbid(/\/brand\/(?:logo|icon)-black\.svg/, 'app identity assets must be rendered through AppLogo', (f) => f === 'components/ui/binso-logo.tsx' || f === 'components/documents/business-document.tsx')


const envConfig = readFileSync(join(root, 'lib/config/env.ts'), 'utf8')
if (envConfig.includes('ALLOW_LOCAL_AUTH')) failures.push('lib/config/env.ts: production local-auth bypass is forbidden')

const serviceWorker = readFileSync(join(root, 'public/sw.js'), 'utf8')
if (/cache\.add\(OFFLINE_URL\)[\s\S]{0,120}skipWaiting\(\)/.test(serviceWorker)) {
  failures.push('public/sw.js: install must not force skipWaiting; updates require explicit user action')
}
if (!serviceWorker.includes('safeAppPath')) failures.push('public/sw.js: push notification navigation must be restricted to same-origin app paths')

const pushSubscriptionsRoute = readFileSync(join(root, 'app/api/push/subscriptions/route.ts'), 'utf8')
if (pushSubscriptionsRoute.includes('stored: true')) failures.push('push subscriptions API must not claim persistence without durable storage')

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
const globalCss = readFileSync(join(root, 'app/globals.css'), 'utf8')
for (const selector of ['mobile-menu-sheet', 'mobile-menu-nav', 'navigation-item-mobile', 'ui-overlay-control']) {
  const pattern = new RegExp(`\\.${selector}\\s*\\{`, 'g')
  const count = (css.match(pattern) || []).length
  if (count !== 1) failures.push(`app/app-ui.css: expected exactly one canonical .${selector} definition, found ${count}`)
}
if ((globalCss.match(/--app-mobile-gutter\s*:/g) || []).length !== 1) failures.push('app/globals.css: --app-mobile-gutter must have one declaration')

if (failures.length) {
  console.error(`Architecture checks failed (${failures.length}):`)
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log(`Architecture checks passed (${files.length} source/style files scanned).`)
