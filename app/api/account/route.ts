import { PRODUCT_LIMITS } from '@/lib/config/product'
import { getSession } from '@/lib/auth/server'
import { isDatabaseConfigured } from '@/lib/db/client'
import { getAccountProfile, updateAccountProfile } from '@/lib/db/repositories/account'
import { upsertAuthenticatedUser } from '@/lib/db/repositories/users'
import { apiError, apiJson, readJsonBody, requestId, requireSameOrigin } from '@/lib/http/server-api'

const locales = new Set(['de-CH','fr-CH','it-CH','en-CH'])
const timezones = new Set(['Europe/Zurich','Europe/Berlin','Europe/Paris','Europe/Rome','UTC'])

export async function GET(request: Request) {
  const id = requestId(request)
  const session = await getSession()
  if (!session) return apiError(401, 'unauthorized', 'Anmeldung erforderlich.', id)
  if (!isDatabaseConfigured()) return apiError(503, 'database_unavailable', 'Datenbank ist nicht konfiguriert.', id)
  await upsertAuthenticatedUser({ id: session.user.id, email: session.user.email, displayName: session.user.name })
  const profile = await getAccountProfile(session.user.id)
  return apiJson({ profile }, undefined, id)
}

export async function PATCH(request: Request) {
  const id = requestId(request)
  try { requireSameOrigin(request) } catch { return apiError(403, 'invalid_origin', 'Ungültige Anfragequelle.', id) }
  const session = await getSession()
  if (!session) return apiError(401, 'unauthorized', 'Anmeldung erforderlich.', id)
  if (!isDatabaseConfigured()) return apiError(503, 'database_unavailable', 'Datenbank ist nicht konfiguriert.', id)

  let body: { displayName?: string; phone?: string; locale?: string; timezone?: string }
  try { body = await readJsonBody(request, PRODUCT_LIMITS.apiBodyStandardBytes) } catch { return apiError(400, 'invalid_json', 'Ungültige Anfrage.', id) }
  const displayName = body.displayName?.trim() ?? ''
  const phone = body.phone?.trim() ?? ''
  const locale = body.locale?.trim() ?? 'de-CH'
  const timezone = body.timezone?.trim() ?? 'Europe/Zurich'
  if (displayName.length < 2 || displayName.length > 120 || phone.length > 40 || !locales.has(locale) || !timezones.has(timezone)) {
    return apiError(422, 'validation', 'Profildaten sind ungültig.', id)
  }
  const profile = await updateAccountProfile({ userId: session.user.id, displayName, phone, locale, timezone })
  return apiJson({ profile }, undefined, id)
}
