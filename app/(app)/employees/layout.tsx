import type { ReactNode } from 'react'
import { requireRole } from '@/lib/auth/server'
import { ROLE_GROUPS } from '@/lib/auth/permissions'

export default async function EmployeesRouteLayout({ children }: { children: ReactNode }) {
  await requireRole(ROLE_GROUPS.ownersAndAdmins)
  return children
}
