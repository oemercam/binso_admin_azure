import type { IconName } from '@/components/ui/icon'
import type { Role } from '@/types/domain'

export type QuickActionItem = {
  label: string
  description: string
  icon: IconName
  href: string
  roles: readonly Role[]
  pathname?: string
}

export const QUICK_ACTIONS: readonly QuickActionItem[] = [
  { label: 'Kontakt erfassen', description: 'Kunde oder Interessent anlegen', icon: 'customers', href: '/customers?new=1', pathname: '/customers', roles: ['owner', 'admin'] },
  { label: 'Angebot erstellen', description: 'Angebot erfassen und Versandstatus verwalten', icon: 'quotes', href: '/quotes?new=1', pathname: '/quotes', roles: ['owner', 'admin'] },
  { label: 'Auftrag erstellen', description: 'Auftrag erfassen', icon: 'orders', href: '/orders?new=1', pathname: '/orders', roles: ['owner', 'admin'] },
  { label: 'Zeit erfassen', description: 'Arbeitszeit auf Auftrag buchen', icon: 'time', href: '/time?new=1', pathname: '/time', roles: ['owner', 'admin', 'employee'] },
  { label: 'Rechnung erstellen', description: 'Leistungen oder Positionen verrechnen', icon: 'invoices', href: '/invoices?new=1', pathname: '/invoices', roles: ['owner', 'admin', 'finance'] },
  { label: 'Lieferantenrechnung erfassen', description: 'Externe Kosten erfassen', icon: 'receipt', href: '/accounting?new=1', pathname: '/accounting', roles: ['owner', 'admin', 'finance'] },
  { label: 'Mitarbeitende erfassen', description: 'Mitarbeitende anlegen', icon: 'employees', href: '/employees?new=1', pathname: '/employees', roles: ['owner', 'admin'] },
  { label: 'Zahlung erfassen', description: 'Zahlung einer Rechnung zuordnen', icon: 'credit-card', href: '/invoices?payment=1', roles: ['owner', 'admin', 'finance'] },
] as const

export function quickActionsForRole(role: Role) {
  return QUICK_ACTIONS.filter((item) => item.roles.includes(role))
}

export function createActionForPath(pathname: string, role: Role) {
  return QUICK_ACTIONS.find((item) => item.pathname === pathname && item.roles.includes(role)) ?? null
}
