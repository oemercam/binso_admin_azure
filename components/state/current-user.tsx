'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useBusinessStore } from '@/components/state/business-store'
import type { AppUser } from '@/types/domain'

const CurrentUserContext = createContext<AppUser | null>(null)

export function CurrentUserProvider({ user, children }: { user: AppUser; children: ReactNode }) {
  const store = useBusinessStore()
  const effectiveUser: AppUser = {
    ...user,
    role: store.activeMembership?.role ?? user.role,
  }
  return <CurrentUserContext.Provider value={effectiveUser}>{children}</CurrentUserContext.Provider>
}

export function useCurrentUser() {
  const user = useContext(CurrentUserContext)
  if (!user) throw new Error('useCurrentUser must be used inside CurrentUserProvider')
  return user
}
