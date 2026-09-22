'use client'

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
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

function sameEnvironment(a: DeviceEnvironment, b: DeviceEnvironment) {
  return Object.keys(a).every((key) => a[key as keyof DeviceEnvironment] === b[key as keyof DeviceEnvironment])
}

function writeViewportTokens(value: Pick<DeviceEnvironment, 'layoutViewportWidth' | 'layoutViewportHeight' | 'visualViewportWidth' | 'visualViewportHeight' | 'visualViewportOffsetTop'>) {
  const root = document.documentElement
  const values: Record<string, number> = {
    '--app-layout-viewport-width': value.layoutViewportWidth,
    '--app-layout-viewport-height': value.layoutViewportHeight,
    '--app-visual-viewport-width': value.visualViewportWidth,
    '--app-visual-viewport-height': value.visualViewportHeight,
    '--app-visual-viewport-offset-top': value.visualViewportOffsetTop,
  }
  for (const [name, next] of Object.entries(values)) {
    const text = `${Math.round(next * 100) / 100}px`
    if (root.style.getPropertyValue(name) !== text) root.style.setProperty(name, text)
  }
}

export function DeviceEnvironmentProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<DeviceEnvironment>(initial)
  const currentRef = useRef<DeviceEnvironment>(initial)

  useEffect(() => {
    let frame = 0
    let viewportFrame = 0

    const commitEnvironment = () => {
      if (frame) cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const next = readEnvironment()
        writeViewportTokens(next)
        if (!sameEnvironment(currentRef.current, next)) {
          currentRef.current = next
          setValue(next)
        }
      })
    }

    const updateViewportTokensOnly = () => {
      if (viewportFrame) cancelAnimationFrame(viewportFrame)
      viewportFrame = requestAnimationFrame(() => {
        const visual = window.visualViewport
        if (!visual) return
        writeViewportTokens({
          layoutViewportWidth: window.innerWidth,
          layoutViewportHeight: window.innerHeight,
          visualViewportWidth: visual.width,
          visualViewportHeight: visual.height,
          visualViewportOffsetTop: visual.offsetTop,
        })
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

    commitEnvironment()
    window.addEventListener('resize', commitEnvironment, { passive: true })
    window.addEventListener('orientationchange', commitEnvironment, { passive: true })
    visual?.addEventListener('resize', commitEnvironment, { passive: true })
    // offsetTop can change while Safari's chrome/keyboard moves. Keep this lightweight:
    // update CSS custom properties only, never the broad React context on scroll.
    visual?.addEventListener('scroll', updateViewportTokensOnly, { passive: true })
    media.forEach((query) => query.addEventListener('change', commitEnvironment))

    return () => {
      if (frame) cancelAnimationFrame(frame)
      if (viewportFrame) cancelAnimationFrame(viewportFrame)
      window.removeEventListener('resize', commitEnvironment)
      window.removeEventListener('orientationchange', commitEnvironment)
      visual?.removeEventListener('resize', commitEnvironment)
      visual?.removeEventListener('scroll', updateViewportTokensOnly)
      media.forEach((query) => query.removeEventListener('change', commitEnvironment))
    }
  }, [])

  return <DeviceEnvironmentContext.Provider value={value}>{children}</DeviceEnvironmentContext.Provider>
}

export function useDeviceEnvironment() {
  return useContext(DeviceEnvironmentContext)
}
