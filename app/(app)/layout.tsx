import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/app-shell/app-shell'
import { getSession } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/sign-in')
  return <AppShell user={session.user}>{children}</AppShell>
}
