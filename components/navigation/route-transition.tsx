'use client'

import type { ReactNode } from 'react'

export function RouteTransition({ children }: { children: ReactNode }) {
  return <div className="route-stage">{children}</div>
}
