'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/icon'
import { ResponsiveOverlay } from '@/components/ui/responsive-overlay'
import { NavigationItem } from './navigation-item'
import { navForRole } from './nav-items'
import type { AppUser } from '@/types/domain'
import { createActionForPath } from './action-items'

export function MobilePillNav({
  user,
  onSearch,
  onQuick,
  searchOpen,
}: {
  user: AppUser
  onSearch: () => void
  onQuick: () => void
  searchOpen: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const items = navForRole(user.role)

  const createAction = createActionForPath(pathname, user.role)

  function handleCreate() {
    if (createAction) {
      router.push(createAction.href, { scroll: false })
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
          className={searchOpen ? 'pill-search active' : 'pill-search'}
          onClick={onSearch}
          aria-label="Suche öffnen"
          aria-pressed={searchOpen}
        >
          <Icon name="search" size={17} />
          <span>Suche</span>
        </button>


        <button
          type="button"
          className="pill-add"
          onClick={handleCreate}
          aria-label={createAction?.label ?? 'Neu erstellen'}
        >
          <Icon name="plus" size={20} />
        </button>


        <button
          type="button"
          className="pill-menu"
          onClick={() => setMenuOpen(true)}
          aria-label="Menü öffnen"
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
        >
          <span>Menü</span>
          <Icon name="menu" size={17} />
        </button>
      </nav>
    </>
  )
}
