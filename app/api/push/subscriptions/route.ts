import { getSession } from '@/lib/auth/server'
import { apiError, apiJson, readJsonBody } from '@/lib/http/server-api'

type PushSubscriptionBody = {
  endpoint?: string
  expirationTime?: number | null
  keys?: { p256dh?: string; auth?: string }
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return apiError(401, 'unauthorized', 'Anmeldung erforderlich.')

  try {
    const subscription = await readJsonBody<PushSubscriptionBody>(request, 16_384)
    if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return apiError(422, 'validation', 'Ungültiges Push-Abonnement.')
    }

    // TODO production: persist encrypted subscription in the database, scoped to session.user.id.
    return apiJson({ ok: true, stored: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'payload_too_large') return apiError(413, 'payload_too_large', 'Anfrage ist zu gross.')
    return apiError(400, 'invalid_json', 'Ungültige Anfrage.')
  }
}

export async function DELETE(request: Request) {
  const session = await getSession()
  if (!session) return apiError(401, 'unauthorized', 'Anmeldung erforderlich.')

  try {
    await readJsonBody<PushSubscriptionBody>(request, 16_384)
  } catch {
    return apiError(400, 'invalid_json', 'Ungültige Anfrage.')
  }

  // TODO production: delete subscription belonging to session.user.id.
  return apiJson({ ok: true })
}
