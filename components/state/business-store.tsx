'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  customers as seedCustomers,
  invoices as seedInvoices,
  orders as seedOrders,
  payments as seedPayments,
  quotes as seedQuotes,
  supplierInvoices as seedSupplierInvoices,
  suppliers as seedSuppliers,
  timeEntries as seedTimeEntries,
} from '@/lib/data/demo'
import {
  defaultCompanyProfile,
  defaultDocumentTemplates,
} from '@/lib/data/document-defaults'
import { defaultAppSettings } from '@/lib/data/app-settings'
import type {
  CompanyProfile,
  Customer,
  DocumentTemplates,
  Invoice,
  InvoiceLine,
  Order,
  Payment,
  Quote,
  QuoteLine,
  Supplier,
  SupplierInvoice,
  TimeEntry,
  AppSettings,
} from '@/types/domain'

type BusinessState = {
  customers: Customer[]
  suppliers: Supplier[]
  quotes: Quote[]
  orders: Order[]
  timeEntries: TimeEntry[]
  invoices: Invoice[]
  payments: Payment[]
  supplierInvoices: SupplierInvoice[]
  companyProfile: CompanyProfile
  documentTemplates: DocumentTemplates
  appSettings: AppSettings
}

type CreateInvoiceInput = {
  customerId: string
  orderId?: string
  timeEntryIds: string[]
  extraLines?: InvoiceLine[]
  period: string
}

type CreateQuoteInput = {
  customerId: string
  title: string
  validUntil: string
  lines: QuoteLine[]
  reference?: string
}

type BusinessStore = BusinessState & {
  addCustomer: (customer: Customer) => void
  addTimeEntry: (entry: TimeEntry) => void
  updateQuote: (id: string, changes: Partial<Quote>) => void
  createQuote: (input: CreateQuoteInput) => Quote | null
  sendQuote: (id: string, to: string) => Quote | null
  createOrderFromQuote: (quoteId: string) => Order | null
  createInvoiceFromTimes: (input: CreateInvoiceInput) => Invoice | null
  updateInvoiceDraft: (id: string, changes: Partial<Invoice>) => Invoice | null
  sendInvoice: (id: string, to: string, mode?: 'invoice' | 'reminder') => Invoice | null
  recordPayment: (
    invoiceId: string,
    amount: number,
    method: Payment['method'],
    date: string,
  ) => void
  updateCompanyProfile: (changes: Partial<CompanyProfile>) => void
  updateDocumentTemplates: (changes: Partial<DocumentTemplates>) => void
  updateAppSettings: (changes: Partial<AppSettings>) => void
  resetDemo: () => void
}

const STORAGE_KEY = 'binso-admin-demo-v6-documents'

function freshState(): BusinessState {
  return {
    customers: seedCustomers,
    suppliers: seedSuppliers,
    quotes: seedQuotes,
    orders: seedOrders,
    timeEntries: seedTimeEntries,
    invoices: seedInvoices,
    payments: seedPayments,
    supplierInvoices: seedSupplierInvoices,
    companyProfile: defaultCompanyProfile,
    documentTemplates: defaultDocumentTemplates,
    appSettings: defaultAppSettings,
  }
}

const BusinessContext = createContext<BusinessStore | null>(null)

export function BusinessStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BusinessState>(freshState)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<BusinessState>
        setState({
          ...freshState(),
          ...parsed,
          companyProfile: {
            ...defaultCompanyProfile,
            ...(parsed.companyProfile ?? {}),
          },
          documentTemplates: {
            ...defaultDocumentTemplates,
            ...(parsed.documentTemplates ?? {}),
          },
          appSettings: mergeAppSettings(parsed.appSettings),
        })
      }
    } catch {
      // Ungültige Demo-Daten werden ignoriert.
    } finally {
      setHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state, hydrated])

  const store = useMemo<BusinessStore>(
    () => ({
      ...state,
      addCustomer(customer) {
        setState((current) => ({
          ...current,
          customers: [customer, ...current.customers],
        }))
      },
      addTimeEntry(entry) {
        setState((current) => ({
          ...current,
          timeEntries: [entry, ...current.timeEntries],
        }))
      },
      updateQuote(id, changes) {
        setState((current) => ({
          ...current,
          quotes: current.quotes.map((quote) =>
            quote.id === id ? recalcQuote({ ...quote, ...changes }) : quote,
          ),
        }))
      },
      createQuote(input) {
        const customer = state.customers.find(
          (item) => item.id === input.customerId,
        )
        if (!customer || !input.lines.length) return null

        const quote: Quote = recalcQuote({
          id: `quo-${Date.now()}`,
          number: nextQuoteNumber(state.quotes),
          customerId: customer.id,
          customerName: customer.name,
          title: input.title,
          issueDate: today(),
          validUntil: input.validUntil,
          status: 'draft',
          version: 1,
          lines: input.lines,
          amount: 0,
          recipientName: customer.legalName || customer.name,
          recipientAddress: customer.address,
          recipientZip: customer.zip,
          recipientCity: customer.city,
          recipientCountry: customer.country,
          recipientEmail: customer.email,
          introText: state.documentTemplates.quoteIntro,
          outroText: state.documentTemplates.quoteOutro,
          reference: input.reference,
        })

        setState((current) => ({
          ...current,
          quotes: [quote, ...current.quotes],
        }))
        return quote
      },
      sendQuote(id, to) {
        const quote = state.quotes.find((item) => item.id === id)
        if (!quote || !to.trim()) return null
        const updated: Quote = {
          ...quote,
          status: 'sent',
          sentAt: new Date().toISOString(),
          sentTo: to.trim(),
          recipientEmail: to.trim(),
        }
        setState((current) => ({
          ...current,
          quotes: current.quotes.map((item) =>
            item.id === id ? updated : item,
          ),
        }))
        return updated
      },
      createOrderFromQuote(quoteId) {
        const quote = state.quotes.find((item) => item.id === quoteId)
        if (!quote || quote.status !== 'accepted') return null
        const existing = state.orders.find(
          (order) =>
            order.name === quote.title &&
            order.customerId === quote.customerId,
        )
        if (existing) return existing

        const hours = quote.lines
          .filter((line) => line.unit === 'h')
          .reduce((sum, line) => sum + line.quantity, 0)
        const weightedRevenue = quote.lines
          .filter((line) => line.unit === 'h')
          .reduce((sum, line) => sum + line.quantity * line.unitPrice, 0)

        const order: Order = {
          id: `ord-${Date.now()}`,
          customerId: quote.customerId,
          customerName: quote.customerName,
          name: quote.title,
          mandateRef: quote.number,
          budgetHours: hours || 40,
          usedHours: 0,
          salesRate: hours ? Math.round(weightedRevenue / hours) : 165,
          costRate: 105,
          billingModel: 'mixed',
          status: 'active',
        }
        setState((current) => ({
          ...current,
          orders: [order, ...current.orders],
        }))
        return order
      },
      createInvoiceFromTimes(input) {
        const customer = state.customers.find(
          (item) => item.id === input.customerId,
        )
        if (!customer) return null

        const selected = state.timeEntries.filter(
          (entry) =>
            input.timeEntryIds.includes(entry.id) &&
            !entry.invoicedInvoiceId &&
            entry.billable &&
            entry.approved,
        )
        const order = input.orderId
          ? state.orders.find((item) => item.id === input.orderId)
          : undefined
        if (!selected.length && !(input.extraLines?.length)) return null

        const timeLines: InvoiceLine[] = selected.map((entry, index) => ({
          id: `il-${Date.now()}-${index}`,
          description: `${formatDate(entry.date)} – ${
            entry.note || 'Dienstleistung'
          } – ${entry.personName}`,
          quantity: entry.hours,
          unit: 'h',
          unitPrice: entry.salesRate,
          vatRate: 8.1,
          sourceTimeEntryIds: [entry.id],
        }))
        const lines = [...timeLines, ...(input.extraLines ?? [])]
        const totals = invoiceTotals(lines)
        const issueDate = today()
        const dueDate = addDays(issueDate, customer.paymentDays)

        const invoice: Invoice = {
          id: `inv-${Date.now()}`,
          number: nextInvoiceNumber(state.invoices),
          customerId: customer.id,
          customerName: customer.name,
          orderId: order?.id,
          orderName: order?.name,
          period: input.period,
          issueDate,
          due: dueDate,
          status: 'draft',
          lines,
          ...totals,
          paidAmount: 0,
          recipientName: customer.legalName || customer.name,
          recipientAddress: customer.address,
          recipientZip: customer.zip,
          recipientCity: customer.city,
          recipientCountry: customer.country,
          recipientEmail: customer.email,
          introText: state.documentTemplates.invoiceIntro,
          outroText: state.documentTemplates.invoiceOutro,
          reference: order?.mandateRef,
        }

        setState((current) => ({
          ...current,
          invoices: [invoice, ...current.invoices],
          timeEntries: current.timeEntries.map((entry) =>
            input.timeEntryIds.includes(entry.id)
              ? { ...entry, invoicedInvoiceId: invoice.id }
              : entry,
          ),
        }))
        return invoice
      },
      updateInvoiceDraft(id, changes) {
        const existing = state.invoices.find((item) => item.id === id)
        if (!existing || existing.status !== 'draft') return null
        const updated = recalcInvoice({ ...existing, ...changes })
        setState((current) => ({
          ...current,
          invoices: current.invoices.map((item) =>
            item.id === id ? updated : item,
          ),
        }))
        return updated
      },
      sendInvoice(id, to, mode = 'invoice') {
        const invoice = state.invoices.find((item) => item.id === id)
        if (!invoice || !to.trim()) return null
        const now = new Date().toISOString()
        const updated: Invoice = {
          ...invoice,
          recipientEmail: to.trim(),
          sentTo: to.trim(),
          ...(mode === 'reminder'
            ? { lastReminderAt: now }
            : {
                sentAt: now,
                status:
                  invoice.status === 'draft' ? 'sent' : invoice.status,
              }),
        }
        setState((current) => ({
          ...current,
          invoices: current.invoices.map((item) =>
            item.id === id ? updated : item,
          ),
        }))
        return updated
      },
      recordPayment(invoiceId, amount, method, date) {
        if (!Number.isFinite(amount) || amount <= 0) return
        const invoice = state.invoices.find((item) => item.id === invoiceId)
        if (!invoice) return
        const remaining = Math.max(0, invoice.amount - invoice.paidAmount)
        const booked = Math.min(remaining, amount)
        const payment: Payment = {
          id: `pay-${Date.now()}`,
          invoiceId,
          date,
          amount: booked,
          method,
        }
        setState((current) => ({
          ...current,
          payments: [payment, ...current.payments],
          invoices: current.invoices.map((item) => {
            if (item.id !== invoiceId) return item
            const paidAmount = round2(
              Math.min(item.amount, item.paidAmount + booked),
            )
            return {
              ...item,
              paidAmount,
              status: paidAmount >= item.amount ? 'paid' : 'partial',
            }
          }),
        }))
      },
      updateCompanyProfile(changes) {
        setState((current) => ({
          ...current,
          companyProfile: { ...current.companyProfile, ...changes },
        }))
      },
      updateDocumentTemplates(changes) {
        setState((current) => ({
          ...current,
          documentTemplates: { ...current.documentTemplates, ...changes },
        }))
      },
      updateAppSettings(changes) {
        setState((current) => ({
          ...current,
          appSettings: mergeAppSettings(changes, current.appSettings),
        }))
      },
      resetDemo() {
        localStorage.removeItem(STORAGE_KEY)
        setState(freshState())
      },
    }),
    [state],
  )

  return (
    <BusinessContext.Provider value={store}>
      {children}
    </BusinessContext.Provider>
  )
}

export function useBusinessStore() {
  const value = useContext(BusinessContext)
  if (!value) {
    throw new Error('useBusinessStore must be used inside BusinessStoreProvider')
  }
  return value
}

function recalcInvoice(invoice: Invoice): Invoice {
  return { ...invoice, ...invoiceTotals(invoice.lines) }
}

function recalcQuote(quote: Quote): Quote {
  return {
    ...quote,
    amount: round2(
      quote.lines.reduce(
        (sum, line) => sum + line.quantity * line.unitPrice,
        0,
      ),
    ),
  }
}

function invoiceTotals(lines: InvoiceLine[]) {
  const subtotal = round2(
    lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0),
  )
  const vatAmount = round2(
    lines.reduce(
      (sum, line) =>
        sum + line.quantity * line.unitPrice * (line.vatRate / 100),
      0,
    ),
  )
  return {
    subtotal,
    vatAmount,
    amount: round2(subtotal + vatAmount),
  }
}

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function nextInvoiceNumber(invoices: Invoice[]) {
  const current = invoices.reduce((max, invoice) => {
    const match = invoice.number.match(/RE-2026-(\d+)/)
    return match ? Math.max(max, Number(match[1])) : max
  }, 0)
  return `RE-2026-${String(current + 1).padStart(3, '0')}`
}

function nextQuoteNumber(quotes: Quote[]) {
  const current = quotes.reduce((max, quote) => {
    const match = quote.number.match(/AN-2026-(\d+)/)
    return match ? Math.max(max, Number(match[1])) : max
  }, 0)
  return `AN-2026-${String(current + 1).padStart(3, '0')}`
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00`)
  value.setDate(value.getDate() + days)
  return value.toISOString().slice(0, 10)
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('de-CH').format(
    new Date(`${date}T12:00:00`),
  )
}


function mergeAppSettings(
  changes?: Partial<AppSettings>,
  base: AppSettings = defaultAppSettings,
): AppSettings {
  return {
    ...base,
    ...(changes ?? {}),
    mail: { ...base.mail, ...(changes?.mail ?? {}) },
    reminders: { ...base.reminders, ...(changes?.reminders ?? {}) },
    payroll: { ...base.payroll, ...(changes?.payroll ?? {}) },
    workflow: { ...base.workflow, ...(changes?.workflow ?? {}) },
    notifications: { ...base.notifications, ...(changes?.notifications ?? {}) },
  }
}
