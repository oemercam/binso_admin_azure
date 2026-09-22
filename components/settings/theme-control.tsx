'use client'

import { useTheme, type ThemePreference } from '@/components/providers/theme-provider'

export function ThemeControl() {
  const { preference, setPreference } = useTheme()

  return (
    <div className="segmented" role="group" aria-label="Darstellung">
      {(['system', 'light', 'dark'] as const).map((value: ThemePreference) => (
        <button key={value} type="button" aria-pressed={preference === value} onClick={() => setPreference(value)}>
          {value === 'system' ? 'System' : value === 'light' ? 'Hell' : 'Dunkel'}
        </button>
      ))}
    </div>
  )
}
