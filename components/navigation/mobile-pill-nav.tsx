'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from '@/components/ui/icon'
import { navForRole } from './nav-items'
import type { AppUser } from '@/types/domain'

export function MobilePillNav({
  user,
  onSearch,
  onQuick,
}: {
  user: AppUser
  onSearch: () => void
  onQuick: () => void
}) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const items = navForRole(user.role)

  return (
    <>
      {menuOpen && (
        <div className="mobile-menu-layer" onClick={() => setMenuOpen(false)}>
          <div className="mobile-menu-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-grabber" />
            <div className="sheet-heading">
              <div>
                <strong>Navigation</strong>
                <span>Binso Administration</span>
              </div>
              <button className="icon-button" onClick={() => setMenuOpen(false)} aria-label="Schliessen">
                <Icon name="close" size={17} />
              </button>
            </div>

            <nav>
              {items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={active ? 'active' : undefined}
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className="mobile-menu-icon"><Icon name={item.icon} size={17} /></span>
                    <span>{item.label}</span>
                    <Icon name="chevron" size={15} />
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}

      <div className="mobile-pill" aria-label="Mobile Navigation">
        <button type="button" className="pill-search" onClick={onSearch}>
          <Icon name="search" size={17} />
          <span>Suche</span>
        </button>

        <button type="button" className="pill-add" onClick={onQuick} aria-label="Neu erstellen">
          <Icon name="plus" size={18} />
        </button>

        <button type="button" className="pill-menu" onClick={() => setMenuOpen(true)}>
          <span>Menü</span>
          <Icon name="menu" size={17} />
        </button>
      </div>
    </>
  )
}
