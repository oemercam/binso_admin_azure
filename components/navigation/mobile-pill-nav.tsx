'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Icon } from '@/components/ui/icon'
import { ResponsiveOverlay } from '@/components/ui/responsive-overlay'
import { NavigationItem } from './navigation-item'
import { navForRole, navForUser } from './nav-items'
import type { AppUser } from '@/types/domain'
import { useBusinessStore } from '@/components/state/business-store'

export function MobilePillNav({ user }: { user: AppUser }) {
  const pathname = usePathname()
  const store = useBusinessStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const enabled = new Set(store.entitlements.find((item) => item.organizationId === store.currentOrganizationId)?.features ?? [])
  const items = (user.platformRole ? navForUser(user) : navForRole(user.role)).filter((item) => !item.feature || enabled.has(item.feature))
  const primary = items.filter((item) => item.placement === 'primary')
  const more = items.filter((item) => item.placement === 'more')
  const hidden = items.filter((item) => item.placement === 'hidden')
  const moreActive = [...more, ...hidden].some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))

  return (
    <>
      <ResponsiveOverlay open={menuOpen} title="Mehr" description="Verwaltung und Einstellungen" onClose={() => setMenuOpen(false)} showClose showGrabber={false} panelClassName="mobile-menu-sheet">
        <nav className="mobile-menu-nav">
          {more.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return <NavigationItem key={item.href} item={item} active={active} variant="mobile" onNavigate={() => setMenuOpen(false)} />
          })}
        </nav>
      </ResponsiveOverlay>

      <nav className="mobile-primary-nav" aria-label="Hauptnavigation" style={{ gridTemplateColumns: `repeat(${primary.length + 1}, minmax(0,1fr))` }}>
        {primary.map((item) => {
          const workActive = item.href === '/work' && ['/work', '/quotes', '/orders', '/contracts'].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
          const active = workActive || pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link key={item.href} href={item.href} className={active ? 'active' : undefined} aria-current={active ? 'page' : undefined}>
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
            </Link>
          )
        })}
        <button type="button" className={moreActive ? 'active' : undefined} onClick={() => setMenuOpen(true)} aria-label="Mehr öffnen">
          <Icon name="menu" size={18} />
          <span>Mehr</span>
        </button>
      </nav>
    </>
  )
}
