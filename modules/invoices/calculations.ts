import type { Invoice, InvoiceLine } from '@/types/domain'
import { addMinor, fromMinorUnits, lineTotalMinor, toMinorUnits } from '@/modules/shared/money'

export function roundMoney(value: number) {
  return fromMinorUnits(toMinorUnits(value))
}

export function calculateInvoiceTotals(lines: InvoiceLine[]) {
  const totals = lines.map((line) => lineTotalMinor({ quantity: line.quantity, unitPrice: line.unitPrice, vatRate: line.vatRate }))
  const subtotalMinor = addMinor(...totals.map((line) => line.netMinor))
  const vatMinor = addMinor(...totals.map((line) => line.vatMinor))
  return {
    subtotal: fromMinorUnits(subtotalMinor),
    vatAmount: fromMinorUnits(vatMinor),
    amount: fromMinorUnits(addMinor(subtotalMinor, vatMinor)),
  }
}

export function calculateOutstandingAmount(invoice: Pick<Invoice, 'amount'|'paidAmount'|'creditedAmount'>) {
  const dueMinor = addMinor(toMinorUnits(invoice.amount), -toMinorUnits(invoice.paidAmount), -toMinorUnits(invoice.creditedAmount ?? 0))
  return fromMinorUnits(Math.max(0, dueMinor))
}

export function recalculateInvoice(invoice: Invoice): Invoice {
  return { ...invoice, ...calculateInvoiceTotals(invoice.lines) }
}
