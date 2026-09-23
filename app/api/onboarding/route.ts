import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import { isDatabaseConfigured } from '@/lib/db/client'
import { createTrialOrganization } from '@/lib/db/repositories/onboarding'
import { upsertAuthenticatedUser } from '@/lib/db/repositories/users'
import type { SubscriptionPlan } from '@/types/domain'

const plans = new Set<SubscriptionPlan>(['starter', 'business', 'professional', 'enterprise'])

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 })
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
    return NextResponse.json(
      { error: 'Die registrierte E-Mail muss dem angemeldeten Microsoft-Konto entsprechen.' },
      { status: 409 },
    )
  }

  const user = await upsertAuthenticatedUser({
    id: session.user.id,
    email: session.user.email,
    displayName: session.user.name,
  })
  if (user.status !== 'active') return NextResponse.json({ error: 'Benutzerkonto ist gesperrt.' }, { status: 403 })

  const result = await createTrialOrganization({
    userId: session.user.id,
    userEmail: session.user.email.trim().toLowerCase(),
    userName: session.user.name,
    companyName,
    ownerName,
    plan,
  })

  return NextResponse.json(result, { status: result.created ? 201 : 200 })
}
