'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
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
  const [searchOpen, setSearchOpen] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <div className="app-frame">
      <header className="topbar">
        <div className="topbar-brand">
          <BinsoLogo />
        </div>

        <button className="global-search" onClick={() => setSearchOpen(true)}>
          <Icon name="search" size={16} />
          <span>Suchen</span>
          <kbd>Ctrl K</kbd>
        </button>

        <div className="topbar-actions">
          <button className="topbar-create" onClick={() => setQuickOpen(true)}>
            <Icon name="plus" size={16} />
            <span>Neu</span>
          </button>

          <button className="topbar-icon" aria-label="Benachrichtigungen">
            <Icon name="bell" size={17} />
            <i />
          </button>

          <button
            className="avatar-button"
            onClick={() => setProfileOpen((current) => !current)}
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
