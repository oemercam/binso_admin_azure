import { getSession } from '@/lib/auth/server'
import { isDatabaseConfigured } from '@/lib/db/client'
import { deletePushSubscription, upsertPushSubscription } from '@/lib/db/repositories/push-subscriptions'
import { apiError, apiJson, readJsonBody, requestId, requireSameOrigin } from '@/lib/http/server-api'

type PushSubscriptionBody = {
  endpoint?: string
  expirationTime?: number | null
  keys?: { p256dh?: string; auth?: string }
}

export async function POST(request: Request) {
  const id = requestId(request)
  const session = await getSession()
  if (!session) return apiError(401, 'unauthorized', 'Anmeldung erforderlich.', id)
  if (!isDatabaseConfigured()) return apiError(503, 'database_unavailable', 'Datenbank ist nicht konfiguriert.', id)
  try { requireSameOrigin(request) } catch { return apiError(403, 'invalid_origin', 'Ungültige Anfragequelle.', id) }

  try {
    const subscription = await readJsonBody<PushSubscriptionBody>(request, 16_384)
    if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth || subscription.endpoint.length > 4096) {
      return apiError(422, 'validation', 'Ungültiges Push-Abonnement.', id)
    }
    await upsertPushSubscription(session.user.id, {
      endpoint: subscription.endpoint,
      expirationTime: subscription.expirationTime,
      keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
    })
    return apiJson({ ok: true, stored: true }, undefined, id)
  } catch (error) {
    if (error instanceof Error && error.message === 'payload_too_large') return apiError(413, 'payload_too_large', 'Anfrage ist zu gross.', id)
    if (error instanceof Error && error.message.includes('PUSH_SUBSCRIPTION_ENCRYPTION_KEY')) return apiError(503, 'push_not_configured', 'Push-Speicherung ist nicht konfiguriert.', id)
    return apiError(400, 'invalid_json', 'Ungültige Anfrage.', id)
  }
}

export async function DELETE(request: Request) {
  const id = requestId(request)
  const session = await getSession()
  if (!session) return apiError(401, 'unauthorized', 'Anmeldung erforderlich.', id)
  if (!isDatabaseConfigured()) return apiError(503, 'database_unavailable', 'Datenbank ist nicht konfiguriert.', id)
  try { requireSameOrigin(request) } catch { return apiError(403, 'invalid_origin', 'Ungültige Anfragequelle.', id) }

  try {
    const subscription = await readJsonBody<PushSubscriptionBody>(request, 16_384)
    if (!subscription.endpoint) return apiError(422, 'validation', 'Push-Endpunkt fehlt.', id)
    await deletePushSubscription(session.user.id, subscription.endpoint)
    return apiJson({ ok: true }, undefined, id)
  } catch {
    return apiError(400, 'invalid_json', 'Ungültige Anfrage.', id)
  }
}
