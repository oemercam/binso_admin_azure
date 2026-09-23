import type { Permission, Role } from '@/types/domain'

const allPermissions: Permission[] = [
  'organization.read','organization.manage','members.read','members.manage',
  'customers.read','customers.write','quotes.read','quotes.write',
  'orders.read','orders.write','contracts.read','contracts.write',
  'time.read','time.write','time.approve','invoices.read','invoices.write',
  'payments.write','finance.read','margin.read','employees.read','employees.write',
  'employee_costs.read','settings.manage','audit.read','exports.create',
]


export const ROLE_GROUPS = {
  all: ['owner', 'admin', 'finance', 'employee'],
  management: ['owner', 'admin', 'finance'],
  ownersAndAdmins: ['owner', 'admin'],
  ownerAdmin: ['owner', 'admin'],
  finance: ['owner', 'admin', 'finance'],
  accounting: ['owner', 'admin', 'finance'],
  customers: ['owner', 'admin', 'finance'],
  quotes: ['owner', 'admin', 'finance'],
  invoices: ['owner', 'admin', 'finance'],
  employees: ['owner', 'admin'],
} as const satisfies Record<string, readonly Role[]>

export const rolePermissions: Record<Role, Permission[]> = {
  owner: allPermissions,
  admin: allPermissions.filter((permission) => permission !== 'organization.manage'),
  finance: [
    'organization.read','members.read','customers.read','quotes.read',
    'orders.read','contracts.read','time.read','invoices.read','invoices.write',
    'payments.write','finance.read','margin.read','employees.read',
    'employee_costs.read','audit.read','exports.create',
  ],
  employee: [
    'organization.read','customers.read','orders.read','time.read','time.write',
  ],
}

export function hasPermission(role: Role, permission: Permission) {
  return rolePermissions[role].includes(permission)
}
