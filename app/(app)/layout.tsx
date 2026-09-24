import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/app-shell/app-shell'
import { BusinessStoreProvider } from '@/components/state/business-store'
import { RouteTransition } from '@/components/navigation/route-transition'
import { CurrentUserProvider } from '@/components/state/current-user'
import { getSession } from '@/lib/auth/server'
import { isDatabaseConfigured } from '@/lib/db/client'
import { getBusinessBootstrapForUser } from '@/lib/db/repositories/business-bootstrap'
import { upsertAuthenticatedUser } from '@/lib/db/repositories/users'
import { EntitlementGate } from '@/components/auth/entitlement-gate'

export const dynamic = 'force-dynamic'

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/sign-in')
  const databaseConfigured = isDatabaseConfigured()
  if (process.env.NODE_ENV === 'production' && !databaseConfigured) redirect('/access-denied')
  const account = databaseConfigured
    ? await upsertAuthenticatedUser({ id: session.user.id, email: session.user.email, displayName: session.user.name })
    : null
  if (account?.status === 'suspended') redirect('/access-denied')

  const user = account ? { ...session.user, name: account.displayName } : session.user
  const bootstrap = databaseConfigured ? await getBusinessBootstrapForUser(user.id) : null
  if (databaseConfigured && !bootstrap && !user.platformRole) redirect('/post-login')

  return (
    <BusinessStoreProvider user={user} bootstrap={bootstrap} databaseConfigured={databaseConfigured}>
        <CurrentUserProvider user={user}>
          <AppShell user={user}>
            <EntitlementGate><RouteTransition>{children}</RouteTransition></EntitlementGate>
          </AppShell>
        </CurrentUserProvider>
    </BusinessStoreProvider>
  )
}
