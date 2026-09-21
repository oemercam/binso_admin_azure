'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navItems } from './nav-items'
import { Icon } from '@/components/ui/icon'

export function DesktopNav() {
  const pathname = usePathname()

  const work = navItems.filter((item) => item.group === 'work')
  const system = navItems.filter((item) => item.group === 'system')

  const renderItems = (items: typeof navItems) =>
    items.map((item) => {
      const active =
        pathname === item.href || pathname.startsWith(`${item.href}/`)

      return (
        <Link
          key={item.href}
          href={item.href}
          className={active ? 'active' : undefined}
          aria-current={active ? 'page' : undefined}
        >
          <Icon name={item.icon} size={17} />
          <span>{item.label}</span>
        </Link>
      )
    })

  return (
    <aside className="desktop-nav">
      <div className="brand">
        <span className="brand-mark">B</span>

        <span>
          <strong>Binso</strong>
          <small>Administration</small>
        </span>
      </div>

      <nav>{renderItems(work)}</nav>

      <div className="nav-spacer" />

      <nav className="nav-system">
        {renderItems(system)}
      </nav>

      <div className="nav-footer">
        <span className="status-dot" />
        <span>Production</span>
      </div>
    </aside>
  )
}
