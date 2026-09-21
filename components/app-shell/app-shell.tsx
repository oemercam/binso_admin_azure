import type { ReactNode } from 'react'
import type { AppUser } from '@/types/domain'
import { DesktopNav } from '@/components/navigation/desktop-nav'
import { MobilePillNav } from '@/components/navigation/mobile-pill-nav'

export function AppShell({
  user,
  children,
}: {
  user: AppUser
  children: ReactNode
}) {
  const initials =
    user.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'BI'

  return (
    <div className="app-shell">
      <DesktopNav />

      <main className="app-main">
        <header className="app-header">
          <div className="app-context">
            <small>BIN SO GMBH</small>
            <strong>Administration</strong>
          </div>

          <div
            className="user-chip"
            title={`${user.name} · ${user.email}`}
          >
            {initials}
          </div>
        </header>

        {children}
      </main>

      <MobilePillNav />
    </div>
  )
}
