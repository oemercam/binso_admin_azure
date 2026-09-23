import { NextResponse } from 'next/server'
import { requireSameOrigin } from '@/lib/http/server-api'
import { resolveTenantContext } from '@/lib/auth/tenant-server'
import { appBaseUrl, stripePost, stripePriceId } from '@/lib/billing/stripe'
import { getBillingIdentity, saveStripeCustomer } from '@/lib/db/repositories/stripe-billing'
import type { SubscriptionPlan } from '@/types/domain'

const plans = new Set<SubscriptionPlan>(['starter', 'business', 'professional'])

type StripeCustomer = { id: string }
type StripeCheckoutSession = { id: string; url: string | null }

export async function POST(request: Request) {
  try { requireSameOrigin(request) } catch { return NextResponse.json({ error: 'Ungültige Anfragequelle.' }, { status: 403 }) }
  const context = await resolveTenantContext()
  if (!context) return NextResponse.json({ error: 'Keine aktive Organisation.' }, { status: 403 })
  if (context.membership.role !== 'owner') return NextResponse.json({ error: 'Nur der Inhaber kann die Abrechnung ändern.' }, { status: 403 })

  const body = await request.json().catch(() => null) as { plan?: SubscriptionPlan } | null
  if (!body?.plan || !plans.has(body.plan)) return NextResponse.json({ error: 'Für diesen Plan ist kein Online-Checkout verfügbar.' }, { status: 400 })
  const priceId = stripePriceId(body.plan)
  if (!priceId) return NextResponse.json({ error: 'Stripe Price-ID für diesen Plan fehlt.' }, { status: 503 })

  const billing = await getBillingIdentity(context.organizationId)
  if (!billing) return NextResponse.json({ error: 'Kein Abonnement gefunden.' }, { status: 404 })
  if (billing.billingSubscriptionId && billing.billingProvider === 'stripe') {
    return NextResponse.json({ error: 'Es besteht bereits ein Stripe-Abonnement. Bitte das Abrechnungsportal verwenden.' }, { status: 409 })
  }

  try {
    let customerId = billing.billingCustomerId
    if (!customerId) {
      const params = new URLSearchParams()
      params.set('email', billing.ownerEmail)
      params.set('name', billing.organizationName)
      params.set('metadata[organizationId]', billing.organizationId)
      const customer = await stripePost<StripeCustomer>('/customers', params)
      customerId = customer.id
      await saveStripeCustomer(billing.organizationId, customer.id)
    }

    const baseUrl = appBaseUrl(request)
    const params = new URLSearchParams()
    params.set('mode', 'subscription')
    params.set('customer', customerId)
    params.set('line_items[0][price]', priceId)
    params.set('line_items[0][quantity]', '1')
    params.set('client_reference_id', billing.organizationId)
    params.set('success_url', `${baseUrl}/organization?billing=success`)
    params.set('cancel_url', `${baseUrl}/organization?billing=cancelled`)
    params.set('subscription_data[metadata][organizationId]', billing.organizationId)
    params.set('metadata[organizationId]', billing.organizationId)
    params.set('metadata[plan]', body.plan)
    params.set('allow_promotion_codes', 'true')

    const session = await stripePost<StripeCheckoutSession>('/checkout/sessions', params)
    if (!session.url) throw new Error('Stripe hat keine Checkout-URL zurückgegeben.')
    return NextResponse.json({ url: session.url })
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : 'Checkout konnte nicht gestartet werden.' }, { status: 502 })
  }
}
