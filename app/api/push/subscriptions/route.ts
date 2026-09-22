import { getSession } from '@/lib/auth/server'
import { apiError, apiJson, readJsonBody } from '@/lib/http/server-api'

type PushSubscriptionBody = {
  endpoint?: string
  expirationTime?: number | null
  keys?: { p256dh?: string; auth?: string }
}

export async function GET() {
  const session = await getSession()
  if (!session) return apiError(401, 'unauthorized', 'Anmeldung erforderlich.')
  return apiJson({ configured: false })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return apiError(401, 'unauthorized', 'Anmeldung erforderlich.')

  try {
    const subscription = await readJsonBody<PushSubscriptionBody>(request, 16_384)
    if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return apiError(422, 'validation', 'Ungültiges Push-Abonnement.')
    }

    // Push delivery is intentionally unavailable until a durable server-side subscription store is connected.
    // Never acknowledge persistence when no subscription was stored.
    return apiError(503, 'push_not_configured', 'Push ist serverseitig noch nicht konfiguriert.')
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

  // No durable subscription store is connected yet. Local browser unsubscribe may still proceed.
  return apiJson({ ok: true, configured: false })
}
