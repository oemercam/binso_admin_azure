'use client'

import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const PAGE_WIDTH = 794
const PAGE_HEIGHT = 1123
const MIN_SCALE = 0.2
const MAX_SCALE = 1.5
const ZOOM_STEP = 0.1

export function DocumentPreviewFrame({ children }: { children: ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const [metrics, setMetrics] = useState({ fitScale: 1, width: PAGE_WIDTH, height: PAGE_HEIGHT })
  const [manualScale, setManualScale] = useState<number | null>(null)

  useEffect(() => {
    let frame = 0

    const measure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const stage = stageRef.current
        const page = pageRef.current
        if (!stage || !page) return

        const pageWidth = page.scrollWidth || page.offsetWidth || PAGE_WIDTH
        const pageHeight = page.scrollHeight || page.offsetHeight || PAGE_HEIGHT
        const styles = getComputedStyle(stage)
        const horizontalPadding =
          Number.parseFloat(styles.paddingLeft || '0') +
          Number.parseFloat(styles.paddingRight || '0')
        const availableWidth = Math.max(220, stage.clientWidth - horizontalPadding)
        const fitScale = Math.min(1, availableWidth / pageWidth)

        setMetrics((current) => {
          if (
            Math.abs(current.fitScale - fitScale) < 0.001 &&
            current.width === pageWidth &&
            current.height === pageHeight
          ) return current
          return { fitScale, width: pageWidth, height: pageHeight }
        })
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

  const scale = useMemo(
    () => Math.min(MAX_SCALE, Math.max(MIN_SCALE, manualScale ?? metrics.fitScale)),
    [manualScale, metrics.fitScale],
  )

  const zoomBy = useCallback((delta: number) => {
    setManualScale((current) => {
      const base = current ?? metrics.fitScale
      return Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number((base + delta).toFixed(2))))
    })
  }, [metrics.fitScale])

  return (
    <div className="document-preview-frame">
      <div className="preview-zoom-toolbar" aria-label="Vorschau zoomen">
        <button type="button" className="preview-zoom-button" onClick={() => zoomBy(-ZOOM_STEP)} aria-label="Verkleinern">−</button>
        <span className="preview-zoom-value" aria-live="polite">{Math.round(scale * 100)}%</span>
        <button type="button" className="preview-zoom-button" onClick={() => zoomBy(ZOOM_STEP)} aria-label="Vergrössern">+</button>
        <button type="button" className="preview-fit-button" onClick={() => setManualScale(null)}>Anpassen</button>
      </div>

      <div className="document-fit-stage" ref={stageRef}>
        <div
          className="document-fit-sizer"
          style={{
            width: `${metrics.width * scale}px`,
            height: `${metrics.height * scale}px`,
          }}
        >
          <div
            className="document-fit-page"
            ref={pageRef}
            style={{ transform: `scale(${scale})` }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
