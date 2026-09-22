'use client'

import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import type { AppUser } from '@/types/domain'
import { DesktopNav } from '@/components/navigation/desktop-nav'
import { MobilePillNav } from '@/components/navigation/mobile-pill-nav'
import { BinsoLogo } from '@/components/ui/binso-logo'
import { Icon } from '@/components/ui/icon'
import { AppOverlays } from '@/components/shared/app-overlays'

export function AppShell({
  user,
  children,
}: {
  user: AppUser
  children: ReactNode
}) {
  const pathname = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [mobileHeaderHidden, setMobileHeaderHidden] = useState(false)
  const lastScrollY = useRef(0)


  useEffect(() => {
    setMobileHeaderHidden(false)
    lastScrollY.current = 0
  }, [pathname])

  useEffect(() => {
    const onPositioned = (event: Event) => {
      const detail = (event as CustomEvent<{ y?: number }>).detail
      lastScrollY.current = Math.max(0, detail?.y ?? window.scrollY)
      setMobileHeaderHidden(false)
    }

    window.addEventListener('binso:scroll-positioned', onPositioned)
    return () => window.removeEventListener('binso:scroll-positioned', onPositioned)
  }, [])

  useEffect(() => {
    const onScroll = () => {
      if (window.matchMedia('(min-width: 761px)').matches) {
        setMobileHeaderHidden(false)
        return
      }

      const currentY = Math.max(0, window.scrollY)
      const delta = currentY - lastScrollY.current

      if (currentY < 24) {
        setMobileHeaderHidden(false)
      } else if (delta > 8) {
        setMobileHeaderHidden(true)
      } else if (delta < -6) {
        setMobileHeaderHidden(false)
      }

      lastScrollY.current = currentY
    }

    lastScrollY.current = Math.max(0, window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="app-frame">
      <header className={mobileHeaderHidden ? 'topbar is-hidden' : 'topbar'}>
        <div className="topbar-brand">
          <BinsoLogo />
        </div>

        <button className="global-search" onClick={() => setSearchOpen(true)}>
          <Icon name="search" size={16} />
          <span>Suchen</span>
          <kbd>Ctrl K</kbd>
        </button>

        <div className="topbar-actions">
          <button className="topbar-icon" aria-label="Benachrichtigungen" onClick={() => { setNotificationsOpen((current) => !current); setProfileOpen(false); setQuickOpen(false) }}>
            <Icon name="bell" size={17} />
            <i />
          </button>

          <button
            className="avatar-button"
            onClick={() => { setProfileOpen((current) => !current); setNotificationsOpen(false); setQuickOpen(false) }}
            aria-label="Profil öffnen"
          >
            <span className="avatar">{initials(user.name)}</span>
          </button>
        </div>
      </header>

      <div className="app-shell">
        <DesktopNav user={user} />
        <main className="app-main">{children}</main>
      </div>

      <MobilePillNav
        user={user}
        onSearch={() => setSearchOpen(true)}
        onQuick={() => setQuickOpen(true)}
      />

      <AppOverlays
        user={user}
        searchOpen={searchOpen}
        setSearchOpen={setSearchOpen}
        quickOpen={quickOpen}
        setQuickOpen={setQuickOpen}
        profileOpen={profileOpen}
        setProfileOpen={setProfileOpen}
        notificationsOpen={notificationsOpen}
        setNotificationsOpen={setNotificationsOpen}
      />
    </div>
  )
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'BI'
  )
}
