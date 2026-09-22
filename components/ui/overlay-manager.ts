'use client'

import { useEffect, type RefObject } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

let scrollLockDepth = 0
let originalBodyOverflow = ''
let originalBodyOverscroll = ''
let originalHtmlOverflow = ''

function lockDocumentScroll() {
  if (scrollLockDepth === 0) {
    originalBodyOverflow = document.body.style.overflow
    originalBodyOverscroll = document.body.style.overscrollBehavior
    originalHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.body.style.overscrollBehavior = 'none'
    document.documentElement.style.overflow = 'hidden'
  }
  scrollLockDepth += 1
}

function unlockDocumentScroll() {
  scrollLockDepth = Math.max(0, scrollLockDepth - 1)
  if (scrollLockDepth !== 0) return
  document.body.style.overflow = originalBodyOverflow
  document.body.style.overscrollBehavior = originalBodyOverscroll
  document.documentElement.style.overflow = originalHtmlOverflow
}

export function useModalOverlay({
  open,
  onClose,
  containerRef,
  trapFocus = true,
}: {
  open: boolean
  onClose: () => void
  containerRef: RefObject<HTMLElement | null>
  trapFocus?: boolean
}) {
  useEffect(() => {
    if (!open) return

    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    lockDocumentScroll()

    const focusFrame = window.requestAnimationFrame(() => {
      const panel = containerRef.current
      if (!panel) return
      const first = panel.querySelector<HTMLElement>(FOCUSABLE)
      ;(first ?? panel).focus({ preventScroll: true })
    })

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (!trapFocus || event.key !== 'Tab') return
      const panel = containerRef.current
      if (!panel) return
      const focusable = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)]
        .filter((node) => !node.hasAttribute('hidden') && node.getAttribute('aria-hidden') !== 'true')

      if (!focusable.length) {
        event.preventDefault()
        panel.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.cancelAnimationFrame(focusFrame)
      window.removeEventListener('keydown', onKeyDown)
      unlockDocumentScroll()
      returnFocus?.focus({ preventScroll: true })
    }
  }, [containerRef, onClose, open, trapFocus])
}
