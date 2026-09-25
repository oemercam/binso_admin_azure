import type { OrganizationMembership, OrganizationScoped, Role } from '@/types/domain'

export function belongsToOrganization(item: OrganizationScoped, organizationId: string) {
  return item.organizationId === organizationId
}

export function membershipFor(
  memberships: OrganizationMembership[],
  userId: string,
  organizationId: string,
) {
  return memberships.find((membership) =>
    membership.userId === userId &&
    membership.organizationId === organizationId &&
    membership.status === 'active'
  )
}

export function effectiveRole(
  memberships: OrganizationMembership[],
  userId: string,
  organizationId: string,
  fallback: Role,
): Role {
  return membershipFor(memberships, userId, organizationId)?.role ?? fallback
}
