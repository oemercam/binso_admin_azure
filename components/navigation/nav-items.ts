import type { IconName } from '@/components/ui/icon'
import type { AppUser, OrganizationFeature, Role } from '@/types/domain'
import { ROUTES } from '@/lib/navigation/routes'

export type NavItem = {
  href: string
  label: string
  icon: IconName
  roles: Role[]
  group: 'work' | 'management' | 'system'
  platformOnly?: boolean
  feature?: OrganizationFeature
}

const all: Role[] = ['owner', 'admin', 'finance', 'employee']
const management: Role[] = ['owner', 'admin', 'finance']
const ownersAndAdmins: Role[] = ['owner', 'admin']

// The main navigation deliberately contains only frequent work. Rare configuration stays under management/system.
export const navItems: NavItem[] = [
  { href: ROUTES.app.dashboard, label: 'Übersicht', icon: 'dashboard', roles: all, group: 'work' },
  { href: ROUTES.app.customers, label: 'Kunden', icon: 'customers', roles: management, group: 'work', feature: 'crm' },
  { href: ROUTES.app.quotes, label: 'Angebote', icon: 'quotes', roles: management, group: 'work', feature: 'quotes' },
  { href: ROUTES.app.orders, label: 'Aufträge', icon: 'orders', roles: all, group: 'work', feature: 'orders' },
  { href: ROUTES.app.time, label: 'Zeit', icon: 'time', roles: all, group: 'work', feature: 'time' },
  { href: ROUTES.app.invoices, label: 'Rechnungen', icon: 'invoices', roles: management, group: 'work', feature: 'invoices' },
  { href: ROUTES.app.contracts, label: 'Verträge', icon: 'contracts', roles: management, group: 'management', feature: 'contracts' },
  { href: ROUTES.app.finance, label: 'Finanzen', icon: 'finance', roles: management, group: 'management', feature: 'finance' },
  { href: ROUTES.app.accounting, label: 'Buchhaltung', icon: 'accounting', roles: management, group: 'management', feature: 'accounting' },
  { href: ROUTES.app.employees, label: 'Mitarbeitende', icon: 'employees', roles: ownersAndAdmins, group: 'management', feature: 'employees' },
  { href: ROUTES.app.data, label: 'Daten', icon: 'download', roles: ownersAndAdmins, group: 'management', feature: 'imports' },
  { href: ROUTES.app.organization, label: 'Organisation', icon: 'building', roles: ownersAndAdmins, group: 'system' },
  { href: ROUTES.app.account, label: 'Konto', icon: 'user', roles: all, group: 'system' },
  { href: ROUTES.app.settings, label: 'Einstellungen', icon: 'settings', roles: all, group: 'system' },
  { href: ROUTES.app.platform, label: 'Plattform', icon: 'dashboard', roles: ['owner'], group: 'system', platformOnly: true },
]

export function navForRole(role: Role) {
  return navItems.filter((item) => item.roles.includes(role) && !item.platformOnly)
}

export function navForUser(user: AppUser) {
  return navItems.filter((item) => item.roles.includes(user.role) && (!item.platformOnly || Boolean(user.platformRole)))
}
