'use client'

import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

const PAGE_WIDTH = 794
const PAGE_HEIGHT = 1123
const MIN_SCALE = 0.2
const MAX_SCALE = 1.5
const ZOOM_STEP = 0.1

type Point = { x: number; y: number }

type PinchSession = {
  startDistance: number
  startScale: number
  contentX: number
  contentY: number
}

type PendingAnchor = {
  contentX: number
  contentY: number
  viewportX: number
  viewportY: number
}

function distance(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

function midpoint(a: Point, b: Point) {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  }
}

function clampScale(value: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value))
}

export function DocumentPreviewFrame({ children }: { children: ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const pointersRef = useRef(new Map<number, Point>())
  const lastPanPointRef = useRef<Point | null>(null)
  const pinchRef = useRef<PinchSession | null>(null)
  const pendingAnchorRef = useRef<PendingAnchor | null>(null)

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
    () => clampScale(manualScale ?? metrics.fitScale),
    [manualScale, metrics.fitScale],
  )

  useLayoutEffect(() => {
    const stage = stageRef.current
    const anchor = pendingAnchorRef.current
    if (!stage || !anchor) return

    stage.scrollLeft = Math.max(0, anchor.contentX * scale - anchor.viewportX)
    stage.scrollTop = Math.max(0, anchor.contentY * scale - anchor.viewportY)
    pendingAnchorRef.current = null
  }, [scale])

  const zoomTo = useCallback((nextScale: number, viewportPoint?: Point) => {
    const stage = stageRef.current
    if (!stage) return

    const next = clampScale(nextScale)
    const viewportX = viewportPoint?.x ?? stage.clientWidth / 2
    const viewportY = viewportPoint?.y ?? stage.clientHeight / 2

    pendingAnchorRef.current = {
      contentX: (stage.scrollLeft + viewportX) / scale,
      contentY: (stage.scrollTop + viewportY) / scale,
      viewportX,
      viewportY,
    }
    setManualScale(next)
  }, [scale])

  const zoomBy = useCallback((delta: number) => {
    zoomTo(Number((scale + delta).toFixed(2)))
  }, [scale, zoomTo])

  const resetPointerGesture = useCallback(() => {
    pointersRef.current.clear()
    lastPanPointRef.current = null
    pinchRef.current = null
    pendingAnchorRef.current = null
  }, [])

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'touch') return

    const stage = stageRef.current
    if (!stage) return

    stage.setPointerCapture?.(event.pointerId)
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    const points = [...pointersRef.current.values()]
    if (points.length === 1) {
      lastPanPointRef.current = points[0]
      pinchRef.current = null
      return
    }

    if (points.length === 2) {
      const rect = stage.getBoundingClientRect()
      const center = midpoint(points[0], points[1])
      const viewportX = center.x - rect.left
      const viewportY = center.y - rect.top

      pinchRef.current = {
        startDistance: Math.max(1, distance(points[0], points[1])),
        startScale: scale,
        contentX: (stage.scrollLeft + viewportX) / scale,
        contentY: (stage.scrollTop + viewportY) / scale,
      }
      lastPanPointRef.current = null
    }
  }, [scale])

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'touch' || !pointersRef.current.has(event.pointerId)) return

    const stage = stageRef.current
    if (!stage) return

    event.preventDefault()
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const points = [...pointersRef.current.values()]

    if (points.length >= 2) {
      const first = points[0]
      const second = points[1]
      const rect = stage.getBoundingClientRect()
      const center = midpoint(first, second)
      const viewportX = center.x - rect.left
      const viewportY = center.y - rect.top

      if (!pinchRef.current) {
        pinchRef.current = {
          startDistance: Math.max(1, distance(first, second)),
          startScale: scale,
          contentX: (stage.scrollLeft + viewportX) / scale,
          contentY: (stage.scrollTop + viewportY) / scale,
        }
      }

      const pinch = pinchRef.current
      const nextScale = clampScale(
        pinch.startScale * (distance(first, second) / pinch.startDistance),
      )

      pendingAnchorRef.current = {
        contentX: pinch.contentX,
        contentY: pinch.contentY,
        viewportX,
        viewportY,
      }
      setManualScale(nextScale)
      return
    }

    if (points.length === 1) {
      const current = points[0]
      const previous = lastPanPointRef.current

      if (previous) {
        stage.scrollLeft -= current.x - previous.x
        stage.scrollTop -= current.y - previous.y
      }

      lastPanPointRef.current = current
    }
  }, [scale])

  const onPointerEnd = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'touch') return

    pointersRef.current.delete(event.pointerId)
    if (stageRef.current?.hasPointerCapture?.(event.pointerId)) {
      stageRef.current.releasePointerCapture(event.pointerId)
    }

    const points = [...pointersRef.current.values()]
    pinchRef.current = null
    pendingAnchorRef.current = null
    lastPanPointRef.current = points.length === 1 ? points[0] : null
  }, [])

  useEffect(() => resetPointerGesture, [resetPointerGesture])

  return (
    <div className="document-preview-frame">
      <div className="preview-zoom-toolbar" aria-label="Vorschau zoomen">
        <button type="button" className="preview-zoom-button" onClick={() => zoomBy(-ZOOM_STEP)} aria-label="Verkleinern">−</button>
        <span className="preview-zoom-value" aria-live="polite">{Math.round(scale * 100)}%</span>
        <button type="button" className="preview-zoom-button" onClick={() => zoomBy(ZOOM_STEP)} aria-label="Vergrössern">+</button>
        <button
          type="button"
          className="preview-fit-button" aria-label="Dokument in Vorschau einpassen" title="Dokument einpassen"
          onClick={() => {
            pendingAnchorRef.current = null
            setManualScale(null)
          }}
        >
          Einpassen
        </button>
      </div>

      <div
        className="document-fit-stage"
        ref={stageRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
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
