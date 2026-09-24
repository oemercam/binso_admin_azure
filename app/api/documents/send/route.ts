import { resolveTenantContext } from '@/lib/auth/tenant-server'
import { queueDocument, type DocumentMailKind } from '@/lib/db/repositories/mail-outbox'
import { apiError, apiJson, readJsonBody, requireSameOrigin } from '@/lib/http/server-api'
import { graphMailConfigured } from '@/lib/email/graph'

export async function POST(request: Request) {
  try { requireSameOrigin(request) } catch { return apiError(403, 'invalid_origin', 'Ungültige Anfragequelle.') }
  try {
    const body = await readJsonBody<{ organizationId: string; kind: DocumentMailKind; entityId: string; to: string; key: string; expectedVersion: number }>(request)
    const context = await resolveTenantContext(body.organizationId)
    if (!context || context.membership.role === 'employee' || (body.kind === 'quote' && context.membership.role === 'finance')) return apiError(403, 'forbidden', 'Keine Versandberechtigung.')
    if (!['quote', 'invoice', 'reminder'].includes(body.kind) || typeof body.entityId !== 'string' || typeof body.to !== 'string' || typeof body.key !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(body.key) || !Number.isSafeInteger(body.expectedVersion)) return apiError(422, 'validation', 'Ungültiger Versandauftrag.')
    if (!graphMailConfigured()) return apiError(503, 'mail_unavailable', 'Der Betreiber hat den E-Mail-Versand noch nicht konfiguriert.')
    const result = await queueDocument({ ...body, organizationId: context.organizationId, userId: context.userId })
    return apiJson(result, { status: 202 })
  } catch (error) { return apiError(409, 'mail_conflict', error instanceof Error ? error.message : 'Versand konnte nicht eingeplant werden.') }
}
