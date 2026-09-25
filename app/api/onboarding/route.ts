import { apiError, apiJson, requireSameOrigin, readJsonBody } from '@/lib/http/server-api'
import { getSession } from '@/lib/auth/server'
import { isDatabaseConfigured } from '@/lib/db/client'
import { createTrialOrganization } from '@/lib/db/repositories/onboarding'
import { findActiveMembershipsForUser } from '@/lib/db/repositories/memberships'
import { findOpenSignupForUser, updateSignupOnboarding } from '@/lib/db/repositories/registration'
import { upsertAuthenticatedUser } from '@/lib/db/repositories/users'

async function actor() {
  const session = await getSession()
  if (!session || !isDatabaseConfigured()) return null
  const user = await upsertAuthenticatedUser({ id: session.user.id, email: session.user.email, displayName: session.user.name })
  if (user.status !== 'active') return null
  return { session, user }
}

export async function GET() {
  const current = await actor()
  if (!current) return apiError(401, 'unauthenticated', 'Nicht angemeldet oder Datenbank nicht verfügbar.')

  const memberships = await findActiveMembershipsForUser(current.session.user.id)
  const signup = await findOpenSignupForUser(current.session.user.id)
  return apiJson({ user: current.session.user, memberships, signup })
}

export async function PATCH(request: Request) {
  try {
    requireSameOrigin(request)
  } catch {
    return apiError(403, 'forbidden', 'Ungültige Anfragequelle.')
  }

  const current = await actor()
  if (!current) return apiError(401, 'unauthenticated', 'Nicht angemeldet.')

  const body = await readJsonBody<{
    signupId?: string
    step?: number
    completedSteps?: number[]
    modulePreferences?: string[]
    businessSettings?: Record<string, string | number | boolean>
    status?: 'not_started' | 'in_progress' | 'completed' | 'skipped'
  }>(request).catch(() => null)

  if (!body?.signupId || typeof body.step !== 'number') {
    return apiError(422, 'validation', 'Ungültige Onboardingdaten.')
  }

  const signup = await updateSignupOnboarding({
    userId: current.session.user.id,
    signupId: body.signupId,
    step: body.step,
    completedSteps: Array.isArray(body.completedSteps) ? body.completedSteps.filter(Number.isInteger) : [],
    modulePreferences: Array.isArray(body.modulePreferences) ? body.modulePreferences.filter((value) => typeof value === 'string').slice(0, 30) : [],
    businessSettings: body.businessSettings && typeof body.businessSettings === 'object' ? body.businessSettings : {},
    status: body.status,
  })

  return signup ? apiJson({ signup }) : apiError(404, 'not_found', 'Registrierung wurde nicht gefunden.')
}

export async function POST(request: Request) {
  try {
    requireSameOrigin(request)
  } catch {
    return apiError(403, 'forbidden', 'Ungültige Anfragequelle.')
  }

  const current = await actor()
  if (!current) return apiError(401, 'unauthenticated', 'Nicht angemeldet.')

  const body = await readJsonBody<{ signupId?: string }>(request).catch(() => null)
  const signupId = body?.signupId?.trim() ?? ''
  if (!signupId) return apiError(422, 'validation', 'Registrierung fehlt.')

  try {
    const result = await createTrialOrganization({
      signupId,
      userId: current.session.user.id,
      userEmail: current.session.user.email.trim().toLowerCase(),
      userName: current.session.user.name,
    })
    return apiJson(result, { status: result.created ? 201 : 200 })
  } catch {
    return apiError(500, 'server', 'Der Zugang konnte nicht eingerichtet werden. Bitte versuche es erneut.')
  }
}
