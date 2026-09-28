import { apiError, apiJson, readJsonBody, requestId, requireSameOrigin } from '@/lib/http/server-api'
import { resolveAuthorizedTenantContext, resolveMembershipContext } from '@/lib/auth/tenant-server'
import { getOrganizationSubscription, requestSubscriptionChange } from '@/lib/db/repositories/platform-billing'
import { isDatabaseConfigured } from '@/lib/db/client'
import type { SubscriptionPlan } from '@/types/domain'

const plans = new Set<SubscriptionPlan>(['starter', 'business', 'professional'])

export async function GET(request: Request) {
  const correlationId = requestId(request)
  if (!isDatabaseConfigured()) return apiError(503, 'service_unavailable', 'Abonnementdaten sind derzeit nicht verfügbar.', correlationId)

  const context = await resolveMembershipContext()
  if (!context) return apiError(403, 'forbidden', 'Keine Organisation gefunden.', correlationId)

  const subscription = await getOrganizationSubscription(context.organizationId)
  if (!subscription) return apiError(404, 'not_found', 'Kein Abonnement gefunden.', correlationId)
  return apiJson({ subscription, canManage: context.membership.role === 'owner' }, undefined, correlationId)
}

export async function PATCH(request: Request) {
  const correlationId = requestId(request)
  if (!isDatabaseConfigured()) return apiError(503, 'service_unavailable', 'Abonnementdaten sind derzeit nicht verfügbar.', correlationId)

  try {
    requireSameOrigin(request)
  } catch {
    return apiError(403, 'forbidden', 'Ungültige Anfragequelle.', correlationId)
  }

  const context = await resolveAuthorizedTenantContext(undefined, 'subscription.manage')
  if (!context) return apiError(403, 'forbidden', 'Keine aktive Organisation.', correlationId)

  const body = await readJsonBody<{
    action?: 'change_plan' | 'cancel' | 'reactivate'
    plan?: SubscriptionPlan
  }>(request).catch(() => null)

  if (!body?.action || !['change_plan', 'cancel', 'reactivate'].includes(body.action)) {
    return apiError(422, 'validation', 'Ungültige Aktion.', correlationId)
  }
  if (body.action === 'change_plan' && (!body.plan || !plans.has(body.plan))) {
    return apiError(422, 'validation', 'Ungültiger Plan.', correlationId)
  }

  try {
    const result = await requestSubscriptionChange({
      organizationId: context.organizationId,
      actorUserId: context.userId,
      action: body.action,
      plan: body.plan,
    })
    return apiJson(result, undefined, correlationId)
  } catch (cause) {
    return apiError(409, 'conflict', cause instanceof Error ? cause.message : 'Abonnement konnte nicht aktualisiert werden.', correlationId)
  }
}
