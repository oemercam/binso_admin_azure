'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useDeviceEnvironment } from '@/components/providers/device-environment-provider'

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

    let frame = 0
    const evaluate = () => {
      frame = 0
      const currentY = Math.max(0, window.scrollY)
      const delta = currentY - lastScrollY.current
      if (currentY < 24) commitHidden(false)
      else if (delta > 8) commitHidden(true)
      else if (delta < -6) commitHidden(false)
      lastScrollY.current = currentY
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(evaluate)
    }

    lastScrollY.current = Math.max(0, window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.clearTimeout(reset)
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
    }
  }, [isMobileLayout])

  return isMobileLayout ? hidden : false
}
