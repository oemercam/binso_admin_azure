'use client'
import { useEffect, useState } from 'react'

type Theme = 'system' | 'light' | 'dark'

function apply(theme: Theme) {
  const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
  document.querySelectorAll('meta[name="theme-color"]').forEach(el => el.setAttribute('content', dark ? '#0b0b0c' : '#f5f5f7'))
}

export function ThemeControl() {
  const [theme, setTheme] = useState<Theme>('system')
  useEffect(() => {
    const stored = (localStorage.getItem('binso-theme') as Theme | null) ?? 'system'
    setTheme(stored); apply(stored)
    const media = matchMedia('(prefers-color-scheme: dark)')
    const listener = () => stored === 'system' && apply('system')
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [])
  function change(value: Theme) { setTheme(value); localStorage.setItem('binso-theme', value); apply(value) }
  return <div className="segmented" role="group" aria-label="Darstellung">
    {(['system','light','dark'] as const).map(value => <button key={value} aria-pressed={theme===value} onClick={() => change(value)}>{value === 'system' ? 'System' : value === 'light' ? 'Hell' : 'Dunkel'}</button>)}
  </div>
}
