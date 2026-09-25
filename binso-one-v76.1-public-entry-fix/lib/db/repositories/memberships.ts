import 'server-only'
import { query } from '@/lib/db/client'
import type { OrganizationMembership, Role } from '@/types/domain'

type MembershipRow = {
  id: string
  organization_id: string
  user_id: string
  email: string
  role: Role
  status: 'invited' | 'active' | 'suspended'
  created_at: Date
  updated_at: Date
}

function mapMembership(row: MembershipRow): OrganizationMembership {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    email: row.email,
    role: row.role,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

export async function findActiveMembershipsForUser(userId: string): Promise<OrganizationMembership[]> {
  const result = await query<MembershipRow>(
    `select id, organization_id, user_id, email, role, status, created_at, updated_at
       from organization_memberships
      where user_id = $1 and status = 'active'
      order by created_at asc`,
    [userId],
  )
  return result.rows.map(mapMembership)
}

export async function findActiveMembership(userId: string, organizationId: string) {
  const result = await query<MembershipRow>(
    `select id, organization_id, user_id, email, role, status, created_at, updated_at
       from organization_memberships
      where user_id = $1 and organization_id = $2 and status = 'active'
      limit 1`,
    [userId, organizationId],
  )
  return result.rows[0] ? mapMembership(result.rows[0]) : null
}

export async function findAccessibleMembership(userId: string, organizationId?: string | null) {
  const values: unknown[] = [userId]
  const organizationFilter = organizationId ? 'and m.organization_id = $2' : ''
  if (organizationId) values.push(organizationId)
  const result = await query<MembershipRow>(
    `select m.id, m.organization_id, m.user_id, m.email, m.role, m.status, m.created_at, m.updated_at
       from organization_memberships m
       join platform_tenants pt on pt.organization_id = m.organization_id
       join organizations o on o.id = m.organization_id and o.status in ('trial','active','grace_period','read_only')
       join organization_subscriptions s on s.organization_id = m.organization_id
      where m.user_id = $1 and m.status = 'active'
        ${organizationFilter}
        and (
          pt.platform_status in ('active','past_due','grace_period','read_only')
          or (pt.platform_status = 'trial' and s.trial_until is not null and s.trial_until > now())
        )
      order by m.created_at asc
      limit 1`,
    values,
  )
  return result.rows[0] ? mapMembership(result.rows[0]) : null
}
