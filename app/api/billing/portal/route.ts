import { apiError, apiJson, requireSameOrigin } from '@/lib/http/server-api'
import { resolveAuthorizedTenantContext } from '@/lib/auth/tenant-server'
import { appBaseUrl, stripePost } from '@/lib/billing/stripe'
import { getBillingIdentity } from '@/lib/db/repositories/stripe-billing'

type PortalSession = { url: string }

export async function POST(request: Request) {
  try {
    requireSameOrigin(request)
  } catch {
    return apiError(403, 'forbidden', 'Ungültige Anfragequelle.')
  }

  const context = await resolveAuthorizedTenantContext(undefined, 'billing.manage')
  if (!context) return apiError(403, 'forbidden', 'Keine aktive Organisation.')

  const billing = await getBillingIdentity(context.organizationId)
  if (!billing?.billingCustomerId) return apiError(409, 'conflict', 'Noch kein Stripe-Kundenkonto vorhanden.')

  try {
    const params = new URLSearchParams()
    params.set('customer', billing.billingCustomerId)
    params.set('return_url', `${appBaseUrl(request)}/post-login`)
    const session = await stripePost<PortalSession>('/billing_portal/sessions', params)
    return apiJson({ url: session.url })
  } catch (cause) {
    return apiError(502, 'server', cause instanceof Error ? cause.message : 'Abrechnungsportal konnte nicht geöffnet werden.')
  }
}
