import type { Role } from '@/types/domain'

export type Permission =
  | 'dashboard:owner'
  | 'customers:read'
  | 'customers:write'
  | 'quotes:read'
  | 'quotes:write'
  | 'orders:read'
  | 'orders:write'
  | 'time:read'
  | 'time:write'
  | 'invoices:read'
  | 'invoices:write'
  | 'payments:write'
  | 'finance:read'
  | 'accounting:read'
  | 'employees:read'
  | 'employees:manage'
  | 'settings:manage'

const matrix: Record<Role, Permission[]> = {
  owner: [
    'dashboard:owner',
    'customers:read',
    'customers:write',
    'quotes:read',
    'quotes:write',
    'orders:read',
    'orders:write',
    'time:read',
    'time:write',
    'invoices:read',
    'invoices:write',
    'payments:write',
    'finance:read',
    'accounting:read',
    'employees:read',
    'employees:manage',
    'settings:manage',
  ],
  admin: [
    'customers:read',
    'customers:write',
    'quotes:read',
    'quotes:write',
    'orders:read',
    'orders:write',
    'time:read',
    'time:write',
    'invoices:read',
    'invoices:write',
    'payments:write',
    'finance:read',
    'accounting:read',
    'employees:read',
    'employees:manage',
    'settings:manage',
  ],
  finance: [
    'customers:read',
    'quotes:read',
    'orders:read',
    'time:read',
    'invoices:read',
    'invoices:write',
    'payments:write',
    'finance:read',
    'accounting:read',
  ],
  employee: [
    'orders:read',
    'time:read',
    'time:write',
  ],
}

export function can(role: Role, permission: Permission) {
  return matrix[role].includes(permission)
}
