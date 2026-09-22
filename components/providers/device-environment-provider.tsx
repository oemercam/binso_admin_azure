'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { isMobileWidth } from '@/lib/ui/breakpoints'

type Orientation = 'portrait' | 'landscape'
type PointerType = 'coarse' | 'fine' | 'none'

export type DeviceEnvironment = {
  viewportWidth: number
  viewportHeight: number
  orientation: Orientation
  isTouch: boolean
  pointerType: PointerType
  canHover: boolean
  isStandalone: boolean
  prefersReducedMotion: boolean
  prefersDark: boolean
  prefersContrast: boolean
  isMobileLayout: boolean
}

const initial: DeviceEnvironment = {
  viewportWidth: 0,
  viewportHeight: 0,
  orientation: 'portrait',
  isTouch: false,
  pointerType: 'none',
  canHover: false,
  isStandalone: false,
  prefersReducedMotion: false,
  prefersDark: false,
  prefersContrast: false,
  isMobileLayout: false,
}

const DeviceEnvironmentContext = createContext<DeviceEnvironment>(initial)

function readEnvironment(): DeviceEnvironment {
  const width = window.innerWidth
  const height = window.innerHeight
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const fine = window.matchMedia('(pointer: fine)').matches
  return {
    viewportWidth: width,
    viewportHeight: height,
    orientation: width >= height ? 'landscape' : 'portrait',
    isTouch: navigator.maxTouchPoints > 0 || coarse,
    pointerType: coarse ? 'coarse' : fine ? 'fine' : 'none',
    canHover: window.matchMedia('(hover: hover)').matches,
    isStandalone: window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    prefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
    prefersContrast: window.matchMedia('(prefers-contrast: more)').matches,
    isMobileLayout: isMobileWidth(width),
  }
}

export function DeviceEnvironmentProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<DeviceEnvironment>(initial)

  useEffect(() => {
    let frame = 0
    const update = () => {
      if (frame) cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setValue(readEnvironment()))
    }

    const media = [
      window.matchMedia('(pointer: coarse)'),
      window.matchMedia('(pointer: fine)'),
      window.matchMedia('(hover: hover)'),
      window.matchMedia('(display-mode: standalone)'),
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-color-scheme: dark)'),
      window.matchMedia('(prefers-contrast: more)'),
    ]

    update()
    window.addEventListener('resize', update, { passive: true })
    window.addEventListener('orientationchange', update, { passive: true })
    media.forEach((query) => query.addEventListener('change', update))

    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
      media.forEach((query) => query.removeEventListener('change', update))
    }
  }, [])

  const memoized = useMemo(() => value, [value])
  return <DeviceEnvironmentContext.Provider value={memoized}>{children}</DeviceEnvironmentContext.Provider>
}

export function useDeviceEnvironment() {
  return useContext(DeviceEnvironmentContext)
}
