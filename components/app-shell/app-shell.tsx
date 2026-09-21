import type { ReactNode } from 'react'
import type { AppUser } from '@/types/domain'
import { DesktopNav } from '@/components/navigation/desktop-nav'
import { MobilePillNav } from '@/components/navigation/mobile-pill-nav'

export function AppShell({ user, children }: { user: AppUser; children: ReactNode }) {
  return <div className="app-shell"><DesktopNav/><main className="app-main"><header className="app-header"><div><small>BIN SO GMBH</small><strong>Administration</strong></div><div className="user-chip" title={user.email}>{user.name.slice(0,2).toUpperCase()}</div></header>{children}</main><MobilePillNav/></div>
}
