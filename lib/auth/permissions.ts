import type { Role } from '@/types/domain'

export const ROLE_GROUPS = {
  all: ['owner', 'admin', 'finance', 'employee'],
  management: ['owner', 'admin', 'finance'],
  ownersAndAdmins: ['owner', 'admin'],
} as const satisfies Record<string, readonly Role[]>

export function roleAllowed(role: Role, allowedRoles: readonly Role[]) {
  return allowedRoles.includes(role)
}
