import fs from 'node:fs'

const tokens = fs.readFileSync('app/styles/tokens.css', 'utf8')
const standardized = fs.readFileSync('app/standardized-ui.css', 'utf8')
const canonical = fs.readFileSync('app/styles/public-responsive-system.css', 'utf8')
const shell = fs.readFileSync('components/public/public-shell.tsx', 'utf8')
const menu = fs.readFileSync('components/public/public-mobile-menu.tsx', 'utf8')
const routes = fs.readFileSync('lib/config/public-site.ts', 'utf8')
const manifest = fs.readFileSync('app/manifest.ts', 'utf8')
const layout = fs.readFileSync('app/layout.tsx', 'utf8')
const e2e = fs.readFileSync('tests/e2e/responsive-robustness.spec.ts', 'utf8')

const requiredTokens = [
  '--public-shell-max:', '--public-content-max:', '--public-reading-max:', '--public-gutter:',
  '--public-h1:', '--public-h2:', '--public-body:', '--public-nav:', '--public-control:',
  '--public-radius:', '--public-line:', '--public-ink:', '--public-copy:', '--public-blue:'
]
for (const token of requiredTokens) if (!tokens.includes(token)) throw new Error(`Missing public token ${token}`)

const publicImport = standardized.indexOf("@import './styles/public-responsive-system.css';")
const pwaImport = standardized.indexOf("@import './styles/mobile-pwa-system.css';")
if (publicImport < 0 || (pwaImport >= 0 && pwaImport < publicImport)) {
  throw new Error('Canonical public responsive system must load before the final Mobile/PWA ownership layer')
}
for (const selector of ['.v80-header-inner', '.v816-hero-copy h1', '.v812-page-intro h1', '.v80-footer-main', '@media(max-width:960px)', '@media(display-mode:standalone)']) {
  if (!canonical.includes(selector)) throw new Error(`Canonical responsive layer missing ${selector}`)
}
if (!canonical.includes('font-size:16px') || !canonical.includes('--public-control')) throw new Error('Mobile form/touch sizing is not protected')
if (!canonical.includes('var(--ui-safe-top)') || !canonical.includes('var(--ui-safe-bottom)')) throw new Error('PWA safe-area handling missing')
if (!shell.includes("from '@/lib/config/public-site'")) throw new Error('Public shell navigation must remain centralized')
if (!menu.includes('publicSite.primaryNavigation.map')) throw new Error('Mobile menu must consume centralized primary navigation')
for (const group of ['primaryNavigation', 'productNavigation', 'helpNavigation', 'accessNavigation', 'adminNavigation', 'legalNavigation']) {
  if (!routes.includes(group)) throw new Error(`Central public navigation group missing: ${group}`)
}
if (!manifest.includes("display: 'standalone'")) throw new Error('PWA manifest must remain standalone')
if (!layout.includes("viewportFit: 'cover'")) throw new Error('PWA viewport must remain viewport-fit=cover')
for (const marker of ['V81.16 public layout matrix', '320, 360, 390, 430, 768, 834, 1024, 1440, 1920']) {
  if (!e2e.includes(marker)) throw new Error(`Responsive E2E matrix missing marker: ${marker}`)
}
console.log('V81.16 canonical public responsive-system checks passed')
