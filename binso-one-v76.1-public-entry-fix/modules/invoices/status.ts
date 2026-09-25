import type { Invoice, InvoiceStatus } from '@/types/domain'

function netInvoiceAmount(invoice: Invoice) {
  return Math.max(0, invoice.amount - (invoice.creditedAmount ?? 0))
}

export function effectiveInvoiceStatus(invoice: Invoice, today = new Date()): InvoiceStatus {
  if (invoice.status === 'cancelled' || invoice.status === 'draft') return invoice.status
  const netAmount = netInvoiceAmount(invoice)
  if (invoice.paidAmount >= netAmount) return 'paid'
  const due = new Date(`${invoice.due}T23:59:59`)
  if (due.getTime() < today.getTime()) return 'overdue'
  if (invoice.paidAmount > 0) return 'partial'
  return invoice.status === 'overdue' ? 'overdue' : 'sent'
}

export function invoiceOpenAmount(invoice: Invoice) {
  return Math.max(0, Math.round((netInvoiceAmount(invoice) - invoice.paidAmount) * 100) / 100)
}
