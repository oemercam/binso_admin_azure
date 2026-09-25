'use client'

import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { readStorage, writeStorage } from '@/lib/browser/storage'

const STORAGE_PREFIX = 'binso-scroll:'

function storageKey(pathname: string) {
  return `${STORAGE_PREFIX}${pathname}`
}

function readPosition(pathname: string) {
  try {
    const value = readStorage(storageKey(pathname), 'session')
    if (!value) return 0
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
  } catch {
    return 0
  }
}

function writePosition(pathname: string, y: number) {
  try {
    writeStorage(storageKey(pathname), String(Math.max(0, Math.round(y))), 'session')
  } catch {
    // Scroll restoration is a progressive enhancement.
  }
}

export function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const previousPath = useRef(pathname)
  const isHistoryNavigation = useRef(false)

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

    const onPopState = () => {
      isHistoryNavigation.current = true
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    let frame = 0
    let pending = false

    const save = () => {
      pending = false
      writePosition(pathname, window.scrollY)
    }

    const onScroll = () => {
      if (pending) return
      pending = true
      frame = window.requestAnimationFrame(save)
    }

    const onPageHide = () => writePosition(pathname, window.scrollY)

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pagehide', onPageHide)

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pagehide', onPageHide)
    }
  }, [pathname])

  useEffect(() => {
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
