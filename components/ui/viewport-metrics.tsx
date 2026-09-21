'use client'

import { useEffect } from 'react'

/**
 * Keeps CSS aligned to the actually visible viewport on iOS Safari/PWA.
 * This avoids fixed sheets, sticky actions and the floating pill ending up
 * underneath browser chrome or the Home indicator.
 */
export function ViewportMetrics() {
  useEffect(() => {
    const root = document.documentElement

    const update = () => {
      const viewport = window.visualViewport
      const height = viewport?.height ?? window.innerHeight
      const offsetTop = viewport?.offsetTop ?? 0
      const coveredBottom = Math.max(0, window.innerHeight - height - offsetTop)

      root.style.setProperty('--visible-viewport-height', `${Math.round(height)}px`)
      root.style.setProperty('--visible-viewport-top', `${Math.round(offsetTop)}px`)
      root.style.setProperty('--visible-viewport-bottom', `${Math.round(coveredBottom)}px`)
    }

    update()
    window.addEventListener('resize', update, { passive: true })
    window.addEventListener('orientationchange', update, { passive: true })
    window.visualViewport?.addEventListener('resize', update, { passive: true })
    window.visualViewport?.addEventListener('scroll', update, { passive: true })

    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
      window.visualViewport?.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('scroll', update)
    }
  }, [])

  return null
}
