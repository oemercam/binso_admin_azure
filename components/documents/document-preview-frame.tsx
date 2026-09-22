'use client'

import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

export function DocumentPreviewFrame({ children }: { children: ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const [metrics, setMetrics] = useState({ scale: 1, width: 794, height: 1123 })

  useEffect(() => {
    let frame = 0

    const measure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const stage = stageRef.current
        const page = pageRef.current
        if (!stage || !page) return

        const pageWidth = page.scrollWidth || page.offsetWidth || 794
        const pageHeight = page.scrollHeight || page.offsetHeight || 1123
        const styles = getComputedStyle(stage)
        const horizontalPadding =
          Number.parseFloat(styles.paddingLeft || '0') +
          Number.parseFloat(styles.paddingRight || '0')
        const availableWidth = Math.max(240, stage.clientWidth - horizontalPadding)
        const scale = Math.min(1, availableWidth / pageWidth)

        setMetrics({ scale, width: pageWidth, height: pageHeight })
      })
    }

    measure()
    const observer = new ResizeObserver(measure)
    if (stageRef.current) observer.observe(stageRef.current)
    if (pageRef.current) observer.observe(pageRef.current)
    window.addEventListener('resize', measure)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  return (
    <div className="document-fit-stage" ref={stageRef}>
      <div
        className="document-fit-sizer"
        style={{
          width: `${metrics.width * metrics.scale}px`,
          height: `${metrics.height * metrics.scale}px`,
        }}
      >
        <div
          className="document-fit-page"
          ref={pageRef}
          style={{ transform: `scale(${metrics.scale})` }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
