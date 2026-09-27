import type { Quote, QuoteLine } from '@/types/domain'
import { addMinor, fromMinorUnits, multiplyMinor, toMinorUnits } from '@/modules/shared/money'

export function calculateQuoteAmount(lines: QuoteLine[]) {
  const totalMinor = addMinor(...lines.map((line) => multiplyMinor(toMinorUnits(line.unitPrice), line.quantity)))
  return fromMinorUnits(totalMinor)
}

export function recalculateQuote(quote: Quote): Quote {
  return { ...quote, amount: calculateQuoteAmount(quote.lines) }
}
