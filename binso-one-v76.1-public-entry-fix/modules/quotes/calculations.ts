import type { Quote, QuoteLine } from '@/types/domain'
import { roundMoney } from '@/modules/invoices/calculations'

export function calculateQuoteAmount(lines: QuoteLine[]) {
  return roundMoney(lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0))
}

export function recalculateQuote(quote: Quote): Quote {
  return { ...quote, amount: calculateQuoteAmount(quote.lines) }
}
