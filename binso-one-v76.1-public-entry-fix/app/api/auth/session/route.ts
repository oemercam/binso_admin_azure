import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import { isDatabaseConfigured } from '@/lib/db/client'
import { findActiveMembershipsForUser } from '@/lib/db/repositories/memberships'
import { upsertAuthenticatedUser } from '@/lib/db/repositories/users'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 })

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ authenticated: true, user: session.user, memberships: [], databaseConfigured: false })
  }

  const user = await upsertAuthenticatedUser({ id: session.user.id, email: session.user.email, displayName: session.user.name })
  if (user.status !== 'active') return NextResponse.json({ authenticated: false, suspended: true }, { status: 403 })
  const memberships = await findActiveMembershipsForUser(session.user.id)
  return NextResponse.json({ authenticated: true, user: session.user, memberships, databaseConfigured: true })
}
