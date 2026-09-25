import type { ReactNode } from 'react'
import { requireTenantPermission } from '@/lib/auth/tenant-server'

export default async function EmployeesRouteLayout({ children }: { children: ReactNode }) {
  await requireTenantPermission('employees.read')
  return children
}
