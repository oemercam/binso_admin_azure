'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useDeviceEnvironment } from '@/components/providers/device-environment-provider'

export function useHeaderVisibility() {
  const pathname = usePathname()
  const { isMobileLayout } = useDeviceEnvironment()
  const [hidden, setHidden] = useState(false)
  const lastScrollY = useRef(0)

  useEffect(() => {
    lastScrollY.current = 0
    const reset = window.setTimeout(() => setHidden(false), 0)
    return () => window.clearTimeout(reset)
  }, [pathname])

  useEffect(() => {
    const onPositioned = (event: Event) => {
      const detail = (event as CustomEvent<{ y?: number }>).detail
      lastScrollY.current = Math.max(0, detail?.y ?? window.scrollY)
      setHidden(false)
    }
    window.addEventListener('binso:scroll-positioned', onPositioned)
    return () => window.removeEventListener('binso:scroll-positioned', onPositioned)
  }, [])

  useEffect(() => {
    const reset = window.setTimeout(() => setHidden(false), 0)
    if (!isMobileLayout) return () => window.clearTimeout(reset)

    const onScroll = () => {
      const currentY = Math.max(0, window.scrollY)
      const delta = currentY - lastScrollY.current
      if (currentY < 24) setHidden(false)
      else if (delta > 8) setHidden(true)
      else if (delta < -6) setHidden(false)
      lastScrollY.current = currentY
    }

    lastScrollY.current = Math.max(0, window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.clearTimeout(reset)
      window.removeEventListener('scroll', onScroll)
    }
  }, [isMobileLayout])

  return isMobileLayout ? hidden : false
}
