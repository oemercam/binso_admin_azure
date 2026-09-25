import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const required = [
  'lib/config/product.ts',
  'lib/config/public-env.ts',
  'lib/config/server-env.ts',
  'lib/navigation/routes.ts',
  'lib/validation/common.ts',
  'lib/http/client-errors.ts',
  'lib/http/api-client.ts',
  'lib/status/presentation.ts',
  'lib/logging/server.ts',
  'lib/auth/internal-job.ts',
  'lib/auth/platform-permissions.ts',
  'app/standardized-ui.css',
  'app/styles/tokens.css',
  'app/styles/base.css',
  'app/styles/app-shell.css',
  'app/styles/public.css',
  'app/styles/auth.css',
  'app/styles/pricing.css',
  'app/styles/forms.css',
  'app/styles/data.css',
  'app/styles/overlays.css',
  'app/customer-manifest.webmanifest/route.ts',
  'app/admin-manifest.webmanifest/route.ts',
  'database/migrations/0014_v79_demo_access.sql',
  'lib/data/demo-workspace.ts',
  'tests/e2e/responsive-robustness.spec.ts',
]
for (const file of required) if (!existsSync(file)) throw new Error(`V79 foundation: missing ${file}`)

const registration = readFileSync('app/api/registration/route.ts', 'utf8')
const appLayout = readFileSync('app/(app)/layout.tsx', 'utf8')
const adminLayout = readFileSync('app/admin-access/layout.tsx', 'utf8')
const platformLayout = readFileSync('app/(app)/platform/layout.tsx', 'utf8')
const serviceWorker = readFileSync('public/sw.js', 'utf8')
const rootLayout = readFileSync('app/layout.tsx', 'utf8')
const ui = ['app/standardized-ui.css','app/styles/tokens.css','app/styles/base.css','app/styles/app-shell.css','app/styles/public.css','app/styles/auth.css','app/styles/pricing.css','app/styles/forms.css','app/styles/data.css','app/styles/overlays.css'].map((file)=>readFileSync(file,'utf8')).join('\n')
const legacyUi = readFileSync('app/app-ui.css', 'utf8')
const publicSite = readFileSync('lib/config/public-site.ts', 'utf8')
const navItems = readFileSync('components/navigation/nav-items.ts', 'utf8')
const pricing = readFileSync('app/pricing/page.tsx', 'utf8')
const lifecycle = readFileSync('app/api/internal/lifecycle/route.ts', 'utf8')
const billingReconcile = readFileSync('app/api/internal/billing-reconcile/route.ts', 'utf8')
const onboardingRepo = readFileSync('lib/db/repositories/onboarding.ts', 'utf8')
const accessPolicy = readFileSync('lib/auth/access-policy.ts', 'utf8')
const registerPage = readFileSync('app/register/page.tsx', 'utf8')
const platformPermissions = readFileSync('lib/auth/platform-permissions.ts', 'utf8')
const businessJobs = readFileSync('lib/db/repositories/business-jobs.ts', 'utf8')
const demoWorkspace = readFileSync('lib/data/demo-workspace.ts', 'utf8')
const subscriptionLifecycle = readFileSync('lib/db/repositories/subscription-lifecycle.ts', 'utf8')
const schema = readFileSync('database/schema.sql', 'utf8')
const releaseEvent = readFileSync('app/api/internal/release-event/route.ts', 'utf8')

const apiClient = readFileSync('lib/http/api-client.ts', 'utf8')
const serverApi = readFileSync('lib/http/server-api.ts', 'utf8')
const statusPresentation = readFileSync('lib/status/presentation.ts', 'utf8')
const statusBadge = readFileSync('components/ui/status-badge.tsx', 'utf8')
const standardizedUi = readFileSync('app/standardized-ui.css', 'utf8')
const centralizedClientSurfaces = [
  'components/public/contact-form.tsx',
  'components/support/customer-support.tsx',
  'app/(app)/account/page.tsx',
  'app/(app)/organization/page.tsx',
  'app/subscription-required/page.tsx',
  'app/(app)/platform/leads/page.tsx',
  'app/(app)/platform/incidents/page.tsx',
  'app/(app)/platform/pilot/page.tsx',
  'app/(app)/platform/analytics/page.tsx',
  'app/(app)/platform/help/page.tsx',
  'app/(app)/platform/operators/page.tsx',
  'app/(app)/platform/page.tsx',
  'components/platform/platform-settings-view.tsx',
  'components/platform/platform-support-view.tsx',
  'components/settings/platform-operations.tsx',
  'app/register/page.tsx',
  'app/onboarding/page.tsx',
]

const relativePath = (file) => file.replaceAll('\\', '/')

function filesUnder(directory) {
  const out = []
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry)
    const stat = statSync(path)
    if (stat.isDirectory()) out.push(...filesUnder(path))
    else if (/\.(ts|tsx)$/.test(entry)) out.push(path)
  }
  return out
}

const runtimeSources = ['app', 'components', 'lib', 'modules'].flatMap((dir) => filesUnder(dir))
const envViolations = runtimeSources.filter((file) => {
  const normalizedFile = relativePath(file)
  if (normalizedFile.startsWith('lib/config/')) return false
  return /process\.env\.[A-Z0-9_]+/.test(readFileSync(file, 'utf8'))
}).map(relativePath)
const localeViolations = runtimeSources.filter((file) => {
  const normalizedFile = relativePath(file)
  if (normalizedFile === 'lib/format/locale.ts') return false
  return /toLocale(?:String|DateString)\(['"]de-CH['"]\)|Intl\.(?:NumberFormat|DateTimeFormat)\(/.test(readFileSync(file, 'utf8'))
}).map(relativePath)

const rawFetchAllowlist = new Set([
  'lib/http/api-client.ts',
  'lib/email/graph.ts',
  'lib/billing/stripe.ts',
  'components/state/business-store.tsx',
  'app/error.tsx',
])
const rawFetchViolations = runtimeSources.filter((file) => !rawFetchAllowlist.has(relativePath(file)) && /\bfetch\(/.test(readFileSync(file, 'utf8'))).map(relativePath)


const invariants = [
  [!registration.includes('Microsoft-Konto') && !registration.includes('mit Microsoft anmelden'), 'customer registration must not claim Microsoft-only authentication'],
  [registration.includes('PRODUCT_LIMITS') && registration.includes('normalizeEmail'), 'registration must use central limits and validation'],
  [appLayout.includes('/customer-manifest.webmanifest'), 'customer app must own the customer PWA manifest'],
  [adminLayout.includes('/admin-manifest.webmanifest'), 'admin access must own the admin PWA manifest'],
  [platformLayout.includes('/admin-manifest.webmanifest'), 'authenticated operator area must keep the admin PWA manifest'],
  [serviceWorker.includes('/customer-manifest.webmanifest') && serviceWorker.includes('/admin-manifest.webmanifest'), 'service worker must refresh all PWA manifests network-first'],
  [rootLayout.includes("./standardized-ui.css"), 'the V79 UI foundation must be loaded last'],
  [ui.includes('--ui-z-pill') && ui.includes('.mobile-pill') && ui.includes('translateX(-50%)'), 'mobile pill must be centrally anchored'],
  [ui.includes('@media(max-width:360px)') && ui.includes('@media(max-width:720px)') && ui.includes('@media(max-width:1023px)'), 'responsive foundation must cover small phone, mobile and tablet'],
  [!legacyUi.includes('--mobile-pill-width') && !legacyUi.includes('--mobile-pill-bottom'), 'obsolete mobile pill variables must be removed'],
  [publicSite.includes('ROUTES.public') && navItems.includes('ROUTES.app'), 'public and app navigation must use central routes'],
  [pricing.includes('pricing-plan-badge') && pricing.includes('pricing-highlights') && pricing.includes('Alle enthaltenen Funktionen'), 'pricing must expose the V79 hierarchy'],
  [lifecycle.includes('isInternalJobAuthorized') && billingReconcile.includes('isInternalJobAuthorized') && releaseEvent.includes('isInternalJobAuthorized'), 'internal job authentication must use one helper'],
  [envViolations.length === 0, `runtime environment access must be centralized; violations: ${envViolations.join(', ')}`],
  [localeViolations.length === 0, `de-CH formatting must use lib/format/locale; violations: ${localeViolations.join(', ')}`],
  [registration.includes("mode === 'demo'") && registerPage.includes('/register?') && registerPage.includes('Produktdemo'), 'trial and demo registration must be explicit and separate'],
  [onboardingRepo.includes('is_demo') && onboardingRepo.includes('seedDemoWorkspace') && onboardingRepo.includes('DEMO_ACCESS_HOURS'), 'demo onboarding must create an isolated seeded demo tenant'],
  [onboardingRepo.includes('tenant_business_state') && onboardingRepo.includes('createDemoBusinessState') && demoWorkspace.includes('customers:') && demoWorkspace.includes('invoices:'), 'demo onboarding must seed the persisted customer-app business state'],
  [subscriptionLifecycle.includes("row.is_demo ? 'suspended' : 'read_only'") && subscriptionLifecycle.includes("'demo.expired'"), 'expired demo tenants must be blocked instead of remaining readable indefinitely'],
  [schema.includes('alter table signup_requests') && schema.includes("signup_mode text not null default 'trial'") && !/create table if not exists organization_subscriptions[\s\S]{0,600}signup_mode/.test(schema), 'signup_mode must belong to signup_requests only'],
  [accessPolicy.includes('demoBlockedPermissions') && accessPolicy.includes('billing.manage'), 'demo tenant must centrally block billing and external support actions'],
  [businessJobs.includes('o.is_demo=false'), 'demo tenants must be excluded from automated lifecycle jobs'],
  [readFileSync('tests/e2e/responsive-robustness.spec.ts','utf8').includes('mobile-pill') && readFileSync('tests/e2e/responsive-robustness.spec.ts','utf8').includes('320') && readFileSync('tests/e2e/responsive-robustness.spec.ts','utf8').includes('834') && readFileSync('tests/e2e/responsive-robustness.spec.ts','utf8').includes('1920'), 'responsive regression coverage must include small mobile, tablet, customer app, mobile pill and wide desktop'],
  [platformPermissions.includes('PLATFORM_ROLE_GROUPS') && platformPermissions.includes('canManagePlatform'), 'platform roles and role groups must be centralized'],
  [serverApi.includes('PRODUCT_LIMITS.defaultApiBodyBytes'), 'bounded API body size must use central product limits'],
  [apiClient.includes('apiErrorMessage') && apiClient.includes('correlationId') && apiClient.includes('jsonBody'), 'browser API requests must use the central typed client contract'],
  [statusPresentation.includes('STATUS_PRESENTATIONS') && statusBadge.includes("@/lib/status/presentation"), 'status labels and tones must have one presentation source'],
  [standardizedUi.includes("./styles/auth.css") && standardizedUi.includes("./styles/forms.css") && standardizedUi.includes("./styles/data.css") && standardizedUi.includes("./styles/overlays.css"), 'auth, form, data and overlay CSS ownership must be centralized'],
  [centralizedClientSurfaces.every((file) => !readFileSync(file, 'utf8').includes('fetch(')), 'standardized customer/platform surfaces must use apiRequest instead of ad-hoc fetch'],
  [rawFetchViolations.length === 0, `ordinary runtime fetch calls must use apiRequest; violations: ${rawFetchViolations.join(', ')}`],
  [runtimeSources.every((file) => !relativePath(file).startsWith('app/api/') || !readFileSync(file,'utf8').includes('NextResponse.json')), 'API JSON responses must use the central server API helper'],
  [runtimeSources.every((file) => !relativePath(file).startsWith('app/api/') || !readFileSync(file,'utf8').includes('request.json()')), 'API JSON bodies must use the bounded central parser'],
]
for (const [ok, message] of invariants) if (!ok) throw new Error(`V79 foundation: ${message}`)
console.log(`V79 foundation checks passed (${invariants.length} invariants).`)
