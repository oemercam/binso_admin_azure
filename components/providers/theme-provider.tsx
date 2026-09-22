'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { readStorage, writeStorage } from '@/lib/browser/storage'

export type ThemePreference = 'system' | 'light' | 'dark'
type ResolvedTheme = 'light' | 'dark'

type ThemeContextValue = {
  preference: ThemePreference
  resolvedTheme: ResolvedTheme
  setPreference: (theme: ThemePreference) => void
}

const STORAGE_KEY = 'binso-theme'
const ThemeContext = createContext<ThemeContextValue | null>(null)

function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === 'light' || preference === 'dark') return preference
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: ResolvedTheme) {
  const root = document.documentElement
  root.dataset.theme = theme
  root.style.colorScheme = theme
  document.querySelectorAll('meta[name="theme-color"]').forEach((element) => {
    element.setAttribute('content', theme === 'dark' ? '#0b0c0e' : '#ffffff')
  })
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system')
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light')

  useEffect(() => {
    const stored = readStorage(STORAGE_KEY)
    const nextPreference: ThemePreference = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
    setPreferenceState(nextPreference)
    const nextResolved = resolveTheme(nextPreference)
    setResolvedTheme(nextResolved)
    applyTheme(nextResolved)

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = () => {
      const current = readStorage(STORAGE_KEY)
      if (current && current !== 'system') return
      const next = media.matches ? 'dark' : 'light'
      setResolvedTheme(next)
      applyTheme(next)
    }

    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [])

  function setPreference(next: ThemePreference) {
    writeStorage(STORAGE_KEY, next)
    setPreferenceState(next)
    const resolved = resolveTheme(next)
    setResolvedTheme(resolved)
    applyTheme(resolved)
  }

  const value = useMemo(() => ({ preference, resolvedTheme, setPreference }), [preference, resolvedTheme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('useTheme must be used inside ThemeProvider')
  return value
}
