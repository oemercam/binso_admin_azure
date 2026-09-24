'use client'

import Link from 'next/link'
import type { CSSProperties } from 'react'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { publicSite } from '@/lib/config/public-site'
import { signInUrl } from '@/lib/auth/urls'

export function PublicMobileMenu() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function closeMenu() {
    setOpen(false)
  }

  return (
    <div className={open ? 'public-mobile-menu is-open' : 'public-mobile-menu'}>
      <button
        className="public-mobile-menu-trigger"
        type="button"
        aria-label={open ? 'Navigation schliessen' : 'Navigation öffnen'}
        aria-expanded={open}
        aria-controls="public-mobile-navigation"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="public-menu-icon" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </button>

      <div id="public-mobile-navigation" className="public-mobile-menu-panel" aria-hidden={!open}>
        <nav aria-label="Mobile Navigation">
          {publicSite.primaryNavigation.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? 'active' : ''}
              aria-current={pathname === item.href ? 'page' : undefined}
              style={{ '--menu-index': index } as CSSProperties}
              onClick={closeMenu}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              {item.label}
            </Link>
          ))}

          <div className="public-mobile-menu-secondary">
            <Link href="/support" onClick={closeMenu}>Support</Link>
            <Link href="/register" onClick={closeMenu}>Kostenlos testen</Link>
            <a href={signInUrl('/post-login')} onClick={closeMenu}>Anmelden</a>
          </div>
        </nav>
      </div>
    </div>
  )
}
