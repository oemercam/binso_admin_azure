'use client'

import Link from 'next/link'
import { Icon } from '@/components/ui/icon'
import type { NavItem } from './nav-items'

export function NavigationItem({
  item,
  active,
  variant = 'mobile',
  onNavigate,
}: {
  item: NavItem
  active: boolean
  variant?: 'mobile' | 'desktop'
  onNavigate?: () => void
}) {
  return (
    <Link
      href={item.href}
      className={`navigation-item navigation-item-${variant}${active ? ' active' : ''}`}
      aria-current={active ? 'page' : undefined}
      onClick={onNavigate}
    >
      <span className="navigation-item-icon"><Icon name={item.icon} size={variant === 'mobile' ? 17 : 16} /></span>
      <span className="navigation-item-label">{item.label}</span>
      {variant === 'mobile' ? <Icon className="navigation-item-chevron" name="chevron" size={15} /> : null}
    </Link>
  )
}
