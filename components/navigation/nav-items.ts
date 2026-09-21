import type { IconName } from '@/components/ui/icon'

export const navItems: ReadonlyArray<{
  href: string
  label: string
  icon: IconName
  group: 'work' | 'system'
}> = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    group: 'work',
  },
  {
    href: '/customers',
    label: 'Kunden',
    icon: 'customers',
    group: 'work',
  },
  {
    href: '/orders',
    label: 'Aufträge',
    icon: 'orders',
    group: 'work',
  },
  {
    href: '/time',
    label: 'Zeiterfassung',
    icon: 'time',
    group: 'work',
  },
  {
    href: '/invoices',
    label: 'Rechnungen',
    icon: 'invoices',
    group: 'work',
  },
  {
    href: '/finance',
    label: 'Finanzen',
    icon: 'finance',
    group: 'work',
  },
  {
    href: '/settings',
    label: 'Einstellungen',
    icon: 'settings',
    group: 'system',
  },
]
