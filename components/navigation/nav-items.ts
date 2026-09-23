import type { IconName } from '@/components/ui/icon'
import type { AppUser, Role } from '@/types/domain'

export type NavItem = {
  href: string
  label: string
  icon: IconName
  roles: Role[]
  group: 'work' | 'management' | 'system'
  platformOnly?: boolean
}

const all: Role[] = ['owner', 'admin', 'finance', 'employee']
const management: Role[] = ['owner', 'admin', 'finance']
const ownersAndAdmins: Role[] = ['owner', 'admin']

export const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard', roles: all, group: 'work' },
  { href: '/contacts', label: 'Kontakte', icon: 'customers', roles: management, group: 'work' },
  { href: '/customers', label: 'Firmen', icon: 'building', roles: management, group: 'work' },
  { href: '/quotes', label: 'Angebote', icon: 'quotes', roles: management, group: 'work' },
  { href: '/orders', label: 'Aufträge', icon: 'orders', roles: all, group: 'work' },
  { href: '/contracts', label: 'Verträge', icon: 'contracts', roles: management, group: 'work' },
  { href: '/time', label: 'Zeiterfassung', icon: 'time', roles: all, group: 'work' },
  { href: '/invoices', label: 'Rechnungen', icon: 'invoices', roles: management, group: 'work' },
  { href: '/finance', label: 'Finanzen', icon: 'finance', roles: management, group: 'management' },
  { href: '/accounting', label: 'Buchhaltung', icon: 'accounting', roles: management, group: 'management' },
  { href: '/employees', label: 'Mitarbeitende', icon: 'employees', roles: ownersAndAdmins, group: 'management' },
  { href: '/organization', label: 'Organisation', icon: 'building', roles: ownersAndAdmins, group: 'system' },
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
