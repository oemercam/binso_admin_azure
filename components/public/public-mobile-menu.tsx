'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { publicSite } from '@/lib/config/public-site'

const subscribeToClient = () => () => undefined
const getClientSnapshot = () => true
const getServerSnapshot = () => false

export function PublicMobileMenu() {
  const pathname = usePathname()
  const [openOnPathname, setOpenOnPathname] = useState<string | null>(null)
  const mounted = useSyncExternalStore(subscribeToClient, getClientSnapshot, getServerSnapshot)
  const open = openOnPathname === pathname

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenOnPathname(null)
    }
    const previousOverflow = document.body.style.overflow

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  const close = () => setOpenOnPathname(null)
  const toggle = () => setOpenOnPathname((value) => (value === pathname ? null : pathname))

  const panel = (
    <div
      className={open ? 'v80-mobile-menu-panel is-open' : 'v80-mobile-menu-panel'}
      id="public-mobile-navigation"
      aria-hidden={!open}
    >
      <nav aria-label="Mobile Navigation">
        <div className="v80-mobile-primary">
          {publicSite.primaryNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? 'active' : ''}
              onClick={close}
            >
              {item.label}
              <span>→</span>
            </Link>
          ))}
        </div>
        <div className="v80-mobile-meta">
          <Link href="/security" onClick={close}>Sicherheit</Link>
          <Link href="/contact" onClick={close}>Kontakt</Link>
        </div>
        <div className="v80-mobile-access">
          <Link href="/sign-in" onClick={close}>Kundenlogin</Link>
          <Link href="/admin-access" onClick={close}>Admin-Zugang</Link>
          <Link className="button primary" href="/register" onClick={close}>30 Tage kostenlos testen</Link>
        </div>
      </nav>
    </div>
  )

  return (
    <div className={open ? 'v80-mobile-menu is-open' : 'v80-mobile-menu'}>
      <button
        className="v80-menu-trigger"
        type="button"
        aria-label={open ? 'Navigation schliessen' : 'Navigation öffnen'}
        aria-expanded={open}
        aria-controls="public-mobile-navigation"
        disabled={!mounted}
        data-hydrated={mounted ? 'true' : 'false'}
        onClick={toggle}
      >
        <span aria-hidden="true"><i /><i /><i /></span>
      </button>
      {mounted ? createPortal(panel, document.body) : null}
    </div>
  )
}
