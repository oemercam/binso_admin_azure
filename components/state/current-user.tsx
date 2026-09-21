'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { AppUser } from '@/types/domain'

const CurrentUserContext = createContext<AppUser | null>(null)

export function CurrentUserProvider({ user, children }: { user: AppUser; children: ReactNode }) {
  return <CurrentUserContext.Provider value={user}>{children}</CurrentUserContext.Provider>
}

export function useCurrentUser() {
  const user = useContext(CurrentUserContext)
  if (!user) throw new Error('useCurrentUser must be used inside CurrentUserProvider')
  return user
}
