import { apiError, apiJson, readJsonBody, requireSameOrigin } from '@/lib/http/server-api'
import { resolveAuthorizedTenantContext } from '@/lib/auth/tenant-server'
import { getOrganizationSubscription, requestSubscriptionChange } from '@/lib/db/repositories/platform-billing'
import type { SubscriptionPlan } from '@/types/domain'

const plans = new Set<SubscriptionPlan>(['starter', 'business', 'professional', 'enterprise'])

export async function GET() {
  const context = await resolveAuthorizedTenantContext(undefined, 'subscription.read')
  if (!context) return apiError(403, 'forbidden', 'Keine aktive Organisation.')

  const subscription = await getOrganizationSubscription(context.organizationId)
  if (!subscription) return apiError(404, 'not_found', 'Kein Abonnement gefunden.')
  return apiJson({ subscription, canManage: context.membership.role === 'owner' })
}

export async function PATCH(request: Request) {
  try {
    requireSameOrigin(request)
  } catch {
    return apiError(403, 'forbidden', 'Ungültige Anfragequelle.')
  }

  const context = await resolveAuthorizedTenantContext(undefined, 'subscription.manage')
  if (!context) return apiError(403, 'forbidden', 'Keine aktive Organisation.')

  const body = await readJsonBody<{
    action?: 'change_plan' | 'cancel' | 'reactivate'
    plan?: SubscriptionPlan
  }>(request).catch(() => null)

  if (!body?.action || !['change_plan', 'cancel', 'reactivate'].includes(body.action)) {
    return apiError(422, 'validation', 'Ungültige Aktion.')
  }
  if (body.action === 'change_plan' && (!body.plan || !plans.has(body.plan))) {
    return apiError(422, 'validation', 'Ungültiger Plan.')
  }

  try {
    const result = await requestSubscriptionChange({
      organizationId: context.organizationId,
      actorUserId: context.userId,
      action: body.action,
      plan: body.plan,
    })
    return apiJson(result)
  } catch (cause) {
    return apiError(409, 'conflict', cause instanceof Error ? cause.message : 'Abonnement konnte nicht aktualisiert werden.')
  }
}
