'use client'

import { usePathname } from 'next/navigation'
import { NavigationItem } from './navigation-item'
import { navForRole } from './nav-items'
import type { AppUser } from '@/types/domain'

export function DesktopNav({ user }: { user: AppUser }) {
  const pathname = usePathname()
  const items = navForRole(user.role)
  const work = items.filter((item) => item.group === 'work')
  const management = items.filter((item) => item.group === 'management')
  const system = items.filter((item) => item.group === 'system')

  function render(itemsToRender: typeof items) {
    return itemsToRender.map((item) => {
      const active = pathname === item.href || pathname.startsWith(`${item.href}/`)

      return <NavigationItem key={item.href} item={item} active={active} variant="desktop" />
    })
  }

  return (
    <aside className="desktop-nav">
      <div className="desktop-nav-section">
        <span className="nav-section-label">Arbeitsbereich</span>
        <nav>{render(work)}</nav>
      </div>

      {management.length > 0 && (
        <div className="desktop-nav-section">
          <span className="nav-section-label">Verwaltung</span>
          <nav>{render(management)}</nav>
        </div>
      )}

      <div className="nav-spacer" />

      <div className="desktop-nav-section system-section">
        <nav>{render(system)}</nav>
      </div>

      <div className="nav-footer">
        <span className="status-dot" />
        <span>Production</span>
      </div>
    </aside>
  )
}
