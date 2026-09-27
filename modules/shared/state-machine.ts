export function assertTransition<T extends string>(current: T, next: T, allowed: Readonly<Record<T, readonly T[]>>, code = 'invalid_transition') {
  if (current === next) return
  if (!allowed[current]?.includes(next)) throw new Error(code)
}

export const quoteTransitions = {
  draft: ['sent'], sent: ['accepted','declined','expired','revised'], accepted: ['revised'], declined: ['revised'], expired: ['revised'], revised: ['sent'],
} as const

export const orderTransitions = {
  active: ['paused','completed'], paused: ['active','completed'], completed: [],
} as const

export const invoiceTransitions = {
  draft: ['sent','cancelled'], sent: ['partial','paid','overdue','cancelled'], partial: ['paid','overdue','cancelled'], paid: [], overdue: ['partial','paid','cancelled'], cancelled: [],
} as const
