'use client'

import { usePathname } from 'next/navigation'
import { Icon } from '@/components/ui/icon'
import { NavigationItem } from './navigation-item'
import { navForRole, navForUser } from './nav-items'
import type { AppUser } from '@/types/domain'
import { useBusinessStore } from '@/components/state/business-store'

export function DesktopNav({ user }: { user: AppUser }) {
  const pathname = usePathname()
  const store = useBusinessStore()
  const enabled = new Set(store.entitlements.find((item) => item.organizationId === store.currentOrganizationId)?.features ?? [])
  const items = (user.platformRole ? navForUser(user) : navForRole(user.role)).filter((item) => !item.feature || enabled.has(item.feature))
  const primary = items.filter((item) => item.placement === 'primary')
  const more = items.filter((item) => item.placement === 'more')
  const hidden = items.filter((item) => item.placement === 'hidden')
  const moreActive = [...more, ...hidden].some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))

  return (
    <aside className="desktop-nav">
      <div className="desktop-nav-section">
        <span className="nav-section-label">Binso One</span>
        <nav>
          {primary.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`) || (item.href === '/work' && ['/quotes', '/orders', '/contracts'].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)))
            return <NavigationItem key={item.href} item={item} active={active} variant="desktop" />
          })}
        </nav>
      </div>

      {more.length > 0 && (
        <details className="desktop-nav-more" open={moreActive || undefined}>
          <summary><span><Icon name="menu" size={16} />Mehr</span><Icon name="chevron" size={14} /></summary>
          <nav>
            {more.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return <NavigationItem key={item.href} item={item} active={active} variant="desktop" />
            })}
          </nav>
        </details>
      )}

      <div className="nav-spacer" />
      <div className="nav-footer"><span className="status-dot" /><span>Production</span></div>
    </aside>
  )
}
