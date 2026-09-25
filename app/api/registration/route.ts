import { apiError, apiJson, readJsonBody, requireSameOrigin } from '@/lib/http/server-api'
import { getSession } from '@/lib/auth/server'
import { isDatabaseConfigured } from '@/lib/db/client'
import { findActiveMembershipsForUser } from '@/lib/db/repositories/memberships'
import { cancelOpenSignup, findOpenSignupForUser, saveRegistration } from '@/lib/db/repositories/registration'
import { upsertAuthenticatedUser } from '@/lib/db/repositories/users'
import type { SignupMode, SubscriptionPlan } from '@/types/domain'
import { enforceDistributedRateLimit } from '@/lib/http/rate-limit'
import { PRODUCT_LIMITS } from '@/lib/config/product'
import { cleanShortText, isEmail, normalizeEmail } from '@/lib/validation/common'

const plans = new Set<SubscriptionPlan>(['starter', 'business', 'professional'])

export async function GET() {
  const session = await getSession()
  if (!session) return apiJson({ authenticated: false }, { status: 401 })
  if (!isDatabaseConfigured()) return apiError(503, 'server', 'Datenbank ist nicht konfiguriert.')

  const user = await upsertAuthenticatedUser({ id: session.user.id, email: session.user.email, displayName: session.user.name })
  if (user.status !== 'active') return apiError(403, 'forbidden', 'Benutzerkonto ist gesperrt.')

  const memberships = await findActiveMembershipsForUser(session.user.id)
  const signup = await findOpenSignupForUser(session.user.id)
  return apiJson({ authenticated: true, user: session.user, memberships, signup })
}

export async function POST(request: Request) {
  const rate = await enforceDistributedRateLimit(
    request,
    'registration',
    PRODUCT_LIMITS.registrationAttempts,
    PRODUCT_LIMITS.registrationWindowMs,
  )
  if (!rate.allowed) {
    return apiError(
      429,
      'rate_limited',
      'Zu viele Registrierungsversuche. Bitte später erneut versuchen.',
    )
  }

  try {
    requireSameOrigin(request)
  } catch {
    return apiError(403, 'forbidden', 'Ungültige Anfragequelle.')
  }

  const session = await getSession()
  if (!session) return apiError(401, 'unauthenticated', 'Bitte zuerst mit deinem Kundenkonto anmelden.')
  if (!isDatabaseConfigured()) return apiError(503, 'server', 'Datenbank ist nicht konfiguriert.')

  const body = await readJsonBody<{
    companyName?: string
    ownerName?: string
    email?: string
    plan?: SubscriptionPlan
    mode?: SignupMode
  }>(request).catch(() => null)

  const companyName = cleanShortText(body?.companyName ?? '', 120)
  const ownerName = cleanShortText(body?.ownerName ?? '', 120)
  const email = normalizeEmail(body?.email ?? '')
  const requestedPlan = body?.plan
  const mode: SignupMode = body?.mode === 'demo' ? 'demo' : 'trial'

  if (!companyName || !ownerName || !isEmail(email) || !requestedPlan || !plans.has(requestedPlan)) {
    return apiError(422, 'validation', 'Registrierungsdaten sind unvollständig.')
  }
  if (email !== normalizeEmail(session.user.email)) {
    return apiError(409, 'conflict', 'Die E-Mail muss dem angemeldeten Kundenkonto entsprechen.')
  }

  const plan: SubscriptionPlan = mode === 'demo' ? 'business' : requestedPlan
  const user = await upsertAuthenticatedUser({ id: session.user.id, email: session.user.email, displayName: session.user.name })
  if (user.status !== 'active') return apiError(403, 'forbidden', 'Benutzerkonto ist gesperrt.')

  const signup = await saveRegistration({ userId: session.user.id, companyName, ownerName, email, plan, mode })
  return apiJson({ signup })
}

export async function DELETE(request: Request) {
  try {
    requireSameOrigin(request)
  } catch {
    return apiError(403, 'forbidden', 'Ungültige Anfragequelle.')
  }

  const session = await getSession()
  if (!session) return apiError(401, 'unauthenticated', 'Nicht angemeldet.')
  if (!isDatabaseConfigured()) return apiError(503, 'server', 'Datenbank ist nicht konfiguriert.')

  await cancelOpenSignup(session.user.id)
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
}
