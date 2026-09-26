import type { IconName } from '@/components/ui/icon'
import type { OrganizationFeature, Role } from '@/types/domain'

export type QuickActionItem = {
  label: string
  description: string
  icon: IconName
  href: string
  roles: readonly Role[]
  pathname?: string
  feature?: OrganizationFeature
}

// V81.18: global creation stays intentionally short. Secondary actions live in their owning area.
export const QUICK_ACTIONS: readonly QuickActionItem[] = [
  { label: 'Kunde erfassen', description: 'Firmenname reicht für den Start', icon: 'customers', href: '/customers?new=1', pathname: '/customers', roles: ['owner', 'admin'], feature: 'crm' },
  { label: 'Angebot erstellen', description: 'Kunde, Leistung und Preis', icon: 'quotes', href: '/quotes?new=1', pathname: '/quotes', roles: ['owner', 'admin'], feature: 'quotes' },
  { label: 'Auftrag erstellen', description: 'Kunde und Auftragsname genügen', icon: 'orders', href: '/orders?new=1', pathname: '/orders', roles: ['owner', 'admin'], feature: 'orders' },
  { label: 'Zeit erfassen', description: 'Arbeitszeit direkt auf Auftrag buchen', icon: 'time', href: '/time?new=1', pathname: '/time', roles: ['owner', 'admin', 'employee'], feature: 'time' },
  { label: 'Rechnung erstellen', description: 'Zeiten, Spesen oder freie Positionen verrechnen', icon: 'invoices', href: '/invoices?new=1', pathname: '/invoices', roles: ['owner', 'admin', 'finance'], feature: 'invoices' },
] as const

export function quickActionsForRole(role: Role) {
  return QUICK_ACTIONS.filter((item) => item.roles.includes(role))
}

export function createActionForPath(pathname: string, role: Role) {
  return QUICK_ACTIONS.find((item) => item.pathname === pathname && item.roles.includes(role)) ?? null
}
