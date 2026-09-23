import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/server'
import { isDatabaseConfigured } from '@/lib/db/client'
import { findActiveMembershipsForUser } from '@/lib/db/repositories/memberships'
import { findOpenSignupForUser } from '@/lib/db/repositories/registration'
import { upsertAuthenticatedUser } from '@/lib/db/repositories/users'
import { getBusinessBootstrapForUser } from '@/lib/db/repositories/business-bootstrap'

export const dynamic = 'force-dynamic'

export default async function PostLoginPage() {
  const session = await getSession()
  if (!session) redirect('/sign-in')
  if (!isDatabaseConfigured()) redirect('/dashboard')

  const user = await upsertAuthenticatedUser({ id: session.user.id, email: session.user.email, displayName: session.user.name })
  if (user.status !== 'active') redirect('/access-denied')

  const memberships = await findActiveMembershipsForUser(session.user.id)
  if (memberships.length > 0) {
    const bootstrap = await getBusinessBootstrapForUser(session.user.id)
    if (bootstrap) redirect('/dashboard')
    redirect('/access-denied')
  }

  const signup = await findOpenSignupForUser(session.user.id)
  if (signup) redirect('/onboarding')

  redirect('/pricing')
}
