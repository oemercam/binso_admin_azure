'use client'

import Link from 'next/link'
import type { CSSProperties } from 'react'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { publicSite } from '@/lib/config/public-site'

export function PublicMobileMenu() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKeyDown); document.body.style.overflow = '' }
  }, [open])

  const closeMenu = () => setOpen(false)

  return (
    <div className={open ? 'public-mobile-menu is-open' : 'public-mobile-menu'}>
      <button className="public-mobile-menu-trigger" type="button" aria-label={open ? 'Navigation schliessen' : 'Navigation öffnen'} aria-expanded={open} aria-controls="public-mobile-navigation" onClick={() => setOpen((value) => !value)}>
        <span className="public-menu-icon" aria-hidden="true"><i /><i /><i /></span>
      </button>
      <div className="public-mobile-menu-panel" id="public-mobile-navigation" aria-hidden={!open}>
        <nav aria-label="Mobile Navigation">
          {publicSite.primaryNavigation.map((item, index) => (
            <Link key={item.href} href={item.href} className={pathname === item.href ? 'active' : ''} style={{ '--menu-index': index } as CSSProperties} onClick={closeMenu}>
              <span>{String(index + 1).padStart(2, '0')}</span>{item.label}
            </Link>
          ))}
          <div className="public-mobile-menu-secondary">
            <Link href="/faq" onClick={closeMenu}>FAQ</Link>
            <Link href="/contact" onClick={closeMenu}>Kontakt</Link>
            <Link href="/sign-in" onClick={closeMenu}>Kunden-Login</Link>
            <Link href="/register" onClick={closeMenu}>Konto erstellen</Link>
          </div>
        </nav>
      </div>
    </div>
  )
}
