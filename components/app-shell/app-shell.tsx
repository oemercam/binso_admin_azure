'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import type { AppUser } from '@/types/domain'
import { DesktopNav } from '@/components/navigation/desktop-nav'
import { MobilePillNav } from '@/components/navigation/mobile-pill-nav'
import { BinsoLogo } from '@/components/ui/binso-logo'
import { Icon } from '@/components/ui/icon'
import { AppOverlays } from '@/components/shared/app-overlays'
import { useHeaderVisibility } from '@/hooks/use-header-visibility'

export function AppShell({
  user,
  children,
  isDemo = false,
}: {
  user: AppUser
  children: ReactNode
  isDemo?: boolean
}) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const mobileHeaderHidden = useHeaderVisibility()

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

      {isDemo ? <div className="app-demo-notice" role="status"><strong>Demo-Arbeitsbereich</strong><span>Fiktive Beispieldaten · keine Abrechnung oder externen Aktionen</span></div> : null}

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
