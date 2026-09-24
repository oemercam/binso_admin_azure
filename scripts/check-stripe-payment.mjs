import fs from 'node:fs'
const read=(f)=>fs.readFileSync(f,'utf8')
const stripe=read('lib/billing/stripe.ts')
const checkout=read('app/api/billing/checkout/route.ts')
const portal=read('app/api/billing/portal/route.ts')
const webhook=read('app/api/billing/webhook/route.ts')
const repo=read('lib/db/repositories/stripe-billing.ts')
const migration=read('database/migrations/0005_stripe_payment_provider.sql')
const env=read('.env.example')
const organization=read('app/(app)/organization/page.tsx')
const checks=[
 ['stripe secrets server-only',stripe.includes("import 'server-only'")&&stripe.includes('STRIPE_SECRET_KEY')&&!stripe.includes('NEXT_PUBLIC_STRIPE_SECRET')],
 ['checkout is owner scoped',checkout.includes("'billing.manage'")&&checkout.includes("mode', 'subscription")],
 ['checkout has tenant metadata',checkout.includes('metadata[organizationId]')&&checkout.includes('client_reference_id')],
 ['portal is owner scoped',portal.includes("'billing.manage'")&&portal.includes('/billing_portal/sessions')],
 ['webhook signature verification',webhook.includes('verifyStripeWebhook')&&stripe.includes('timingSafeEqual')&&stripe.includes('300')],
 ['webhook idempotency and failed-event recovery',repo.includes('on conflict (provider, external_event_id) do update') && repo.includes("billing_webhook_events.status = 'failed'") && repo.includes('billing_last_event_id === input.eventId')],
 ['subscription webhook sync',webhook.includes("customer.subscription.")&&repo.includes('applyStripeSubscription')],
 ['payment failure handling',webhook.includes('invoice.payment_failed')],
 ['billing sync columns',migration.includes('billing_last_synced_at')&&migration.includes('billing_last_event_id')],
 ['stripe env documented',env.includes('STRIPE_SECRET_KEY=')&&env.includes('STRIPE_WEBHOOK_SECRET=')&&env.includes('STRIPE_PRICE_STARTER=')],
 ['organization checkout ui',organization.includes('/api/billing/checkout')&&organization.includes('/api/billing/portal')],
]
const failed=checks.filter(([,ok])=>!ok)
if(failed.length){for(const [name] of failed)console.error(`FAIL: ${name}`);process.exit(1)}
console.log(`Stripe payment provider check passed (${checks.length} invariants, V63).`)
