'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/icon'
import { AppSheet } from '@/components/ui/sheet-system'
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
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const items = navForRole(user.role)

  const createLabels: Record<string, string> = {
    '/customers': 'Kunde erfassen',
    '/orders': 'Auftrag erstellen',
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
      <AppSheet
        open={menuOpen}
        mode="bottom"
        title="Navigation"
        subtitle="Binso Administration"
        onClose={() => setMenuOpen(false)}
        showClose
        showGrabber
        panelClassName="mobile-menu-sheet"
      >
        <nav className="mobile-menu-nav">
          {items.map((item) => {
            const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? 'active' : undefined}
                onClick={() => setMenuOpen(false)}
              >
                <span className="mobile-menu-icon">
                  <Icon name={item.icon} size={17} />
                </span>

                <span className="mobile-menu-label">
                  {item.label}
                </span>

                <Icon name="chevron" size={15} />
              </Link>
            )
          })}
        </nav>
      </AppSheet>

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
