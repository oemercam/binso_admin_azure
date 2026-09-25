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

  const close = () => setOpen(false)
  return (
    <div className={open ? 'v80-mobile-menu is-open' : 'v80-mobile-menu'}>
      <button className="v80-menu-trigger" type="button" aria-label={open ? 'Navigation schliessen' : 'Navigation öffnen'} aria-expanded={open} aria-controls="public-mobile-navigation" onClick={() => setOpen((value) => !value)}>
        <span aria-hidden="true"><i /><i /><i /></span>
      </button>
      <div className="v80-mobile-menu-panel" id="public-mobile-navigation" aria-hidden={!open}>
        <nav aria-label="Mobile Navigation">
          <div className="v80-mobile-primary">
            {publicSite.primaryNavigation.map((item) => <Link key={item.href} href={item.href} className={pathname === item.href ? 'active' : ''} onClick={close}>{item.label}<span>→</span></Link>)}
          </div>
          <div className="v80-mobile-meta"><Link href="/security" onClick={close}>Sicherheit</Link><Link href="/contact" onClick={close}>Kontakt</Link></div>
          <div className="v80-mobile-access">
            <Link href="/sign-in" onClick={close}>Kundenlogin</Link>
            <Link href="/admin-access" onClick={close}>Admin-Zugang</Link>
            <Link className="button primary" href="/register" onClick={close}>30 Tage kostenlos testen</Link>
          </div>
        </nav>
      </div>
    </div>
  )
}
