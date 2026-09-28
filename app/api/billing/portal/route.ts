import { apiError, apiJson, requestId, requireSameOrigin } from '@/lib/http/server-api'
import { resolveAuthorizedTenantContext } from '@/lib/auth/tenant-server'
import { appBaseUrl, stripePost } from '@/lib/billing/stripe'
import { getBillingIdentity } from '@/lib/db/repositories/stripe-billing'
import { enforceDistributedRateLimit } from '@/lib/http/rate-limit'
import { PRODUCT_LIMITS } from '@/lib/config/product'
import { isDatabaseConfigured } from '@/lib/db/client'
import { logError, logInfo } from '@/lib/logging/server'

type PortalSession = { url: string }

export async function POST(request: Request) {
  const correlationId = requestId(request)
  if (!isDatabaseConfigured()) return apiError(503, 'service_unavailable', 'Abrechnung ist derzeit nicht verfügbar.', correlationId)

  const rate = await enforceDistributedRateLimit(request, 'billing-portal', PRODUCT_LIMITS.billingActionAttempts, PRODUCT_LIMITS.billingActionWindowMs)
  if (!rate.allowed) return apiError(429, 'rate_limited', 'Zu viele Abrechnungsanfragen. Bitte später erneut versuchen.', correlationId)

  try {
    requireSameOrigin(request)
  } catch {
    return apiError(403, 'forbidden', 'Ungültige Anfragequelle.', correlationId)
  }

  const context = await resolveAuthorizedTenantContext(undefined, 'billing.manage')
  if (!context) return apiError(403, 'forbidden', 'Keine aktive Organisation.', correlationId)

  const billing = await getBillingIdentity(context.organizationId)
  if (!billing?.billingCustomerId) return apiError(409, 'conflict', 'Noch kein Stripe-Kundenkonto vorhanden.', correlationId)

  try {
    const params = new URLSearchParams()
    params.set('customer', billing.billingCustomerId)
    params.set('return_url', `${appBaseUrl(request)}/post-login`)
    const session = await stripePost<PortalSession>('/billing_portal/sessions', params)
    logInfo('billing.portal.created', { correlationId, organizationId: context.organizationId })
    return apiJson({ url: session.url }, undefined, correlationId)
  } catch (cause) {
    logError('billing.portal.failed', cause, { correlationId, organizationId: context.organizationId })
    return apiError(502, 'server', 'Abrechnungsportal konnte nicht geöffnet werden.', correlationId)
  }
}
