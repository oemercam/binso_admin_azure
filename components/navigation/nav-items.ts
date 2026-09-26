import type { IconName } from '@/components/ui/icon'
import type { AppUser, OrganizationFeature, Role } from '@/types/domain'
import { ROUTES } from '@/lib/navigation/routes'

export type NavPlacement = 'primary' | 'work' | 'more' | 'hidden'

export type NavItem = {
  href: string
  label: string
  icon: IconName
  roles: Role[]
  placement: NavPlacement
  platformOnly?: boolean
  feature?: OrganizationFeature
}

const all: Role[] = ['owner', 'admin', 'finance', 'employee']
const management: Role[] = ['owner', 'admin', 'finance']
const ownersAndAdmins: Role[] = ['owner', 'admin']

// V81.18: one simple mental model. Only five areas are primary navigation.
// Secondary capabilities stay available, but are reached through Arbeit, Mehr or Einstellungen.
export const navItems: NavItem[] = [
  { href: ROUTES.app.dashboard, label: 'Übersicht', icon: 'dashboard', roles: all, placement: 'primary' },
  { href: ROUTES.app.customers, label: 'Kunden', icon: 'customers', roles: management, placement: 'primary', feature: 'crm' },
  { href: ROUTES.app.work, label: 'Arbeit', icon: 'orders', roles: all, placement: 'primary' },
  { href: ROUTES.app.time, label: 'Zeit', icon: 'time', roles: all, placement: 'primary', feature: 'time' },
  { href: ROUTES.app.invoices, label: 'Rechnungen', icon: 'invoices', roles: management, placement: 'primary', feature: 'invoices' },

  { href: ROUTES.app.quotes, label: 'Angebote', icon: 'quotes', roles: management, placement: 'work', feature: 'quotes' },
  { href: ROUTES.app.orders, label: 'Aufträge', icon: 'orders', roles: all, placement: 'work', feature: 'orders' },
  { href: ROUTES.app.contracts, label: 'Verträge', icon: 'contracts', roles: management, placement: 'work', feature: 'contracts' },

  { href: ROUTES.app.finance, label: 'Finanzen', icon: 'finance', roles: management, placement: 'more', feature: 'finance' },
  { href: ROUTES.app.employees, label: 'Mitarbeitende', icon: 'employees', roles: ownersAndAdmins, placement: 'more', feature: 'employees' },
  { href: ROUTES.app.settings, label: 'Einstellungen', icon: 'settings', roles: all, placement: 'more' },
  { href: ROUTES.app.platform, label: 'Plattform', icon: 'dashboard', roles: ['owner'], placement: 'more', platformOnly: true },

  // Intentionally hidden from the global navigation. These remain reachable from their owning area.
  { href: ROUTES.app.accounting, label: 'Offene Posten', icon: 'accounting', roles: management, placement: 'hidden', feature: 'accounting' },
  { href: ROUTES.app.data, label: 'Daten', icon: 'download', roles: ownersAndAdmins, placement: 'hidden', feature: 'imports' },
  { href: ROUTES.app.organization, label: 'Organisation', icon: 'building', roles: ownersAndAdmins, placement: 'hidden' },
  { href: ROUTES.app.account, label: 'Mein Konto', icon: 'user', roles: all, placement: 'hidden' },
]

export function navForRole(role: Role) {
  return navItems.filter((item) => item.roles.includes(role) && !item.platformOnly)
}

export function navForUser(user: AppUser) {
  return navItems.filter((item) => item.roles.includes(user.role) && (!item.platformOnly || Boolean(user.platformRole)))
}
