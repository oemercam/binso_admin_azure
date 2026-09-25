import type { Role } from '@/types/domain'

export function canManageOperations(role: Role) {
  return role === 'owner' || role === 'admin'
}

export function canViewManagementData(role: Role) {
  return role === 'owner' || role === 'admin' || role === 'finance'
}

export function canManageSettings(role: Role) {
  return canManageOperations(role)
}

export function canWriteTime(role: Role) {
  return role !== 'finance'
}

export function canInvoiceTime(role: Role) {
  return canManageOperations(role)
}

export function canViewOrderBilling(role: Role) {
  return role !== 'employee'
}

export function canApproveTime(role: Role, allowSelfApproval: boolean) {
  return canManageOperations(role) || (role === 'employee' && allowSelfApproval)
}
