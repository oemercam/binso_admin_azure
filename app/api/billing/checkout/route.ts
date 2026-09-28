import { apiError, apiJson, readJsonBody, requestId, requireSameOrigin } from '@/lib/http/server-api'
import { resolveMembershipContext } from '@/lib/auth/tenant-server'
import { appBaseUrl, stripePost, stripePriceId } from '@/lib/billing/stripe'
import { getBillingIdentity, saveStripeCustomer } from '@/lib/db/repositories/stripe-billing'
import type { SubscriptionPlan } from '@/types/domain'
import { DPA_VERSION, TERMS_VERSION } from '@/lib/legal/legal-config'
import { recordCheckoutLegalAcceptance } from '@/lib/db/repositories/legal-acceptance'
import { enforceDistributedRateLimit } from '@/lib/http/rate-limit'
import { PRODUCT_LIMITS } from '@/lib/config/product'
import { isDatabaseConfigured } from '@/lib/db/client'
import { logError, logInfo } from '@/lib/logging/server'

const plans = new Set<SubscriptionPlan>(['starter', 'business', 'professional'])

type StripeCustomer = { id: string }
type StripeCheckoutSession = { id: string; url: string | null }

export async function POST(request: Request) {
  const correlationId = requestId(request)
  if (!isDatabaseConfigured()) return apiError(503, 'service_unavailable', 'Abrechnung ist derzeit nicht verfügbar.', correlationId)

  const rate = await enforceDistributedRateLimit(request, 'billing-checkout', PRODUCT_LIMITS.billingActionAttempts, PRODUCT_LIMITS.billingActionWindowMs)
  if (!rate.allowed) return apiError(429, 'rate_limited', 'Zu viele Abrechnungsanfragen. Bitte später erneut versuchen.', correlationId)

  try {
    requireSameOrigin(request)
  } catch {
    return apiError(403, 'forbidden', 'Ungültige Anfragequelle.', correlationId)
  }

  const context = await resolveMembershipContext()
  if (!context || context.membership.role !== 'owner') return apiError(403, 'forbidden', 'Nur der Inhaber kann ein Abonnement aktivieren.', correlationId)

  const body = await readJsonBody<{ plan?: SubscriptionPlan; acceptedTermsVersion?: string; acceptedDpaVersion?: string }>(request).catch(() => null)
  if (!body?.plan || !plans.has(body.plan)) return apiError(422, 'validation', 'Für diesen Plan ist kein Online-Checkout verfügbar.', correlationId)
  if (body.acceptedTermsVersion !== TERMS_VERSION || body.acceptedDpaVersion !== DPA_VERSION) return apiError(422, 'legal_acceptance_required', 'Bitte bestätige die aktuellen AGB und die Auftragsbearbeitungsvereinbarung.', correlationId)

  const priceId = stripePriceId(body.plan)
  if (!priceId) return apiError(503, 'server', 'Stripe Price-ID für diesen Plan fehlt.', correlationId)

  const billing = await getBillingIdentity(context.organizationId)
  if (!billing) return apiError(404, 'not_found', 'Kein Abonnement gefunden.', correlationId)
  if (billing.billingSubscriptionId && billing.billingProvider === 'stripe' && !['cancelled', 'expired'].includes(billing.status)) {
    return apiError(409, 'conflict', 'Es besteht bereits ein Stripe-Abonnement. Bitte das Abrechnungsportal verwenden.', correlationId)
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
    params.set('subscription_data[metadata][termsVersion]', TERMS_VERSION)
    params.set('subscription_data[metadata][dpaVersion]', DPA_VERSION)
    params.set('metadata[organizationId]', billing.organizationId)
    params.set('metadata[termsVersion]', TERMS_VERSION)
    params.set('metadata[dpaVersion]', DPA_VERSION)

    const session = await stripePost<StripeCheckoutSession>('/checkout/sessions', params, `checkout-${billing.organizationId}-${body.plan}`)
    if (!session.url) return apiError(502, 'server', 'Stripe hat keine Checkout-URL geliefert.', correlationId)
    await recordCheckoutLegalAcceptance({
      organizationId: billing.organizationId,
      subscriptionId: billing.subscriptionId,
      actorUserId: context.userId,
      termsVersion: TERMS_VERSION,
      dpaVersion: DPA_VERSION,
    })
    logInfo('billing.checkout.created', { correlationId, organizationId: billing.organizationId, plan: body.plan })
    return apiJson({ url: session.url }, undefined, correlationId)
  } catch (cause) {
    logError('billing.checkout.failed', cause, { correlationId, organizationId: context.organizationId, plan: body.plan })
    return apiError(502, 'server', 'Checkout konnte nicht gestartet werden.', correlationId)
  }
}
