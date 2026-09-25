import 'server-only'
import { query } from '@/lib/db/client'
import type { OrganizationFeature, SubscriptionStatus } from '@/types/domain'

export type TenantAccessRecord = {
  organizationId: string
  subscriptionStatus: SubscriptionStatus
  features: OrganizationFeature[]
  maxUsers: number
  maxStorageMb: number
}

export async function getTenantAccess(organizationId: string): Promise<TenantAccessRecord | null> {
  const result = await query<{
    organization_id: string
    status: SubscriptionStatus
    features: OrganizationFeature[] | null
    max_users: number | null
    max_storage_mb: number | null
  }>(
    `select s.organization_id, s.status, e.features, e.max_users, e.max_storage_mb
       from organization_subscriptions s
       join organizations o on o.id = s.organization_id
       left join organization_entitlements e on e.organization_id = s.organization_id
      where s.organization_id = $1
        and o.status not in ('suspended','cancelled','archived')
      limit 1`,
    [organizationId],
  )
  const row = result.rows[0]
  if (!row) return null
  return {
    organizationId: row.organization_id,
    subscriptionStatus: row.status,
    features: row.features ?? [],
    maxUsers: row.max_users ?? 1,
    maxStorageMb: row.max_storage_mb ?? 1024,
  }
}
