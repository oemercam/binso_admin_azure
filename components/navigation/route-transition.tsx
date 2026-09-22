'use client'

import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { readStorage, writeStorage } from '@/lib/browser/storage'
import { subscribeWindowScroll } from '@/lib/browser/window-scroll'

const STORAGE_PREFIX = 'binso-scroll:'
const memoryPositions = new Map<string, number>()

function storageKey(pathname: string) {
  return `${STORAGE_PREFIX}${pathname}`
}

function readPosition(pathname: string) {
  const memory = memoryPositions.get(pathname)
  if (memory !== undefined) return memory
  try {
    const value = readStorage(storageKey(pathname), 'session')
    if (!value) return 0
    const parsed = Number(value)
    const position = Number.isFinite(parsed) && parsed > 0 ? parsed : 0
    memoryPositions.set(pathname, position)
    return position
  } catch {
    return 0
  }
}

function rememberPosition(pathname: string, y: number) {
  memoryPositions.set(pathname, Math.max(0, Math.round(y)))
}

function persistPosition(pathname: string) {
  const position = memoryPositions.get(pathname) ?? 0
  try {
    writeStorage(storageKey(pathname), String(position), 'session')
  } catch {
    // Scroll restoration is a progressive enhancement.
  }
}

export function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const previousPath = useRef(pathname)
  const isHistoryNavigation = useRef(false)
  const initialNavigationHandled = useRef(false)

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

    const onPopState = () => {
      isHistoryNavigation.current = true
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    let persistTimer = 0

    const persistSoon = () => {
      if (persistTimer) window.clearTimeout(persistTimer)
      persistTimer = window.setTimeout(() => {
        persistTimer = 0
        persistPosition(pathname)
      }, 250)
    }

    const capture = (scrollY: number) => {
      rememberPosition(pathname, scrollY)
      persistSoon()
    }

    const flush = () => {
      if (persistTimer) {
        window.clearTimeout(persistTimer)
        persistTimer = 0
      }
      rememberPosition(pathname, window.scrollY)
      persistPosition(pathname)
    }

    rememberPosition(pathname, window.scrollY)
    const unsubscribe = subscribeWindowScroll(capture)
    window.addEventListener('pagehide', flush)

    return () => {
      flush()
      unsubscribe()
      window.removeEventListener('pagehide', flush)
    }
  }, [pathname])

  useEffect(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined

    if (!initialNavigationHandled.current) {
      initialNavigationHandled.current = true
      const restoreInitial = navigation?.type === 'reload' || navigation?.type === 'back_forward'
      if (!restoreInitial) return

      const targetY = readPosition(pathname)
      let second = 0
      const first = window.requestAnimationFrame(() => {
        second = window.requestAnimationFrame(() => {
          window.scrollTo({ top: targetY, left: 0, behavior: 'auto' })
          window.dispatchEvent(new CustomEvent('binso:scroll-positioned', { detail: { y: targetY, restored: true } }))
        })
      })

      return () => {
        window.cancelAnimationFrame(first)
        if (second) window.cancelAnimationFrame(second)
      }
    }

    if (previousPath.current === pathname) return

    const restore = isHistoryNavigation.current
    const targetY = restore ? readPosition(pathname) : 0

    previousPath.current = pathname
    isHistoryNavigation.current = false

    // Wait for the new route to paint before positioning the viewport.
    let second = 0
    const first = window.requestAnimationFrame(() => {
      second = window.requestAnimationFrame(() => {
        window.scrollTo({ top: targetY, left: 0, behavior: 'auto' })
        window.dispatchEvent(new CustomEvent('binso:scroll-positioned', { detail: { y: targetY, restored: restore } }))
      })
    })

    return () => {
      window.cancelAnimationFrame(first)
      if (second) window.cancelAnimationFrame(second)
    }
  }, [pathname])

  return <div className="route-stage">{children}</div>
}
