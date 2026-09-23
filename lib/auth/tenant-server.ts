import 'server-only'
import { getSession } from '@/lib/auth/server'
import { isDatabaseConfigured } from '@/lib/db/client'
import { findActiveMembership, findActiveMembershipsForUser } from '@/lib/db/repositories/memberships'
import { DEFAULT_ORGANIZATION_ID } from '@/lib/data/organizations'
import { upsertAuthenticatedUser } from '@/lib/db/repositories/users'
import type { OrganizationMembership } from '@/types/domain'

export type TenantRequestContext = {
  userId: string
  email: string
  organizationId: string
  membership: OrganizationMembership
}

export async function authenticatedIdentity() {
  const session = await getSession()
  if (!session) return null
  return { userId: session.user.id, email: session.user.email, name: session.user.name }
}

/**
 * Resolves a tenant only from the authenticated user's active membership.
 * A request body/query organization id is treated as a selector, never as authorization.
 */
export async function resolveTenantContext(preferredOrganizationId?: string | null): Promise<TenantRequestContext | null> {
  const identity = await authenticatedIdentity()
  if (!identity) return null

  if (!isDatabaseConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('DATABASE_URL must be configured before production tenant access is enabled')
    }
    return {
      ...identity,
      organizationId: DEFAULT_ORGANIZATION_ID,
      membership: {
        id: 'local-membership',
        organizationId: DEFAULT_ORGANIZATION_ID,
        userId: identity.userId,
        email: identity.email,
        role: 'owner',
        status: 'active',
        createdAt: new Date(0).toISOString(),
        updatedAt: new Date(0).toISOString(),
      },
    }
  }

  const user = await upsertAuthenticatedUser({ id: identity.userId, email: identity.email, displayName: identity.name })
  if (user.status !== 'active') return null

  if (preferredOrganizationId) {
    const membership = await findActiveMembership(identity.userId, preferredOrganizationId)
    if (!membership) return null
    return { ...identity, organizationId: membership.organizationId, membership }
  }

  const memberships = await findActiveMembershipsForUser(identity.userId)
  const membership = memberships[0]
  if (!membership) return null
  return { ...identity, organizationId: membership.organizationId, membership }
}


export function assertTenantId(value: string | null | undefined) {
  if (!value) throw new Error('Organization context is required')
  return value
}
