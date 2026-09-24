# V74 – Public Site, SEO and Conversion

V74 improves the public Binso One experience without changing the authenticated business workflows.

## Implemented

- Clearer SaaS positioning for Swiss service companies.
- Consistent 14-day trial calls to action without claiming a live demo.
- Cleaner desktop, tablet and mobile public navigation.
- Tablet navigation fallback when the desktop navigation is hidden.
- Mobile menu body-scroll lock and improved ARIA state.
- Dedicated contact paths for product questions, support and telephone contact.
- Page-specific metadata for core marketing, status and legal pages.
- Canonical URLs, Open Graph and Twitter metadata.
- Dedicated 1200×630 social preview images for Open Graph and Twitter.
- `robots.txt` and `sitemap.xml` generated through Next.js metadata routes.
- Private application, authentication, registration, onboarding and support routes excluded from crawling.
- Structured `SoftwareApplication` and `Organization` data on the landing page.
- Production base URL wired into the build through `BINSO_ONE_BASE_URL`.
- CI check `public-site:check` to prevent accidental removal of the public-site foundation.
- Existing favicon, app icon, Apple icon and PWA manifest retained.

## SEO scope

The sitemap contains the public marketing pages plus status and legal information. Authenticated application routes, API routes, onboarding, registration, sign-in and customer support are not intended as search landing pages and are excluded from crawling.

## Conversion scope

The landing page communicates the target audience, the connected workflow, trial conditions and direct contact options earlier and more consistently. The existing product visuals remain illustrative UI previews and are not labelled as a live demo.

## Validation

`pnpm run public-site:check` validates the V74 public-site foundation. The normal repository quality gates still remain authoritative for lint, typecheck, tests and the production build.
