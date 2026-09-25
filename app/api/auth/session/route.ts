import { apiJson } from '@/lib/http/server-api'
import { getSession } from '@/lib/auth/server'
import { isDatabaseConfigured } from '@/lib/db/client'
import { findActiveMembershipsForUser } from '@/lib/db/repositories/memberships'
import { upsertAuthenticatedUser } from '@/lib/db/repositories/users'

export async function GET() {
  const session = await getSession()
  if (!session) return apiJson({ authenticated: false }, { status: 401 })

  if (!isDatabaseConfigured()) {
    return apiJson({ authenticated: true, user: session.user, memberships: [], databaseConfigured: false })
  }

  const user = await upsertAuthenticatedUser({ id: session.user.id, email: session.user.email, displayName: session.user.name })
  if (user.status !== 'active') return apiJson({ authenticated: false, suspended: true }, { status: 403 })
  const memberships = await findActiveMembershipsForUser(session.user.id)
  return apiJson({ authenticated: true, user: session.user, memberships, databaseConfigured: true })
}
