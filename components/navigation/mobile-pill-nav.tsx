'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/icon'
import { ResponsiveOverlay } from '@/components/ui/responsive-overlay'
import { NavigationItem } from './navigation-item'
import { navForRole, navForUser } from './nav-items'
import type { AppUser } from '@/types/domain'
import { useBusinessStore } from '@/components/state/business-store'

export function MobilePillNav({
  user,
  onSearch,
  onQuick,
}: {
  user: AppUser
  onSearch: () => void
  onQuick: () => void
  searchOpen?: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()
  const store = useBusinessStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const enabled = new Set(store.entitlements[0]?.features ?? [])
  const items = (user.platformRole ? navForUser(user) : navForRole(user.role)).filter((item) => !item.feature || enabled.has(item.feature))

  const createLabels: Record<string, string> = {
    '/customers': 'Kunde erfassen',
    '/orders': 'Auftrag erstellen',
    '/contracts': 'Vertrag erfassen',
    '/quotes': 'Angebot erstellen',
    '/invoices': 'Rechnung erstellen',
    '/employees': 'Mitarbeitende erfassen',
    '/time': 'Zeit erfassen',
    '/accounting': 'Lieferantenrechnung erfassen',
  }

  function handleCreate() {
    if (createLabels[pathname]) {
      router.push(`${pathname}?new=1`, { scroll: false })
      return
    }

    onQuick()
  }

  return (
    <>
      <ResponsiveOverlay
        open={menuOpen}
        title="Menü"
        onClose={() => setMenuOpen(false)}
        showClose
        showGrabber={false}
        panelClassName="mobile-menu-sheet"
      >
        <nav className="mobile-menu-nav">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <NavigationItem
                key={item.href}
                item={item}
                active={active}
                variant="mobile"
                onNavigate={() => setMenuOpen(false)}
              />
            )
          })}
        </nav>
      </ResponsiveOverlay>

      <nav
        className="mobile-pill"
        aria-label="Mobile Navigation"
      >
        <button
          type="button"
          className="pill-search"
          onClick={onSearch}
          aria-label="Suche öffnen"
        >
          <Icon name="search" size={17} />
          <span>Suche</span>
        </button>


        <button
          type="button"
          className="pill-add"
          onClick={handleCreate}
          aria-label={createLabels[pathname] ?? 'Neu erstellen'}
        >
          <Icon name="plus" size={18} />
        </button>


        <button
          type="button"
          className="pill-menu"
          onClick={() => setMenuOpen(true)}
          aria-label="Menü öffnen"
        >
          <span>Menü</span>
          <Icon name="menu" size={17} />
        </button>
      </nav>
    </>
  )
}
