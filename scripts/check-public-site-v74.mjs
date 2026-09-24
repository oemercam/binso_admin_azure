import fs from 'node:fs'

function read(path) {
  return fs.readFileSync(path, 'utf8')
}

function assertIncludes(path, expected) {
  const content = read(path)
  if (!content.includes(expected)) {
    throw new Error(`${path} is missing required V74 marker: ${expected}`)
  }
}

for (const path of [
  'app/robots.ts',
  'app/sitemap.ts',
  'app/opengraph-image.png',
  'app/twitter-image.png',
  'app/register/layout.tsx',
  'app/sign-in/layout.tsx',
  'app/onboarding/layout.tsx',
  'app/support/layout.tsx',
  'lib/config/seo.ts',
]) {
  if (!fs.existsSync(path)) throw new Error(`Missing required V74 file: ${path}`)
}

assertIncludes('app/page.tsx', 'Business-Software für Schweizer Dienstleistungsunternehmen')
assertIncludes('app/page.tsx', '14 Tage kostenlos testen')
assertIncludes('app/page.tsx', 'application/ld+json')
assertIncludes('app/page.tsx', 'landing-value-strip')
assertIncludes('app/page.tsx', 'landing-contact-cta')
assertIncludes('app/layout.tsx', 'metadataBase')
assertIncludes('app/layout.tsx', 'publicBaseUrl')
assertIncludes('lib/config/public-site.ts', "{ href: '/contact', label: 'Kontakt' }")
assertIncludes('lib/config/public-site.ts', "'/legal/imprint'")
assertIncludes('components/public/public-mobile-menu.tsx', "document.body.style.overflow = 'hidden'")
assertIncludes('components/public/public-mobile-menu.tsx', 'aria-controls="public-mobile-navigation"')
assertIncludes('app/robots.ts', "'/api/'")
assertIncludes('app/sitemap.ts', 'publicSite.sitemapRoutes')
assertIncludes('app/register/layout.tsx', 'index: false')
assertIncludes('.github/workflows/main_binso-admin-prod.yml', 'NEXT_PUBLIC_SITE_URL')
assertIncludes('.github/workflows/main_binso-admin-prod.yml', 'pnpm run public-site:check')
assertIncludes('package.json', '"version": "0.74.0"')

console.log('V74 public site, SEO and conversion checks passed')
