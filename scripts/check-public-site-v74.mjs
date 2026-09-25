import fs from 'node:fs'

const exists = (path) => fs.existsSync(path)
const read = (path) => fs.readFileSync(path, 'utf8')

function assertAny(paths, label) {
  if (!paths.some(exists)) throw new Error(`Missing required public-site asset: ${label}`)
}

function assertIncludes(path, expected) {
  if (!read(path).includes(expected)) throw new Error(`${path} is missing public-site marker: ${expected}`)
}

for (const path of [
  'app/robots.ts',
  'app/sitemap.ts',
  'app/register/layout.tsx',
  'app/sign-in/layout.tsx',
  'app/onboarding/layout.tsx',
  'app/support/layout.tsx',
  'lib/config/seo.ts',
]) if (!exists(path)) throw new Error(`Missing required public-site file: ${path}`)

// Modern Next.js image routes are valid replacements for the original static V74 PNGs.
assertAny(['app/opengraph-image.tsx', 'app/opengraph-image.png'], 'OpenGraph image route')

assertIncludes('app/page.tsx', 'Schweizer Dienstleistungsunternehmen')
assertIncludes('app/page.tsx', '30 Tage kostenlos testen')
assertIncludes('app/layout.tsx', 'metadataBase')
assertIncludes('app/layout.tsx', 'publicBaseUrl')
assertIncludes('lib/config/public-site.ts', 'ROUTES.public.contact')
assertIncludes('lib/config/public-site.ts', 'ROUTES.public.imprint')
assertIncludes('components/public/public-mobile-menu.tsx', "document.body.style.overflow = 'hidden'")
assertIncludes('components/public/public-mobile-menu.tsx', 'aria-controls="public-mobile-navigation"')
assertIncludes('app/robots.ts', "'/api/'")
assertIncludes('app/sitemap.ts', 'publicSite.sitemapRoutes')
assertIncludes('app/register/layout.tsx', 'index: false')
assertIncludes('.github/workflows/main_binso-admin-prod.yml', 'pnpm run v79:check')

const version = JSON.parse(read('package.json')).version
if (!/^0\.(?:7[4-9]|[89]\d)\./.test(version)) throw new Error(`Unexpected product version for public-site compatibility: ${version}`)

console.log('Public site, SEO and conversion compatibility checks passed.')
