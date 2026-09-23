import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import { isDatabaseConfigured } from '@/lib/db/client'
import { createTrialOrganization } from '@/lib/db/repositories/onboarding'
import { findActiveMembershipsForUser } from '@/lib/db/repositories/memberships'
import { findOpenSignupForUser } from '@/lib/db/repositories/registration'
import { upsertAuthenticatedUser } from '@/lib/db/repositories/users'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 })
  if (!isDatabaseConfigured()) return NextResponse.json({ error: 'Datenbank ist nicht konfiguriert.' }, { status: 503 })

  const user = await upsertAuthenticatedUser({ id: session.user.id, email: session.user.email, displayName: session.user.name })
  if (user.status !== 'active') return NextResponse.json({ error: 'Benutzerkonto ist gesperrt.' }, { status: 403 })

  const memberships = await findActiveMembershipsForUser(session.user.id)
  const signup = await findOpenSignupForUser(session.user.id)
  return NextResponse.json({ user: session.user, memberships, signup })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 })
  if (!isDatabaseConfigured()) return NextResponse.json({ error: 'Datenbank ist nicht konfiguriert.' }, { status: 503 })

  const body = await request.json().catch(() => null) as null | { signupId?: string }
  const signupId = body?.signupId?.trim() ?? ''
  if (!signupId) return NextResponse.json({ error: 'Registrierung fehlt.' }, { status: 400 })

  const user = await upsertAuthenticatedUser({ id: session.user.id, email: session.user.email, displayName: session.user.name })
  if (user.status !== 'active') return NextResponse.json({ error: 'Benutzerkonto ist gesperrt.' }, { status: 403 })

  try {
    const result = await createTrialOrganization({
      signupId,
      userId: session.user.id,
      userEmail: session.user.email.trim().toLowerCase(),
      userName: session.user.name,
    })
    return NextResponse.json(result, { status: result.created ? 201 : 200 })
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : 'Organisation konnte nicht erstellt werden.' }, { status: 409 })
  }
}
