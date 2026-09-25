import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { requirePlatformRole } from '@/lib/auth/server'
import { PlatformNav } from '@/components/navigation/platform-nav'
import { PLATFORM_ROLE_GROUPS } from '@/lib/auth/platform-permissions'

export const metadata: Metadata = { manifest: '/admin-manifest.webmanifest', robots: { index: false, follow: false } }

export default async function PlatformLayout({ children }: { children: ReactNode }) {
  const session=await requirePlatformRole(...PLATFORM_ROLE_GROUPS.all)
  return <><PlatformNav role={session.user.platformRole!}/>{children}</>
}
