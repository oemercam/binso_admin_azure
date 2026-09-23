import type { ReactNode } from 'react'
import { requirePlatformRole } from '@/lib/auth/server'

export default async function PlatformLayout({ children }: { children: ReactNode }) {
  await requirePlatformRole('platform_owner', 'platform_admin', 'platform_support')
  return children
}
