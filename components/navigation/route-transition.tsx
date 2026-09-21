'use client'

import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return (
    <div key={pathname} className="route-stage">
      {children}
    </div>
  )
}
