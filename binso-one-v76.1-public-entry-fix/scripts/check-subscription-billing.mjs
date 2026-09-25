import fs from 'node:fs'
const read=(f)=>fs.readFileSync(f,'utf8')
const migration=read('database/migrations/0004_subscription_billing.sql')
const repo=read('lib/db/repositories/platform-billing.ts')
const api=read('app/api/platform/tenants/route.ts')
const platform=read('app/(app)/platform/page.tsx')
const domain=read('types/domain.ts')
const customerApi=read('app/api/billing/subscription/route.ts')
const organization=read('app/(app)/organization/page.tsx')
const onboarding=read('lib/db/repositories/onboarding.ts')
const checks=[
 ['billing provider columns',migration.includes('billing_provider')&&migration.includes('billing_subscription_id')],
 ['cancellation lifecycle',migration.includes('cancel_at_period_end')&&migration.includes('cancelled_at')],
 ['subscription event history',migration.includes('create table if not exists subscription_events')],
 ['webhook inbox',migration.includes('create table if not exists billing_webhook_events')&&migration.includes('external_event_id')],
 ['platform repo uses database',repo.includes('listPlatformTenants')&&repo.includes('updatePlatformSubscription')],
 ['platform api auth',api.includes('platform_owner')&&api.includes('platform_admin')&&api.includes('platform_support')],
 ['platform api mutation',api.includes('export async function PATCH')],
 ['platform ui uses api',platform.includes("fetch('/api/platform/tenants'")],
 ['platform ui no local store',!platform.includes('usePlatformStore')],
 ['domain billing lifecycle',domain.includes('billingSubscriptionId')&&domain.includes('cancelAtPeriodEnd')],
 ['new trials record billing amount',onboarding.includes('unit_amount_chf')],
 ['owner self-service api',customerApi.includes("'subscription.manage'")&&customerApi.includes('change_plan')&&customerApi.includes('reactivate')],
 ['owner subscription ui',organization.includes('Abonnement verwalten')&&organization.includes('/api/billing/subscription')],
]
const failed=checks.filter(([,ok])=>!ok)
if(failed.length){for(const [name] of failed)console.error(`FAIL: ${name}`);process.exit(1)}
console.log(`Subscription and billing foundation check passed (${checks.length} invariants, V61).`)
