'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useDeviceEnvironment } from '@/components/providers/device-environment-provider'
import { subscribeWindowScroll } from '@/lib/browser/window-scroll'

export function useHeaderVisibility() {
  const pathname = usePathname()
  const { isMobileLayout } = useDeviceEnvironment()
  const [hidden, setHidden] = useState(false)
  const hiddenRef = useRef(false)
  const lastScrollY = useRef(0)

  const commitHidden = (next: boolean) => {
    if (hiddenRef.current === next) return
    hiddenRef.current = next
    setHidden(next)
  }

  useEffect(() => {
    lastScrollY.current = 0
    hiddenRef.current = false
    const reset = window.setTimeout(() => setHidden(false), 0)
    return () => window.clearTimeout(reset)
  }, [pathname])

  useEffect(() => {
    const onPositioned = (event: Event) => {
      const detail = (event as CustomEvent<{ y?: number }>).detail
      lastScrollY.current = Math.max(0, detail?.y ?? window.scrollY)
      commitHidden(false)
    }
    window.addEventListener('binso:scroll-positioned', onPositioned)
    return () => window.removeEventListener('binso:scroll-positioned', onPositioned)
  }, [])

  useEffect(() => {
    const reset = window.setTimeout(() => commitHidden(false), 0)
    if (!isMobileLayout) return () => window.clearTimeout(reset)

    const onScroll = (currentY: number) => {
      const delta = currentY - lastScrollY.current
      if (currentY < 24) commitHidden(false)
      else if (delta > 8) commitHidden(true)
      else if (delta < -6) commitHidden(false)
      lastScrollY.current = currentY
    }

    lastScrollY.current = Math.max(0, window.scrollY)
    const unsubscribe = subscribeWindowScroll(onScroll)
    return () => {
      window.clearTimeout(reset)
      unsubscribe()
    }
  }, [isMobileLayout])

  return isMobileLayout ? hidden : false
}
