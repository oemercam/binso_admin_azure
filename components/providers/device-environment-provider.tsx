'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { isMobileWidth } from '@/lib/ui/breakpoints'

type Orientation = 'portrait' | 'landscape'
type PointerType = 'coarse' | 'fine' | 'none'

export type DeviceEnvironment = {
  layoutViewportWidth: number
  layoutViewportHeight: number
  visualViewportWidth: number
  visualViewportHeight: number
  visualViewportOffsetTop: number
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
  layoutViewportWidth: 0,
  layoutViewportHeight: 0,
  visualViewportWidth: 0,
  visualViewportHeight: 0,
  visualViewportOffsetTop: 0,
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
  const layoutViewportWidth = window.innerWidth
  const layoutViewportHeight = window.innerHeight
  const visual = window.visualViewport
  const visualViewportWidth = visual?.width ?? layoutViewportWidth
  const visualViewportHeight = visual?.height ?? layoutViewportHeight
  const visualViewportOffsetTop = visual?.offsetTop ?? 0
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const fine = window.matchMedia('(pointer: fine)').matches

  return {
    layoutViewportWidth,
    layoutViewportHeight,
    visualViewportWidth,
    visualViewportHeight,
    visualViewportOffsetTop,
    orientation: layoutViewportWidth >= layoutViewportHeight ? 'landscape' : 'portrait',
    isTouch: navigator.maxTouchPoints > 0 || coarse,
    pointerType: coarse ? 'coarse' : fine ? 'fine' : 'none',
    canHover: window.matchMedia('(hover: hover)').matches,
    isStandalone: window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    prefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
    prefersContrast: window.matchMedia('(prefers-contrast: more)').matches,
    isMobileLayout: isMobileWidth(layoutViewportWidth),
  }
}

function writeViewportTokens(value: DeviceEnvironment) {
  const root = document.documentElement
  root.style.setProperty('--app-layout-viewport-width', `${value.layoutViewportWidth}px`)
  root.style.setProperty('--app-layout-viewport-height', `${value.layoutViewportHeight}px`)
  root.style.setProperty('--app-visual-viewport-width', `${value.visualViewportWidth}px`)
  root.style.setProperty('--app-visual-viewport-height', `${value.visualViewportHeight}px`)
  root.style.setProperty('--app-visual-viewport-offset-top', `${value.visualViewportOffsetTop}px`)
}

export function DeviceEnvironmentProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<DeviceEnvironment>(initial)

  useEffect(() => {
    let frame = 0
    const update = () => {
      if (frame) cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const next = readEnvironment()
        writeViewportTokens(next)
        setValue(next)
      })
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
    const visual = window.visualViewport

    update()
    window.addEventListener('resize', update, { passive: true })
    window.addEventListener('orientationchange', update, { passive: true })
    visual?.addEventListener('resize', update, { passive: true })
    media.forEach((query) => query.addEventListener('change', update))

    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
      visual?.removeEventListener('resize', update)
      media.forEach((query) => query.removeEventListener('change', update))
    }
  }, [])

  const memoized = useMemo(() => value, [value])
  return <DeviceEnvironmentContext.Provider value={memoized}>{children}</DeviceEnvironmentContext.Provider>
}

export function useDeviceEnvironment() {
  return useContext(DeviceEnvironmentContext)
}
