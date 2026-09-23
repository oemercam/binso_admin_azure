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

export const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard', roles: all, group: 'work' },
  { href: '/contacts', label: 'Kontakte', icon: 'customers', roles: management, group: 'work', feature: 'crm' },
  { href: '/customers', label: 'Firmen', icon: 'building', roles: management, group: 'work', feature: 'crm' },
  { href: '/quotes', label: 'Angebote', icon: 'quotes', roles: management, group: 'work', feature: 'quotes' },
  { href: '/orders', label: 'Aufträge', icon: 'orders', roles: all, group: 'work', feature: 'orders' },
  { href: '/contracts', label: 'Verträge', icon: 'contracts', roles: management, group: 'work', feature: 'contracts' },
  { href: '/time', label: 'Zeiterfassung', icon: 'time', roles: all, group: 'work', feature: 'time' },
  { href: '/invoices', label: 'Rechnungen', icon: 'invoices', roles: management, group: 'work', feature: 'invoices' },
  { href: '/finance', label: 'Finanzen', icon: 'finance', roles: management, group: 'management', feature: 'finance' },
  { href: '/accounting', label: 'Buchhaltung', icon: 'accounting', roles: management, group: 'management', feature: 'finance' },
  { href: '/employees', label: 'Mitarbeitende', icon: 'employees', roles: ownersAndAdmins, group: 'management', feature: 'employees' },
  { href: '/organization', label: 'Organisation', icon: 'building', roles: ownersAndAdmins, group: 'system' },
  { href: '/account', label: 'Konto', icon: 'user', roles: all, group: 'system' },
  { href: '/data', label: 'Daten', icon: 'download', roles: ownersAndAdmins, group: 'system' },
  { href: '/settings', label: 'Einstellungen', icon: 'settings', roles: all, group: 'system' },
  { href: '/platform', label: 'Plattform', icon: 'dashboard', roles: ['owner'], group: 'system', platformOnly: true },
]

export function navForRole(role: Role) {
  return navItems.filter((item) => item.roles.includes(role) && !item.platformOnly)
}

export function navForUser(user: AppUser) {
  return navItems.filter((item) => item.roles.includes(user.role) && (!item.platformOnly || Boolean(user.platformRole)))
}
