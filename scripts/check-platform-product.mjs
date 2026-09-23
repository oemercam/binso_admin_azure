import fs from 'node:fs'
const read=(f)=>fs.readFileSync(f,'utf8')
const domain=read('types/domain.ts')
const server=read('lib/auth/server.ts')
const nav=read('components/navigation/nav-items.ts')
const pricing=read('lib/data/plans.ts')
const platform=read('app/(app)/platform/page.tsx')
const register=read('app/register/page.tsx')
const onboarding=read('app/(app)/onboarding/page.tsx')
const store=read('components/state/business-store.tsx')
const schema=read('database/schema.sql')
const onboardingSource=read('app/(app)/onboarding/page.tsx')

const checks=[
 ['platform role',domain.includes("export type PlatformRole")],
 ['platform auth guard',server.includes('requirePlatformRole')],
 ['platform-only nav',nav.includes('platformOnly')],
 ['four plans',pricing.includes("id: 'starter'")&&pricing.includes("id: 'business'")&&pricing.includes("id: 'professional'")&&pricing.includes("id: 'enterprise'")],
 ['platform admin page',platform.includes('SaaS-Kunden, Abonnemente')],
 ['registration page',register.includes('business-platform-pending-signup')],
 ['onboarding creates organization',onboarding.includes('store.createOrganization')],
 ['per-org profiles',store.includes('companyProfiles: Record<string, CompanyProfile>')],
 ['per-org settings',store.includes('appSettingsByOrganization')],
 ['platform tenant schema',schema.includes('create table if not exists platform_tenants')],
 ['signup schema',schema.includes('create table if not exists signup_requests')],
 ['onboarding effect is deferred',onboardingSource.includes('queueMicrotask(() =>')],
 ['organization derived values are memoized',store.includes('const currentCompanyProfile = useMemo(')],
]
const failed=checks.filter(([,ok])=>!ok)
if(failed.length){for(const [name] of failed) console.error(`FAIL: ${name}`);process.exit(1)}
console.log(`Platform product checks passed (${checks.length} invariants).`)
