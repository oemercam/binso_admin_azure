type ScrollSubscriber = (scrollY: number) => void

const subscribers = new Set<ScrollSubscriber>()
let listening = false
let frame = 0

function emit() {
  frame = 0
  const scrollY = Math.max(0, window.scrollY)
  subscribers.forEach((subscriber) => subscriber(scrollY))
}

function onScroll() {
  if (!frame) frame = window.requestAnimationFrame(emit)
}

function start() {
  if (listening || typeof window === 'undefined') return
  listening = true
  window.addEventListener('scroll', onScroll, { passive: true })
}

function stop() {
  if (!listening || subscribers.size) return
  listening = false
  if (frame) {
    window.cancelAnimationFrame(frame)
    frame = 0
  }
  window.removeEventListener('scroll', onScroll)
}

export function subscribeWindowScroll(subscriber: ScrollSubscriber) {
  subscribers.add(subscriber)
  start()
  return () => {
    subscribers.delete(subscriber)
    stop()
  }
}
