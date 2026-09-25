import { PRODUCT_LIMITS } from '@/lib/config/product'
import { authenticatedIdentity } from '@/lib/auth/tenant-server'
import { isDatabaseConfigured } from '@/lib/db/client'
import { recordApplicationEvent } from '@/lib/db/repositories/application-events'
import { apiError, apiJson, readJsonBody, requestId, requireSameOrigin } from '@/lib/http/server-api'

export async function POST(request: Request) {
  const id = requestId(request)
  try { requireSameOrigin(request) } catch { return apiError(403, 'invalid_origin', 'Ungültige Anfragequelle.', id) }
  const identity = await authenticatedIdentity()
  if (!identity) return apiError(401, 'unauthorized', 'Anmeldung erforderlich.', id)
  if (!isDatabaseConfigured()) return apiJson({ ok: true }, undefined, id)

  let body: { digest?: string; name?: string; path?: string }
  try { body = await readJsonBody(request, PRODUCT_LIMITS.apiBodySmallBytes) } catch { return apiError(400, 'invalid_payload', 'Fehlerdaten sind ungültig.', id) }

  await recordApplicationEvent({
    severity: 'error',
    area: 'client',
    code: 'route_error',
    message: String(body.name || 'Client route error').slice(0, 200),
    userId: identity.userId,
    requestId: id,
    detail: {
      digest: String(body.digest || '').slice(0, 200),
      path: String(body.path || '').slice(0, 500),
    },
  })
  return apiJson({ ok: true }, undefined, id)
}
