import { resolveAuthorizedTenantContext } from '@/lib/auth/tenant-server'
import { listTenantSupportAccess, requestTenantSupportAccess, revokeTenantSupportAccess } from '@/lib/db/repositories/support-access'
import { apiError, apiJson, readJsonBody, requireSameOrigin } from '@/lib/http/server-api'

export async function GET(request: Request) {
  const organizationId = new URL(request.url).searchParams.get('organizationId')
  const context = await resolveAuthorizedTenantContext(organizationId, 'support.request')
  if (!context) return apiError(403, 'forbidden', 'Keine Berechtigung.')
  return apiJson({ grants: await listTenantSupportAccess(context) })
}

export async function POST(request: Request) {
  try { requireSameOrigin(request) } catch { return apiError(403, 'invalid_origin', 'Ungültige Anfragequelle.') }
  const body = await readJsonBody<{ organizationId?: string; reason?: string }>(request, 16_384).catch(() => null)
  if (!body) return apiError(400, 'invalid_json', 'Ungültige Anfrage.')
  const reason = body.reason?.trim() ?? ''
  if (reason.length < 5 || reason.length > 1000) return apiError(422, 'validation', 'Bitte einen kurzen Grund für den Supportzugriff angeben.')
  const context = await resolveAuthorizedTenantContext(body.organizationId, 'support.request')
  if (!context) return apiError(403, 'forbidden', 'Keine Berechtigung.')
  const grant = await requestTenantSupportAccess({ organizationId: context.organizationId, userId: context.userId, actorName: context.email, reason })
  return apiJson({ grant }, { status: 201 })
}

export async function DELETE(request: Request) {
  try { requireSameOrigin(request) } catch { return apiError(403, 'invalid_origin', 'Ungültige Anfragequelle.') }
  const body = await readJsonBody<{ organizationId?: string; grantId?: string }>(request, 16_384).catch(() => null)
  if (!body?.grantId) return apiError(422, 'validation', 'Supportzugriff fehlt.')
  const context = await resolveAuthorizedTenantContext(body.organizationId, 'support.request')
  if (!context) return apiError(403, 'forbidden', 'Keine Berechtigung.')
  try {
    const grant = await revokeTenantSupportAccess({ organizationId: context.organizationId, userId: context.userId, actorName: context.email, grantId: body.grantId })
    return apiJson({ grant })
  } catch (cause) {
    return apiError(409, 'conflict', cause instanceof Error ? cause.message : 'Supportzugriff konnte nicht beendet werden.')
  }
}
