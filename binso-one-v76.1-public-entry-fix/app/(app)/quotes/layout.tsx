import type { ReactNode } from 'react'
import { requireTenantPermission } from '@/lib/auth/tenant-server'

export default async function ManagementRouteLayout({ children }: { children: ReactNode }) {
  await requireTenantPermission('quotes.read')
  return children
}
