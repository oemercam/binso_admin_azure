import type { IconName } from '@/components/ui/icon'
import type { AppUser, OrganizationFeature, Role } from '@/types/domain'

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
  { href: '/dashboard', label: 'Übersicht', icon: 'dashboard', roles: all, group: 'work' },
  { href: '/customers', label: 'Kunden', icon: 'customers', roles: management, group: 'work', feature: 'crm' },
  { href: '/quotes', label: 'Angebote', icon: 'quotes', roles: management, group: 'work', feature: 'quotes' },
  { href: '/orders', label: 'Aufträge', icon: 'orders', roles: all, group: 'work', feature: 'orders' },
  { href: '/time', label: 'Zeit', icon: 'time', roles: all, group: 'work', feature: 'time' },
  { href: '/invoices', label: 'Rechnungen', icon: 'invoices', roles: management, group: 'work', feature: 'invoices' },
  { href: '/contracts', label: 'Verträge', icon: 'contracts', roles: management, group: 'management', feature: 'contracts' },
  { href: '/finance', label: 'Finanzen', icon: 'finance', roles: management, group: 'management', feature: 'finance' },
  { href: '/accounting', label: 'Buchhaltung', icon: 'accounting', roles: management, group: 'management', feature: 'accounting' },
  { href: '/employees', label: 'Mitarbeitende', icon: 'employees', roles: ownersAndAdmins, group: 'management', feature: 'employees' },
  { href: '/data', label: 'Daten', icon: 'download', roles: ownersAndAdmins, group: 'management', feature: 'imports' },
  { href: '/organization', label: 'Organisation', icon: 'building', roles: ownersAndAdmins, group: 'system' },
  { href: '/account', label: 'Konto', icon: 'user', roles: all, group: 'system' },
  { href: '/settings', label: 'Einstellungen', icon: 'settings', roles: all, group: 'system' },
  { href: '/platform', label: 'Plattform', icon: 'dashboard', roles: ['owner'], group: 'system', platformOnly: true },
]

export function navForRole(role: Role) {
  return navItems.filter((item) => item.roles.includes(role) && !item.platformOnly)
}

export function navForUser(user: AppUser) {
  return navItems.filter((item) => item.roles.includes(user.role) && (!item.platformOnly || Boolean(user.platformRole)))
}
