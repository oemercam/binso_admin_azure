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
    setHidden(false)
    lastScrollY.current = 0
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
    if (!isMobileLayout) {
      setHidden(false)
      return
    }

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
    return () => window.removeEventListener('scroll', onScroll)
  }, [isMobileLayout])

  return hidden
}
