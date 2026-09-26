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

function isLightAppSurface() {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(display-mode: standalone)').matches || window.innerWidth <= 820
}

function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (isLightAppSurface()) return 'light'
  if (preference === 'light' || preference === 'dark') return preference
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: ResolvedTheme) {
  const root = document.documentElement
  root.dataset.theme = theme
  root.style.colorScheme = isLightAppSurface() ? 'light' : theme
  document.querySelectorAll('meta[name="theme-color"]').forEach((element) => {
    element.setAttribute('content', '#ffffff')
  })
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system')
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light')

  useEffect(() => {
    const stored = readStorage(STORAGE_KEY)
    const nextPreference: ThemePreference = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
    const nextResolved = resolveTheme(nextPreference)
    applyTheme(nextResolved)
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      setPreferenceState(nextPreference)
      setResolvedTheme(nextResolved)
    })

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const standalone = window.matchMedia('(display-mode: standalone)')
    const listener = () => {
      const current = readStorage(STORAGE_KEY)
      const currentPreference: ThemePreference = current === 'light' || current === 'dark' || current === 'system' ? current : 'system'
      const next = resolveTheme(currentPreference)
      setResolvedTheme(next)
      applyTheme(next)
    }

    media.addEventListener('change', listener)
    standalone.addEventListener('change', listener)
    window.addEventListener('resize', listener, { passive: true })
    return () => {
      cancelled = true
      media.removeEventListener('change', listener)
      standalone.removeEventListener('change', listener)
      window.removeEventListener('resize', listener)
    }
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
