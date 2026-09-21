import type { Invoice, InvoiceStatus } from '@/types/domain'

export function effectiveInvoiceStatus(invoice: Invoice, today = new Date()): InvoiceStatus {
  if (invoice.status === 'paid' || invoice.status === 'cancelled' || invoice.status === 'draft') {
    return invoice.status
  }
  const due = new Date(`${invoice.due}T23:59:59`)
  if (invoice.paidAmount >= invoice.amount) return 'paid'
  if (due.getTime() < today.getTime()) return 'overdue'
  if (invoice.paidAmount > 0) return 'partial'
  return invoice.status === 'overdue' ? 'overdue' : 'sent'
}

export function invoiceOpenAmount(invoice: Invoice) {
  return Math.max(0, Math.round((invoice.amount - invoice.paidAmount) * 100) / 100)
}
