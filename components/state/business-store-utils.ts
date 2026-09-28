import { nextInvoiceNumber as invoiceNumber, nextQuoteNumber as quoteNumber, nextContractNumber as contractNumber, nextCreditNumber as creditNumber } from '@/modules/documents/numbering'
import { advanceContractDate } from '@/modules/contracts/schedule'
import { formatDate as formatLocaleDate, formatMonthYear } from '@/lib/format/locale'
import { defaultAppSettings } from '@/lib/data/app-settings'
import type { AppSettings, Contract, Customer, CustomerActivity, Invoice, InvoiceLine, Quote } from '@/types/domain'

export function customerProcessFor(customer: Customer | undefined, settings: AppSettings) {
  return {
    ...settings.workflow.customerProcess,
    ...(customer?.workflowOverride ?? {}),
  }
}

export function recalcInvoice(invoice: Invoice): Invoice { return { ...invoice, ...invoiceTotals(invoice.lines) } }
export function recalcQuote(quote: Quote): Quote { return { ...quote, amount: round2(quote.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0)) } }
export function invoiceTotals(lines: InvoiceLine[]) {
  const subtotal = round2(lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0))
  const vatAmount = round2(lines.reduce((sum, line) => sum + line.quantity * line.unitPrice * (line.vatRate / 100), 0))
  return { subtotal, vatAmount, amount: round2(subtotal + vatAmount) }
}
export function round2(value: number) { return Math.round((value + Number.EPSILON) * 100) / 100 }
export function nextInvoiceNumber(records: { number: string }[]) { return invoiceNumber(records.map(item => item.number)) }
export function nextContractNumber(records: { number: string }[]) { return contractNumber(records.map(item => item.number)) }
export function nextCreditNumber(records: { number: string }[]) { return creditNumber(records.map(item => item.number)) }
export function nextQuoteNumber(records: { number: string }[]) { return quoteNumber(records.map(item => item.number)) }
export function addDays(date: string, days: number) { const value = new Date(`${date}T12:00:00`); value.setDate(value.getDate() + days); return value.toISOString().slice(0, 10) }
export function today() { return new Date().toISOString().slice(0, 10) }
export function monthLabel(date: string) { return formatMonthYear(date) }
export function advanceBillingDate(date: string, interval: Contract['billingInterval']) { return interval === 'none' ? date : advanceContractDate(date, interval) }
export function makeActivity(organizationId: string, customerId: string, type: CustomerActivity['type'], title: string, detail?: string): CustomerActivity { return { organizationId, id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, customerId, type, title, detail, createdAt: new Date().toISOString() } }
export function formatDate(date: string) { return formatLocaleDate(date) }
export function mergeAppSettings(changes?: Partial<AppSettings>, base: AppSettings = defaultAppSettings): AppSettings {
  return {
    ...base,
    ...(changes ?? {}),
    mail: { ...base.mail, ...(changes?.mail ?? {}) },
    reminders: { ...base.reminders, ...(changes?.reminders ?? {}) },
    payroll: { ...base.payroll, ...(changes?.payroll ?? {}) },
    workflow: {
      ...base.workflow,
      ...(changes?.workflow ?? {}),
      customerProcess: { ...base.workflow.customerProcess, ...(changes?.workflow?.customerProcess ?? {}) },
      employeeSettlement: { ...base.workflow.employeeSettlement, ...(changes?.workflow?.employeeSettlement ?? {}) },
      supplierSettlement: { ...base.workflow.supplierSettlement, ...(changes?.workflow?.supplierSettlement ?? {}) },
    },
    notifications: { ...base.notifications, ...(changes?.notifications ?? {}) },
  }
}
