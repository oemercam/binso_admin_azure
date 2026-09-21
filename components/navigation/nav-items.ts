import type { IconName } from '@/components/ui/icon'
import type { Role } from '@/types/domain'

export type NavItem = {
  href: string
  label: string
  icon: IconName
  roles: Role[]
  group: 'work' | 'management' | 'system'
}

const all: Role[] = ['owner', 'admin', 'finance', 'employee']
const management: Role[] = ['owner', 'admin', 'finance']
const ownersAndAdmins: Role[] = ['owner', 'admin']

export const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard', roles: all, group: 'work' },
  { href: '/customers', label: 'Kunden', icon: 'customers', roles: management, group: 'work' },
  { href: '/quotes', label: 'Angebote', icon: 'quotes', roles: management, group: 'work' },
  { href: '/orders', label: 'Aufträge', icon: 'orders', roles: all, group: 'work' },
  { href: '/time', label: 'Zeiterfassung', icon: 'time', roles: all, group: 'work' },
  { href: '/invoices', label: 'Rechnungen', icon: 'invoices', roles: management, group: 'work' },
  { href: '/finance', label: 'Finanzen', icon: 'finance', roles: management, group: 'management' },
  { href: '/accounting', label: 'Buchhaltung', icon: 'accounting', roles: management, group: 'management' },
  { href: '/employees', label: 'Mitarbeitende', icon: 'employees', roles: ownersAndAdmins, group: 'management' },
  { href: '/settings', label: 'Einstellungen', icon: 'settings', roles: all, group: 'system' },
]

export function navForRole(role: Role) {
  return navItems.filter((item) => item.roles.includes(role))
}
