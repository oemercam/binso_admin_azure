'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
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
import type { Customer, Invoice, InvoiceLine, Order, Payment, Quote, Supplier, SupplierInvoice, TimeEntry } from '@/types/domain'

type BusinessState = {
  customers: Customer[]
  suppliers: Supplier[]
  quotes: Quote[]
  orders: Order[]
  timeEntries: TimeEntry[]
  invoices: Invoice[]
  payments: Payment[]
  supplierInvoices: SupplierInvoice[]
}

type CreateInvoiceInput = {
  customerId: string
  orderId?: string
  timeEntryIds: string[]
  extraLines?: InvoiceLine[]
  period: string
}

type BusinessStore = BusinessState & {
  addCustomer: (customer: Customer) => void
  addTimeEntry: (entry: TimeEntry) => void
  updateQuote: (id: string, changes: Partial<Quote>) => void
  createOrderFromQuote: (quoteId: string) => Order | null
  createInvoiceFromTimes: (input: CreateInvoiceInput) => Invoice | null
  recordPayment: (invoiceId: string, amount: number, method: Payment['method'], date: string) => void
  resetDemo: () => void
}

const STORAGE_KEY = 'binso-admin-demo-v5'

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
  }
}

const BusinessContext = createContext<BusinessStore | null>(null)

export function BusinessStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BusinessState>(freshState)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setState(JSON.parse(raw) as BusinessState)
    } catch {
      // Ungültige Demo-Daten werden ignoriert und durch Seed-Daten ersetzt.
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
    addTimeEntry(entry) {
      setState((current) => ({ ...current, timeEntries: [entry, ...current.timeEntries] }))
    },
    updateQuote(id, changes) {
      setState((current) => ({
        ...current,
        quotes: current.quotes.map((quote) => quote.id === id ? { ...quote, ...changes } : quote),
      }))
    },
    createOrderFromQuote(quoteId) {
      const quote = state.quotes.find((item) => item.id === quoteId)
      if (!quote || quote.status !== 'accepted') return null
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
      setState((current) => ({ ...current, orders: [order, ...current.orders] }))
      return order
    },
    createInvoiceFromTimes(input) {
      const customer = state.customers.find((item) => item.id === input.customerId)
      if (!customer) return null
      const selected = state.timeEntries.filter((entry) => input.timeEntryIds.includes(entry.id) && !entry.invoicedInvoiceId && entry.billable && entry.approved)
      const order = input.orderId ? state.orders.find((item) => item.id === input.orderId) : undefined
      if (!selected.length && !(input.extraLines?.length)) return null

      const timeLines: InvoiceLine[] = selected.map((entry, index) => ({
        id: `il-${Date.now()}-${index}`,
        description: `${formatDate(entry.date)} – ${entry.note || 'Dienstleistung'} – ${entry.personName}`,
        quantity: entry.hours,
        unit: 'h',
        unitPrice: entry.salesRate,
        vatRate: 8.1,
        sourceTimeEntryIds: [entry.id],
      }))
      const lines = [...timeLines, ...(input.extraLines ?? [])]
      const subtotal = round2(lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0))
      const vatAmount = round2(lines.reduce((sum, line) => sum + line.quantity * line.unitPrice * (line.vatRate / 100), 0))
      const amount = round2(subtotal + vatAmount)
      const nextNo = nextInvoiceNumber(state.invoices)
      const issueDate = new Date().toISOString().slice(0, 10)
      const dueDate = addDays(issueDate, customer.paymentDays)
      const invoice: Invoice = {
        id: `inv-${Date.now()}`,
        number: nextNo,
        customerId: customer.id,
        customerName: customer.name,
        orderId: order?.id,
        orderName: order?.name,
        period: input.period,
        issueDate,
        due: dueDate,
        status: 'draft',
        lines,
        subtotal,
        vatAmount,
        amount,
        paidAmount: 0,
      }

      setState((current) => ({
        ...current,
        invoices: [invoice, ...current.invoices],
        timeEntries: current.timeEntries.map((entry) => input.timeEntryIds.includes(entry.id) ? { ...entry, invoicedInvoiceId: invoice.id } : entry),
      }))
      return invoice
    },
    recordPayment(invoiceId, amount, method, date) {
      if (!Number.isFinite(amount) || amount <= 0) return
      const invoice = state.invoices.find((item) => item.id === invoiceId)
      if (!invoice) return
      const remaining = Math.max(0, invoice.amount - invoice.paidAmount)
      const booked = Math.min(remaining, amount)
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

function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00`)
  value.setDate(value.getDate() + days)
  return value.toISOString().slice(0, 10)
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('de-CH').format(new Date(`${date}T12:00:00`))
}
