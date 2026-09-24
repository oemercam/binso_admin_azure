import { getPlatformSession } from '@/lib/auth/server'
import { listPlatformSupportAccess, updatePlatformSupportAccess } from '@/lib/db/repositories/support-access'
import { apiError, apiJson, readJsonBody, requireSameOrigin } from '@/lib/http/server-api'

export async function GET() {
  const session = await getPlatformSession()
  if (!session?.user.platformRole) return apiError(403, 'forbidden', 'Keine Plattformberechtigung.')
  return apiJson({ grants: await listPlatformSupportAccess() })
}

export async function PATCH(request: Request) {
  try { requireSameOrigin(request) } catch { return apiError(403, 'invalid_origin', 'Ungültige Anfragequelle.') }
  const session = await getPlatformSession()
  if (!session?.user.platformRole || !['platform_owner','platform_admin'].includes(session.user.platformRole)) return apiError(403, 'forbidden', 'Keine Plattformberechtigung.')
  const body = await readJsonBody<{ grantId?: string; action?: 'approve' | 'activate' | 'revoke'; durationHours?: number }>(request, 16_384).catch(() => null)
  if (!body?.grantId || !body.action || !['approve','activate','revoke'].includes(body.action)) return apiError(422, 'validation', 'Ungültige Aktion.')
  try {
    const grant = await updatePlatformSupportAccess({ grantId: body.grantId, action: body.action, durationHours: body.durationHours, platformActorUserId: session.user.id, platformActorEmail: session.user.email })
    return apiJson({ grant })
  } catch (cause) {
    return apiError(409, 'conflict', cause instanceof Error ? cause.message : 'Supportzugriff konnte nicht geändert werden.')
  }
}
