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
  employees as seedEmployees,
  invoices as seedInvoices,
  orders as seedOrders,
  payments as seedPayments,
  quotes as seedQuotes,
  supplierInvoices as seedSupplierInvoices,
  suppliers as seedSuppliers,
  timeEntries as seedTimeEntries,
} from '@/lib/data/demo'
import {
  orderAssignmentRules as seedOrderAssignmentRules,
  orderPolicies as seedOrderPolicies,
  timeEvidence as seedTimeEvidence,
} from '@/lib/data/order-policies'
import { defaultCompanyProfile, defaultDocumentTemplates } from '@/lib/data/document-defaults'
import { defaultAppSettings } from '@/lib/data/app-settings'
import type {
  AppSettings,
  CompanyProfile,
  Customer,
  DocumentTemplates,
  Employee,
  Invoice,
  InvoiceLine,
  Order,
  Payment,
  Quote,
  QuoteLine,
  Supplier,
  SupplierInvoice,
  TimeEntry,
} from '@/types/domain'
import type { OrderPolicy } from '@/modules/orders/types'
import type { OrderAssignmentRule } from '@/modules/workforce/types'
import type { TimeEvidence } from '@/modules/time/types'
import { getTimeEntryBillingEligibility } from '@/modules/time/eligibility'
import { createDefaultOrderPolicy } from '@/modules/orders/defaults'

type BusinessState = {
  customers: Customer[]
  suppliers: Supplier[]
  quotes: Quote[]
  orders: Order[]
  timeEntries: TimeEntry[]
  invoices: Invoice[]
  payments: Payment[]
  supplierInvoices: SupplierInvoice[]
  employees: Employee[]
  timeEvidence: TimeEvidence[]
  orderPolicies: OrderPolicy[]
  orderAssignmentRules: OrderAssignmentRule[]
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

type CreateOrderInput = Omit<Order, 'id' | 'usedHours'>

type BusinessStore = BusinessState & {
  addCustomer: (customer: Customer) => void
  updateCustomer: (id: string, changes: Partial<Customer>) => Customer | null
  createOrder: (input: CreateOrderInput) => Order
  updateOrder: (id: string, changes: Partial<Order>) => Order | null
  addEmployee: (employee: Employee) => void
  updateEmployee: (id: string, changes: Partial<Employee>) => Employee | null
  addSupplierInvoice: (invoice: SupplierInvoice) => void
  updateSupplierInvoice: (id: string, changes: Partial<SupplierInvoice>) => SupplierInvoice | null
  addTimeEntry: (entry: TimeEntry) => void
  updateTimeEntry: (id: string, changes: Partial<TimeEntry>) => TimeEntry | null
  addEvidence: (evidence: TimeEvidence) => void
  updateEvidence: (id: string, changes: Partial<TimeEvidence>) => TimeEvidence | null
  updateOrderPolicy: (orderId: string, policy: OrderPolicy) => void
  updateOrderAssignmentRule: (rule: OrderAssignmentRule) => void
  updateQuote: (id: string, changes: Partial<Quote>) => void
  createQuote: (input: CreateQuoteInput) => Quote | null
  createQuoteRevision: (quoteId: string) => Quote | null
  sendQuote: (id: string, to: string) => Quote | null
  createOrderFromQuote: (quoteId: string) => Order | null
  createInvoiceFromTimes: (input: CreateInvoiceInput) => Invoice | null
  updateInvoiceDraft: (id: string, changes: Partial<Invoice>) => Invoice | null
  sendInvoice: (id: string, to: string, mode?: 'invoice' | 'reminder') => Invoice | null
  cancelInvoice: (id: string) => Invoice | null
  recordPayment: (invoiceId: string, amount: number, method: Payment['method'], date: string) => void
  updateCompanyProfile: (changes: Partial<CompanyProfile>) => void
  updateDocumentTemplates: (changes: Partial<DocumentTemplates>) => void
  updateAppSettings: (changes: Partial<AppSettings>) => void
  resetDemo: () => void
}

const STORAGE_KEY = 'binso-admin-demo-v10-e2e'

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
    employees: seedEmployees,
    timeEvidence: seedTimeEvidence,
    orderPolicies: seedOrderPolicies,
    orderAssignmentRules: seedOrderAssignmentRules,
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
          companyProfile: { ...defaultCompanyProfile, ...(parsed.companyProfile ?? {}) },
          documentTemplates: { ...defaultDocumentTemplates, ...(parsed.documentTemplates ?? {}) },
          appSettings: mergeAppSettings(parsed.appSettings),
        })
      }
    } catch {
      // Ungültige Demo-Daten werden ignoriert; Seeds bleiben verfügbar.
    } finally {
      setHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state, hydrated])

  const store = useMemo<BusinessStore>(() => ({
    ...state,
    addCustomer(customer) {
      setState((current) => ({ ...current, customers: [customer, ...current.customers] }))
    },
    updateCustomer(id, changes) {
      const existing = state.customers.find((item) => item.id === id)
      if (!existing) return null
      const updated = { ...existing, ...changes }
      setState((current) => ({ ...current, customers: current.customers.map((item) => item.id === id ? updated : item) }))
      return updated
    },
    createOrder(input) {
      const order: Order = { ...input, id: `ord-${Date.now()}`, usedHours: 0 }
      const policy = createDefaultOrderPolicy(order.id, order.billingModel)
      setState((current) => ({
        ...current,
        orders: [order, ...current.orders],
        orderPolicies: [policy, ...current.orderPolicies],
      }))
      return order
    },
    updateOrder(id, changes) {
      const existing = state.orders.find((item) => item.id === id)
      if (!existing) return null
      const updated = { ...existing, ...changes }
      setState((current) => ({ ...current, orders: current.orders.map((item) => item.id === id ? updated : item) }))
      return updated
    },
    addEmployee(employee) {
      setState((current) => ({ ...current, employees: [employee, ...current.employees] }))
    },
    updateEmployee(id, changes) {
      const existing = state.employees.find((item) => item.id === id)
      if (!existing) return null
      const updated = { ...existing, ...changes }
      setState((current) => ({ ...current, employees: current.employees.map((item) => item.id === id ? updated : item) }))
      return updated
    },
    addSupplierInvoice(invoice) {
      setState((current) => ({ ...current, supplierInvoices: [invoice, ...current.supplierInvoices] }))
    },
    updateSupplierInvoice(id, changes) {
      const existing = state.supplierInvoices.find((item) => item.id === id)
      if (!existing) return null
      const updated = { ...existing, ...changes }
      setState((current) => ({ ...current, supplierInvoices: current.supplierInvoices.map((item) => item.id === id ? updated : item) }))
      return updated
    },
    addTimeEntry(entry) {
      setState((current) => ({ ...current, timeEntries: [entry, ...current.timeEntries] }))
    },
    updateTimeEntry(id, changes) {
      const existing = state.timeEntries.find((item) => item.id === id)
      if (!existing) return null
      if (existing.invoicedInvoiceId && state.appSettings.workflow.lockInvoicedTimes) return null
      const updated = { ...existing, ...changes }
      setState((current) => ({ ...current, timeEntries: current.timeEntries.map((item) => item.id === id ? updated : item) }))
      return updated
    },
    addEvidence(evidence) {
      setState((current) => ({ ...current, timeEvidence: [evidence, ...current.timeEvidence] }))
    },
    updateEvidence(id, changes) {
      const existing = state.timeEvidence.find((item) => item.id === id)
      if (!existing) return null
      const updated = { ...existing, ...changes }
      setState((current) => ({ ...current, timeEvidence: current.timeEvidence.map((item) => item.id === id ? updated : item) }))
      return updated
    },
    updateOrderPolicy(orderId, policy) {
      setState((current) => ({
        ...current,
        orderPolicies: current.orderPolicies.some((item) => item.orderId === orderId)
          ? current.orderPolicies.map((item) => item.orderId === orderId ? policy : item)
          : [policy, ...current.orderPolicies],
      }))
    },
    updateOrderAssignmentRule(rule) {
      setState((current) => {
        const exists = current.orderAssignmentRules.some((item) => item.orderId === rule.orderId && item.personId === rule.personId)
        return {
          ...current,
          orderAssignmentRules: exists
            ? current.orderAssignmentRules.map((item) => item.orderId === rule.orderId && item.personId === rule.personId ? rule : item)
            : [rule, ...current.orderAssignmentRules],
        }
      })
    },
    updateQuote(id, changes) {
      setState((current) => ({ ...current, quotes: current.quotes.map((quote) => quote.id === id ? recalcQuote({ ...quote, ...changes }) : quote) }))
    },
    createQuote(input) {
      const customer = state.customers.find((item) => item.id === input.customerId)
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
      setState((current) => ({ ...current, quotes: [quote, ...current.quotes] }))
      return quote
    },
    createQuoteRevision(quoteId) {
      const source = state.quotes.find((item) => item.id === quoteId)
      if (!source) return null
      const revision: Quote = recalcQuote({
        ...source,
        id: `quo-${Date.now()}`,
        version: source.version + 1,
        status: 'draft',
        issueDate: today(),
        sentAt: undefined,
        sentTo: undefined,
        lines: source.lines.map((line, index) => ({ ...line, id: `ql-${Date.now()}-${index}` })),
      })
      setState((current) => ({ ...current, quotes: [revision, ...current.quotes] }))
      return revision
    },
    sendQuote(id, to) {
      const quote = state.quotes.find((item) => item.id === id)
      if (!quote || !to.trim()) return null
      const updated: Quote = { ...quote, status: 'sent', sentAt: new Date().toISOString(), sentTo: to.trim(), recipientEmail: to.trim() }
      setState((current) => ({ ...current, quotes: current.quotes.map((item) => item.id === id ? updated : item) }))
      return updated
    },
    createOrderFromQuote(quoteId) {
      const quote = state.quotes.find((item) => item.id === quoteId)
      if (!quote) return null
      if (state.appSettings.workflow.requireQuoteAcceptanceBeforeOrder && quote.status !== 'accepted') return null
      const existing = state.orders.find((order) => order.name === quote.title && order.customerId === quote.customerId)
      if (existing) return existing
      const hours = quote.lines.filter((line) => line.unit === 'h').reduce((sum, line) => sum + line.quantity, 0)
      const weightedRevenue = quote.lines.filter((line) => line.unit === 'h').reduce((sum, line) => sum + line.quantity * line.unitPrice, 0)
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
      const policy = createDefaultOrderPolicy(order.id, order.billingModel)
      setState((current) => ({
        ...current,
        orders: [order, ...current.orders],
        orderPolicies: [policy, ...current.orderPolicies],
      }))
      return order
    },
    createInvoiceFromTimes(input) {
      const customer = state.customers.find((item) => item.id === input.customerId)
      if (!customer) return null
      const selected = state.timeEntries.filter((entry) => input.timeEntryIds.includes(entry.id) && getTimeEntryBillingEligibility(entry, state.timeEvidence, state.orderPolicies, state.orderAssignmentRules).eligible)
      const order = input.orderId ? state.orders.find((item) => item.id === input.orderId) : undefined
      const extraLines = input.extraLines?.filter((line) => line.description.trim() && line.quantity > 0) ?? []
      if (!selected.length && !extraLines.length) return null
      const timeLines: InvoiceLine[] = selected.map((entry, index) => ({
        id: `il-${Date.now()}-${index}`,
        description: `${formatDate(entry.date)} – ${entry.note || 'Dienstleistung'} – ${entry.personName}`,
        quantity: entry.hours,
        unit: 'h',
        unitPrice: entry.salesRate,
        vatRate: 8.1,
        sourceTimeEntryIds: [entry.id],
      }))
      const lines = [...timeLines, ...extraLines]
      const totals = invoiceTotals(lines)
      const issueDate = today()
      const invoice: Invoice = {
        id: `inv-${Date.now()}`,
        number: nextInvoiceNumber(state.invoices),
        customerId: customer.id,
        customerName: customer.name,
        orderId: order?.id,
        orderName: order?.name,
        period: input.period,
        issueDate,
        due: addDays(issueDate, customer.paymentDays),
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
        timeEntries: current.timeEntries.map((entry) => selected.some((selectedEntry) => selectedEntry.id === entry.id) ? { ...entry, invoicedInvoiceId: invoice.id } : entry),
      }))
      return invoice
    },
    updateInvoiceDraft(id, changes) {
      const existing = state.invoices.find((item) => item.id === id)
      if (!existing || existing.status !== 'draft') return null
      const updated = recalcInvoice({ ...existing, ...changes })
      setState((current) => ({ ...current, invoices: current.invoices.map((item) => item.id === id ? updated : item) }))
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
        ...(mode === 'reminder' ? { lastReminderAt: now } : { sentAt: now, status: invoice.status === 'draft' ? 'sent' : invoice.status }),
      }
      setState((current) => ({ ...current, invoices: current.invoices.map((item) => item.id === id ? updated : item) }))
      return updated
    },
    cancelInvoice(id) {
      const invoice = state.invoices.find((item) => item.id === id)
      if (!invoice || invoice.status === 'paid' || invoice.status === 'cancelled') return null
      const sourceIds = new Set(invoice.lines.flatMap((line) => line.sourceTimeEntryIds))
      const updated: Invoice = { ...invoice, status: 'cancelled' }
      setState((current) => ({
        ...current,
        invoices: current.invoices.map((item) => item.id === id ? updated : item),
        timeEntries: current.timeEntries.map((entry) => sourceIds.has(entry.id) && entry.invoicedInvoiceId === id ? { ...entry, invoicedInvoiceId: undefined } : entry),
      }))
      return updated
    },
    recordPayment(invoiceId, amount, method, date) {
      if (!Number.isFinite(amount) || amount <= 0) return
      const invoice = state.invoices.find((item) => item.id === invoiceId)
      if (!invoice) return
      const remaining = Math.max(0, invoice.amount - invoice.paidAmount)
      const booked = Math.min(remaining, amount)
      if (!booked) return
      const payment: Payment = { id: `pay-${Date.now()}`, invoiceId, date, amount: booked, method }
      setState((current) => ({
        ...current,
        payments: [payment, ...current.payments],
        invoices: current.invoices.map((item) => {
          if (item.id !== invoiceId) return item
          const paidAmount = round2(Math.min(item.amount, item.paidAmount + booked))
          return { ...item, paidAmount, status: paidAmount >= item.amount ? 'paid' : 'partial' }
        }),
      }))
    },
    updateCompanyProfile(changes) {
      setState((current) => ({ ...current, companyProfile: { ...current.companyProfile, ...changes } }))
    },
    updateDocumentTemplates(changes) {
      setState((current) => ({ ...current, documentTemplates: { ...current.documentTemplates, ...changes } }))
    },
    updateAppSettings(changes) {
      setState((current) => ({ ...current, appSettings: mergeAppSettings(changes, current.appSettings) }))
    },
    resetDemo() {
      localStorage.removeItem(STORAGE_KEY)
      setState(freshState())
    },
  }), [state])

  return <BusinessContext.Provider value={store}>{children}</BusinessContext.Provider>
}

export function useBusinessStore() {
  const value = useContext(BusinessContext)
  if (!value) throw new Error('useBusinessStore must be used inside BusinessStoreProvider')
  return value
}

function recalcInvoice(invoice: Invoice): Invoice { return { ...invoice, ...invoiceTotals(invoice.lines) } }
function recalcQuote(quote: Quote): Quote { return { ...quote, amount: round2(quote.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0)) } }
function invoiceTotals(lines: InvoiceLine[]) {
  const subtotal = round2(lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0))
  const vatAmount = round2(lines.reduce((sum, line) => sum + line.quantity * line.unitPrice * (line.vatRate / 100), 0))
  return { subtotal, vatAmount, amount: round2(subtotal + vatAmount) }
}
function round2(value: number) { return Math.round((value + Number.EPSILON) * 100) / 100 }
function nextInvoiceNumber(invoices: Invoice[]) { const current = invoices.reduce((max, invoice) => { const match = invoice.number.match(/RE-2026-(\d+)/); return match ? Math.max(max, Number(match[1])) : max }, 0); return `RE-2026-${String(current + 1).padStart(3, '0')}` }
function nextQuoteNumber(quotes: Quote[]) { const current = quotes.reduce((max, quote) => { const match = quote.number.match(/AN-2026-(\d+)/); return match ? Math.max(max, Number(match[1])) : max }, 0); return `AN-2026-${String(current + 1).padStart(3, '0')}` }
function addDays(date: string, days: number) { const value = new Date(`${date}T12:00:00`); value.setDate(value.getDate() + days); return value.toISOString().slice(0, 10) }
function today() { return new Date().toISOString().slice(0, 10) }
function formatDate(date: string) { return new Intl.DateTimeFormat('de-CH').format(new Date(`${date}T12:00:00`)) }
function mergeAppSettings(changes?: Partial<AppSettings>, base: AppSettings = defaultAppSettings): AppSettings {
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
