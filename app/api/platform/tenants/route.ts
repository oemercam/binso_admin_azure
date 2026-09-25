import { apiError, apiJson, readJsonBody, requireSameOrigin } from '@/lib/http/server-api'
import { getPlatformSession } from '@/lib/auth/server'
import { isPlatformDatabaseConfigured } from '@/lib/db/client'
import { listPlatformSignups, listPlatformTenants, updatePlatformSubscription } from '@/lib/db/repositories/platform-billing'
import type { PlatformTenantStatus, SubscriptionPlan } from '@/types/domain'
import { canManagePlatform, canReadPlatform } from '@/lib/auth/platform-permissions'
import { cleanText } from '@/lib/validation/common'

const plans = new Set<SubscriptionPlan>(['starter', 'business', 'professional', 'enterprise'])
const statuses = new Set<PlatformTenantStatus>(['trial', 'active', 'past_due', 'grace_period', 'read_only', 'suspended', 'expired', 'cancelled', 'archived'])

export async function GET() {
  const session = await getPlatformSession()
  if (!session) return apiError(401, 'unauthenticated', 'Nicht angemeldet.')
  if (!canReadPlatform(session.user.platformRole)) return apiError(403, 'forbidden', 'Keine Berechtigung.')
  if (!isPlatformDatabaseConfigured()) return apiError(503, 'server', 'Datenbank ist nicht konfiguriert.')

  const [tenants, signups] = await Promise.all([listPlatformTenants(), listPlatformSignups()])
  return apiJson({ tenants, signups, canManage: canManagePlatform(session.user.platformRole) })
}

export async function PATCH(request: Request) {
  try {
    requireSameOrigin(request)
  } catch {
    return apiError(403, 'forbidden', 'Ungültige Anfragequelle.')
  }

  const session = await getPlatformSession()
  if (!session) return apiError(401, 'unauthenticated', 'Nicht angemeldet.')
  if (!canManagePlatform(session.user.platformRole)) return apiError(403, 'forbidden', 'Keine Berechtigung.')
  if (!isPlatformDatabaseConfigured()) return apiError(503, 'server', 'Datenbank ist nicht konfiguriert.')

  const body = await readJsonBody<{
    tenantId?: string
    plan?: SubscriptionPlan
    status?: PlatformTenantStatus
    reason?: string
  }>(request).catch(() => null)

  const tenantId = body?.tenantId?.trim() ?? ''
  const reason = cleanText(body?.reason ?? '', 500)
  if (!tenantId || !body?.plan || !plans.has(body.plan) || !body.status || !statuses.has(body.status) || reason.length < 3) {
    return apiError(422, 'validation', 'Ungültige Abonnementdaten.')
  }

  try {
    await updatePlatformSubscription({
      tenantId,
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      plan: body.plan,
      status: body.status,
      reason,
    })
    return apiJson({ ok: true })
  } catch (cause) {
    return apiError(409, 'conflict', cause instanceof Error ? cause.message : 'Abonnement konnte nicht aktualisiert werden.')
  }
}
