import type { ReactNode } from 'react'
import { requirePlatformRole } from '@/lib/auth/server'
import { PlatformNav } from '@/components/navigation/platform-nav'

export default async function PlatformLayout({ children }: { children: ReactNode }) {
  const session=await requirePlatformRole('platform_owner','platform_admin','platform_support','platform_billing','platform_auditor')
  return <><PlatformNav role={session.user.platformRole!}/>{children}</>
}
