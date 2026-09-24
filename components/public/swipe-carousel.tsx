'use client'

import type { ReactNode, UIEvent } from 'react'
import { useRef, useState } from 'react'

export function SwipeCarousel({ children, className, count }: { children: ReactNode; className: string; count: number }) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  function syncActive(event: UIEvent<HTMLDivElement>) {
    const viewport = event.currentTarget
    const items = Array.from(viewport.children) as HTMLElement[]
    if (!items.length) return
    const center = viewport.scrollLeft + viewport.clientWidth / 2
    let next = 0
    let distance = Number.POSITIVE_INFINITY
    items.forEach((item, index) => {
      const itemCenter = item.offsetLeft + item.offsetWidth / 2
      const candidate = Math.abs(itemCenter - center)
      if (candidate < distance) {
        distance = candidate
        next = index
      }
    })
    setActive(next)
  }

  function scrollTo(index: number) {
    const viewport = viewportRef.current
    const item = viewport?.children.item(index) as HTMLElement | null
    item?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
  }

  return (
    <div className="public-swipe-carousel">
      <div ref={viewportRef} className={className} onScroll={syncActive}>{children}</div>
      <div className="public-carousel-indicator" aria-label={`Plan ${active + 1} von ${count}`}>
        {Array.from({ length: count }, (_, index) => (
          <button
            key={index}
            type="button"
            className={index === active ? 'active' : ''}
            aria-label={`Plan ${index + 1} anzeigen`}
            onClick={() => scrollTo(index)}
          />
        ))}
      </div>
    </div>
  )
}
