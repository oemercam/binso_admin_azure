'use client'

import Link from 'next/link'
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
      <div className="public-mobile-menu-panel v782-mobile-menu-panel" id="public-mobile-navigation" aria-hidden={!open}>
        <nav aria-label="Mobile Navigation">
          <div className="v782-mobile-menu-primary">
            {publicSite.primaryNavigation.map((item) => (
              <Link key={item.href} href={item.href} className={pathname === item.href ? 'active' : ''} onClick={closeMenu}>
                <span>{item.label}</span><i aria-hidden="true">→</i>
              </Link>
            ))}
          </div>
          <div className="v782-mobile-menu-help">
            <Link href="/contact" onClick={closeMenu}>Kontakt</Link>
            <Link href="/security" onClick={closeMenu}>Sicherheit</Link>
          </div>
          <div className="v782-mobile-menu-access">
            <Link className="v782-mobile-login" href="/sign-in" onClick={closeMenu}>Anmelden</Link>
            <Link className="button primary v782-mobile-trial" href="/register" onClick={closeMenu}>14 Tage kostenlos testen</Link>
          </div>
        </nav>
      </div>
    </div>
  )
}
