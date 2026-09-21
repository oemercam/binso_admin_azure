import type { Role } from '@/types/domain'

export type Permission = 'customers:read' | 'customers:write' | 'orders:read' | 'orders:write' | 'time:write' | 'finance:read' | 'settings:manage'

const matrix: Record<Role, Permission[]> = {
  admin: ['customers:read','customers:write','orders:read','orders:write','time:write','finance:read','settings:manage'],
  finance: ['customers:read','orders:read','time:write','finance:read'],
  employee: ['orders:read','time:write']
}

export function can(role: Role, permission: Permission) {
  return matrix[role].includes(permission)
}
