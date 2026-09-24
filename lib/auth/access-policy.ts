import type {
  OrganizationFeature,
  Permission,
  Role,
  SubscriptionStatus,
  TenantAccessMode,
} from '@/types/domain'
import { hasPermission } from './permissions'

const writePermissions = new Set<Permission>([
  'organization.manage','members.manage','customers.write','quotes.write','orders.write','contracts.write',
  'time.write','time.approve','invoices.write','payments.write','employees.write','settings.manage','exports.create',
  'subscription.manage','billing.manage','support.request',
])

const featureByPermission: Partial<Record<Permission, OrganizationFeature>> = {
  'customers.read': 'crm', 'customers.write': 'crm',
  'quotes.read': 'quotes', 'quotes.write': 'quotes',
  'orders.read': 'orders', 'orders.write': 'orders',
  'contracts.read': 'contracts', 'contracts.write': 'contracts',
  'time.read': 'time', 'time.write': 'time', 'time.approve': 'time',
  'invoices.read': 'invoices', 'invoices.write': 'invoices', 'payments.write': 'invoices',
  'finance.read': 'finance', 'margin.read': 'finance',
  'employees.read': 'employees', 'employees.write': 'employees', 'employee_costs.read': 'employees',
  'audit.read': 'audit', 'exports.create': 'exports',
}

export function permissionFeature(permission: Permission): OrganizationFeature | undefined {
  return featureByPermission[permission]
}

export function isWritePermission(permission: Permission) {
  return writePermissions.has(permission)
}

export function tenantAccessMode(status: SubscriptionStatus): TenantAccessMode {
  if (status === 'trial' || status === 'active' || status === 'past_due' || status === 'grace_period') return 'full'
  if (status === 'read_only' || status === 'expired') return 'read_only'
  if (status === 'cancelled') return 'blocked'
  return 'blocked'
}

export function canTenantAction(input: {
  role: Role
  permission: Permission
  features: readonly OrganizationFeature[]
  subscriptionStatus: SubscriptionStatus
}) {
  if (!hasPermission(input.role, input.permission)) return false
  const feature = permissionFeature(input.permission)
  if (feature && !input.features.includes(feature)) return false
  const mode = tenantAccessMode(input.subscriptionStatus)
  if (mode === 'blocked') return false
  if (mode === 'read_only' && isWritePermission(input.permission)) return false
  return true
}
