import type { Invoice, InvoiceLine } from '@/types/domain'

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function calculateInvoiceTotals(lines: InvoiceLine[]) {
  const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0))
  const vatAmount = roundMoney(lines.reduce((sum, line) => sum + line.quantity * line.unitPrice * (line.vatRate / 100), 0))
  return { subtotal, vatAmount, amount: roundMoney(subtotal + vatAmount) }
}

export function recalculateInvoice(invoice: Invoice): Invoice {
  return { ...invoice, ...calculateInvoiceTotals(invoice.lines) }
}
