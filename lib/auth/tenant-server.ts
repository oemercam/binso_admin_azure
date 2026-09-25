import 'server-only'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/server'
import { isDatabaseConfigured } from '@/lib/db/client'
import { findAccessibleMembership, findActiveMembership, findActiveMembershipsForUser } from '@/lib/db/repositories/memberships'
import { DEFAULT_ORGANIZATION_ID } from '@/lib/data/organizations'
import { upsertAuthenticatedUser } from '@/lib/db/repositories/users'
import type { OrganizationMembership, Permission } from '@/types/domain'
import { getTenantAccess } from '@/lib/db/repositories/tenant-access'
import { canTenantAction } from '@/lib/auth/access-policy'
import { publicEnv } from '@/lib/config/public-env'

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
    if (publicEnv.isProduction) {
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
    const membership = await findAccessibleMembership(identity.userId, preferredOrganizationId)
    if (!membership) return null
    return { ...identity, organizationId: membership.organizationId, membership }
  }

  const membership = await findAccessibleMembership(identity.userId)
  if (!membership) return null
  return { ...identity, organizationId: membership.organizationId, membership }
}

export async function resolveMembershipContext(preferredOrganizationId?: string | null): Promise<TenantRequestContext | null> {
  const identity = await authenticatedIdentity()
  if (!identity) return null

  if (!isDatabaseConfigured()) {
    if (publicEnv.isProduction) throw new Error('DATABASE_URL must be configured before production membership access is enabled')
    return {
      ...identity,
      organizationId: DEFAULT_ORGANIZATION_ID,
      membership: {
        id: 'local-membership', organizationId: DEFAULT_ORGANIZATION_ID, userId: identity.userId, email: identity.email,
        role: 'owner', status: 'active', createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString(),
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
  const membership = memberships[0] ?? null
  return membership ? { ...identity, organizationId: membership.organizationId, membership } : null
}


export function assertTenantId(value: string | null | undefined) {
  if (!value) throw new Error('Organization context is required')
  return value
}


export async function resolveAuthorizedTenantContext(
  preferredOrganizationId: string | null | undefined,
  permission: Permission,
) {
  const context = await resolveTenantContext(preferredOrganizationId)
  if (!context) return null
  if (!isDatabaseConfigured()) return context
  const access = await getTenantAccess(context.organizationId)
  if (!access) return null
  if (!canTenantAction({
    role: context.membership.role,
    permission,
    features: access.features,
    subscriptionStatus: access.subscriptionStatus,
    isDemo: access.isDemo,
  })) return null
  return { ...context, access }
}


export async function requireTenantPermission(permission: Permission, preferredOrganizationId?: string | null) {
  const context = await resolveAuthorizedTenantContext(preferredOrganizationId, permission)
  if (!context) redirect('/access-denied')
  return context
}
