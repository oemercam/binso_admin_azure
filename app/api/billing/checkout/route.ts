import { apiError, apiJson, readJsonBody, requireSameOrigin } from '@/lib/http/server-api'
import { resolveAuthorizedTenantContext } from '@/lib/auth/tenant-server'
import { appBaseUrl, stripePost, stripePriceId } from '@/lib/billing/stripe'
import { getBillingIdentity, saveStripeCustomer } from '@/lib/db/repositories/stripe-billing'
import type { SubscriptionPlan } from '@/types/domain'

const plans = new Set<SubscriptionPlan>(['starter', 'business', 'professional'])

type StripeCustomer = { id: string }
type StripeCheckoutSession = { id: string; url: string | null }

export async function POST(request: Request) {
  try {
    requireSameOrigin(request)
  } catch {
    return apiError(403, 'forbidden', 'Ungültige Anfragequelle.')
  }

  const context = await resolveAuthorizedTenantContext(undefined, 'billing.manage')
  if (!context) return apiError(403, 'forbidden', 'Keine aktive Organisation.')

  const body = await readJsonBody<{ plan?: SubscriptionPlan }>(request).catch(() => null)
  if (!body?.plan || !plans.has(body.plan)) return apiError(422, 'validation', 'Für diesen Plan ist kein Online-Checkout verfügbar.')

  const priceId = stripePriceId(body.plan)
  if (!priceId) return apiError(503, 'server', 'Stripe Price-ID für diesen Plan fehlt.')

  const billing = await getBillingIdentity(context.organizationId)
  if (!billing) return apiError(404, 'not_found', 'Kein Abonnement gefunden.')
  if (billing.billingSubscriptionId && billing.billingProvider === 'stripe' && !['cancelled', 'expired'].includes(billing.status)) {
    return apiError(409, 'conflict', 'Es besteht bereits ein Stripe-Abonnement. Bitte das Abrechnungsportal verwenden.')
  }

  try {
    let customerId = billing.billingCustomerId
    if (!customerId) {
      const params = new URLSearchParams()
      params.set('email', billing.ownerEmail)
      params.set('name', billing.organizationName)
      params.set('metadata[organizationId]', billing.organizationId)
      const customer = await stripePost<StripeCustomer>('/customers', params, `customer-${billing.organizationId}`)
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
    params.set('success_url', `${baseUrl}/post-login?billing=success`)
    params.set('cancel_url', `${baseUrl}/subscription-required?billing=cancelled`)
    params.set('subscription_data[metadata][organizationId]', billing.organizationId)
    params.set('metadata[organizationId]', billing.organizationId)

    const session = await stripePost<StripeCheckoutSession>('/checkout/sessions', params, `checkout-${billing.organizationId}-${body.plan}`)
    if (!session.url) return apiError(502, 'server', 'Stripe hat keine Checkout-URL geliefert.')
    return apiJson({ url: session.url })
  } catch (cause) {
    return apiError(502, 'server', cause instanceof Error ? cause.message : 'Checkout konnte nicht gestartet werden.')
  }
}
