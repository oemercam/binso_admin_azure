import { NextResponse } from 'next/server'
import { requireSameOrigin } from '@/lib/http/server-api'
import { getSession } from '@/lib/auth/server'
import { isDatabaseConfigured } from '@/lib/db/client'
import { findActiveMembershipsForUser } from '@/lib/db/repositories/memberships'
import { cancelOpenSignup, findOpenSignupForUser, saveRegistration } from '@/lib/db/repositories/registration'
import { upsertAuthenticatedUser } from '@/lib/db/repositories/users'
import type { SubscriptionPlan } from '@/types/domain'

const plans = new Set<SubscriptionPlan>(['starter', 'business', 'professional', 'enterprise'])

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 })
  if (!isDatabaseConfigured()) return NextResponse.json({ error: 'Datenbank ist nicht konfiguriert.' }, { status: 503 })

  const user = await upsertAuthenticatedUser({ id: session.user.id, email: session.user.email, displayName: session.user.name })
  if (user.status !== 'active') return NextResponse.json({ error: 'Benutzerkonto ist gesperrt.' }, { status: 403 })

  const memberships = await findActiveMembershipsForUser(session.user.id)
  const signup = await findOpenSignupForUser(session.user.id)
  return NextResponse.json({ authenticated: true, user: session.user, memberships, signup })
}

export async function POST(request: Request) {
  try { requireSameOrigin(request) } catch { return NextResponse.json({ error: 'Ungültige Anfragequelle.' }, { status: 403 }) }
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Bitte zuerst mit Microsoft anmelden.' }, { status: 401 })
  if (!isDatabaseConfigured()) return NextResponse.json({ error: 'Datenbank ist nicht konfiguriert.' }, { status: 503 })

  const body = await request.json().catch(() => null) as null | {
    companyName?: string
    ownerName?: string
    email?: string
    plan?: SubscriptionPlan
  }
  const companyName = body?.companyName?.trim() ?? ''
  const ownerName = body?.ownerName?.trim() ?? ''
  const email = body?.email?.trim().toLowerCase() ?? ''
  const plan = body?.plan

  if (!companyName || !ownerName || !email || !plan || !plans.has(plan)) {
    return NextResponse.json({ error: 'Registrierungsdaten sind unvollständig.' }, { status: 400 })
  }
  if (email !== session.user.email.trim().toLowerCase()) {
    return NextResponse.json({ error: 'Die E-Mail muss dem angemeldeten Microsoft-Konto entsprechen.' }, { status: 409 })
  }

  const user = await upsertAuthenticatedUser({ id: session.user.id, email: session.user.email, displayName: session.user.name })
  if (user.status !== 'active') return NextResponse.json({ error: 'Benutzerkonto ist gesperrt.' }, { status: 403 })

  const memberships = await findActiveMembershipsForUser(session.user.id)
  if (memberships.length > 0) {
    return NextResponse.json({ error: 'Für dieses Konto besteht bereits eine aktive Organisation.', organizationId: memberships[0].organizationId }, { status: 409 })
  }

  const signup = await saveRegistration({ userId: session.user.id, companyName, ownerName, email, plan })
  return NextResponse.json({ signup }, { status: 200 })
}

export async function DELETE(request: Request) {
  try { requireSameOrigin(request) } catch { return NextResponse.json({ error: 'Ungültige Anfragequelle.' }, { status: 403 }) }
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 })
  if (!isDatabaseConfigured()) return NextResponse.json({ error: 'Datenbank ist nicht konfiguriert.' }, { status: 503 })
  await cancelOpenSignup(session.user.id)
  return new NextResponse(null, { status: 204 })
}
