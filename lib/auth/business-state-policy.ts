import { isDeepStrictEqual } from 'node:util'
import type { Role } from '@/types/domain'
import { addMinor, lineTotalMinor, multiplyMinor, toMinorUnits } from '@/modules/shared/money'

type State = Record<string, unknown>
type Row = Record<string, unknown>
export type StateActor = { role: Role; email: string; userId: string; features?: string[] }
const features: Record<string, string> = { customers: 'crm', customerContacts: 'crm', quotes: 'quotes', orders: 'orders', orderPolicies: 'orders', orderAssignmentRules: 'orders', contracts: 'contracts', timeEntries: 'time', timeEvidence: 'time', invoices: 'invoices', payments: 'invoices', creditNotes: 'invoices', expenses: 'finance', suppliers: 'finance', supplierInvoices: 'finance', employees: 'employees', importJobs: 'imports', exportJobs: 'exports', auditEvents: 'audit' }
const rows = (state: State, key: string): Row[] => Array.isArray(state[key]) ? state[key] as Row[] : []
const financeWrites = new Set(['invoices', 'payments', 'creditNotes', 'supplierInvoices', 'expenses', 'customerActivities', 'exportJobs'])
const employeeReads = new Set(['customers', 'orders', 'employees', 'timeEntries', 'timeEvidence', 'orderPolicies', 'orderAssignmentRules', 'companyProfile', 'appSettings'])
const privateFields = new Set(['internalCostRate', 'costRate', 'salesRate', 'unitPrice', 'salary', 'notes', 'settlementOverride', 'budgetHours'])

function employeeId(state: State, actor: StateActor) {
  return rows(state, 'employees').find(row => String(row.email).toLowerCase() === actor.email.toLowerCase() && row.status === 'active')?.id
}

export function projectBusinessState(state: State, actor: StateActor): State {
  if (actor.role !== 'employee') return state
  const personId = employeeId(state, actor)
  const assignments = rows(state, 'orderAssignmentRules').filter(row => personId && row.personId === personId && row.active)
  const orders = new Set(assignments.map(row => row.orderId))
  const customers = new Set(rows(state, 'orders').filter(row => orders.has(row.id)).map(row => row.customerId))
  const projected: State = {}
  for (const [key, value] of Object.entries(state)) {
    if (!employeeReads.has(key)) continue
    if (!Array.isArray(value)) { projected[key] = value; continue }
    projected[key] = rows(state, key).filter(row => {
      if (key === 'employees') return personId && row.id === personId
      if (['timeEntries', 'timeEvidence', 'orderAssignmentRules'].includes(key)) return personId && row.personId === personId
      if (key === 'orders') return orders.has(row.id)
      if (key === 'orderPolicies') return orders.has(row.orderId)
      if (key === 'customers') return customers.has(row.id)
      return false
    }).map(row => Object.fromEntries(Object.entries(row).filter(([field, val]) => !privateFields.has(field) || typeof val === 'number').map(([field, val]) => [field, privateFields.has(field) ? 0 : val])))
  }
  return projected
}

/** Merge into the locked canonical state; a projected client must never erase hidden data. */
export function mergeAuthorizedState(current: State, incoming: State, actor: StateActor): State {
  const next = { ...current }
  const visible = projectBusinessState(current, actor)
  for (const [key, value] of Object.entries(incoming)) {
    if (key === 'auditEvents') continue // audit is authored by the server
    if (features[key] && actor.features && !actor.features.includes(features[key])) {
      if (current[key] !== undefined ? !isDeepStrictEqual(value, current[key]) : Array.isArray(value) && value.length > 0) throw new Error('state_forbidden')
      continue
    }
    if (actor.role === 'employee') {
      if (key === 'timeEvidence') {
        if (!Array.isArray(value)) throw new Error('state_invalid')
        const personId = employeeId(current, actor)
        const existing = rows(current, key)
        const submitted = value as Row[]
        const owned = existing.filter(row => personId && row.personId === personId)
        if (owned.some(row => !submitted.some(item => item.id === row.id))) throw new Error('state_forbidden')
        for (const row of submitted) {
          const prior = existing.find(item => item.id === row.id)
          if (prior && isDeepStrictEqual(row, prior)) continue
          if (!personId || row.personId !== personId || (prior && prior.personId !== personId) || row.status !== 'uploaded' || row.signed || row.customerApproved || row.verifiedAt || prior?.status === 'verified') throw new Error('state_forbidden')
          if (!rows(current, 'orderAssignmentRules').some(item => item.personId === personId && item.orderId === row.orderId && item.active)) throw new Error('state_forbidden')
        }
        next[key] = [...existing.filter(row => row.personId !== personId), ...submitted]
        continue
      }
      if (key !== 'timeEntries') {
        if (visible[key] !== undefined && !isDeepStrictEqual(value, visible[key])) throw new Error('state_forbidden')
        if (visible[key] === undefined && Array.isArray(value) && value.length) throw new Error('state_forbidden')
        continue
      }
      const personId = employeeId(current, actor)
      if (!Array.isArray(value)) throw new Error('state_invalid')
      const old = rows(current, key)
      const submitted = value as Row[]
      const own = old.filter(row => personId && row.personId === personId)
      // Deletion and approval are management operations.
      if (own.some(row => !submitted.some(item => item.id === row.id))) throw new Error('state_forbidden')
      const merged = submitted.map(row => {
        if (!personId || row.personId !== personId) throw new Error('state_forbidden')
        const existing = old.find(item => item.id === row.id)
        if (existing && existing.personId !== personId) throw new Error('state_forbidden')
        const priorView = rows(visible, key).find(item => item.id === row.id)
        if (priorView && isDeepStrictEqual(row, priorView)) return existing!
        if (existing?.approved || existing?.invoicedInvoiceId || row.approved || row.invoicedInvoiceId) throw new Error('state_forbidden')
        const order = rows(current, 'orders').find(item => item.id === row.orderId && item.status === 'active')
        const assigned = rows(current, 'orderAssignmentRules').some(item => item.orderId === row.orderId && item.personId === personId && item.active)
        if (!order || !assigned || typeof row.hours !== 'number' || row.hours <= 0 || row.hours > 24 || !/^\d{4}-\d{2}-\d{2}$/.test(String(row.date))) throw new Error('state_invalid')
        return { ...row, personId, personName: rows(current, 'employees').find(item => item.id === personId)?.name, customerId: order.customerId, customerName: order.customerName, orderName: order.name, approved: false,
          salesRate: existing?.salesRate ?? order.salesRate, internalCostRate: existing?.internalCostRate ?? rows(current, 'employees').find(item => item.id === personId)?.internalCostRate ?? 0 }
      })
      next[key] = [...old.filter(row => row.personId !== personId), ...merged]
      continue
    }
    if (actor.role === 'finance' && !financeWrites.has(key)) {
      if (current[key] !== undefined && !isDeepStrictEqual(value, current[key])) throw new Error('state_forbidden')
      if (current[key] === undefined && Array.isArray(value) && value.length) throw new Error('state_forbidden')
      continue
    }
    next[key] = value
  }
  return next
}

export function validateFinancialChanges(current: State, next: State) {
  for (const key of ['invoices', 'quotes']) {
    const previous = rows(current, key)
    const proposed = rows(next, key)
    for (const prior of previous) {
      if (prior.status === 'draft') continue
      const updated = proposed.find(row => row.id === prior.id)
      if (!updated) throw new Error('state_forbidden')
      for (const field of ['number', 'customerId', 'issueDate', 'lines', 'subtotal', 'vatAmount', 'amount', 'recipientName', 'recipientAddress', 'recipientZip', 'recipientCity', 'recipientCountry']) {
        if (!isDeepStrictEqual(prior[field], updated[field])) throw new Error('state_forbidden')
      }
    }
    for (const row of proposed) {
      const prior = previous.find(item => item.id === row.id)
      if (prior && isDeepStrictEqual(prior, row)) continue
      if (!Array.isArray(row.lines) || !row.lines.length || typeof row.amount !== 'number' || !Number.isFinite(row.amount) || row.amount < 0) throw new Error('state_invalid')
      if (!(row.lines as Row[]).every(line => typeof line.quantity === 'number' && Number.isFinite(line.quantity) && line.quantity > 0 && typeof line.unitPrice === 'number' && Number.isFinite(line.unitPrice) && line.unitPrice >= 0 && (line.vatRate === undefined || typeof line.vatRate === 'number' && Number.isFinite(line.vatRate) && line.vatRate >= 0 && line.vatRate <= 100))) throw new Error('state_invalid')
      const financialLines = row.lines as Row[]
      if (key === 'quotes') {
        const expectedMinor = addMinor(...financialLines.map(line => multiplyMinor(toMinorUnits(Number(line.unitPrice)), Number(line.quantity))))
        if (toMinorUnits(Number(row.amount)) !== expectedMinor) throw new Error('financial_total_invalid')
      } else {
        const totals = financialLines.map(line => lineTotalMinor({ quantity: Number(line.quantity), unitPrice: Number(line.unitPrice), vatRate: Number(line.vatRate ?? 0) }))
        const subtotalMinor = addMinor(...totals.map(item => item.netMinor))
        const vatMinor = addMinor(...totals.map(item => item.vatMinor))
        const amountMinor = addMinor(subtotalMinor, vatMinor)
        if (typeof row.subtotal !== 'number' || typeof row.vatAmount !== 'number') throw new Error('financial_total_invalid')
        if (toMinorUnits(row.subtotal) !== subtotalMinor || toMinorUnits(row.vatAmount) !== vatMinor || toMinorUnits(Number(row.amount)) !== amountMinor) throw new Error('financial_total_invalid')
        if (typeof row.paidAmount === 'number' && (toMinorUnits(row.paidAmount) < 0 || toMinorUnits(row.paidAmount) > amountMinor)) throw new Error('financial_total_invalid')
      }
      if (key === 'invoices' && (!prior || prior.number !== row.number) && proposed.some(other => other.id !== row.id && other.number === row.number)) throw new Error('state_invalid')
    }
  }
}
function objectValue(value: unknown): Row {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {}
}

/** Server-side referential/business invariants for the compatibility state API. */
export function validateBusinessRelations(next: State) {
  const byId = (key: string) => new Map(rows(next, key).map(row => [String(row.id), row]))
  const customers = byId('customers')
  const quotes = byId('quotes')
  const orders = byId('orders')
  const contracts = byId('contracts')
  const times = byId('timeEntries')
  const expenses = byId('expenses')
  const invoices = byId('invoices')
  const suppliers = byId('suppliers')

  const appSettings = objectValue(next.appSettings)
  const workflow = objectValue(appSettings.workflow)
  const requireAcceptedQuote = workflow.requireQuoteAcceptanceBeforeOrder === true

  for (const contact of rows(next, 'customerContacts')) if (!customers.has(String(contact.customerId))) throw new Error('state_invalid')
  for (const quote of rows(next, 'quotes')) if (!customers.has(String(quote.customerId))) throw new Error('state_invalid')
  for (const contract of rows(next, 'contracts')) if (!customers.has(String(contract.customerId))) throw new Error('state_invalid')

  for (const order of rows(next, 'orders')) {
    const customer = customers.get(String(order.customerId))
    if (!customer) throw new Error('state_invalid')
    if (order.contractId) {
      const contract = contracts.get(String(order.contractId))
      if (!contract || contract.customerId !== order.customerId) throw new Error('state_invalid')
    }
    if (order.sourceQuoteId) {
      const quote = quotes.get(String(order.sourceQuoteId))
      if (!quote || quote.customerId !== order.customerId || (requireAcceptedQuote && quote.status !== 'accepted')) throw new Error('state_invalid')
    }
  }

  for (const entry of rows(next, 'timeEntries')) {
    const order = orders.get(String(entry.orderId))
    if (!order || order.customerId !== entry.customerId || typeof entry.hours !== 'number' || !Number.isFinite(entry.hours) || entry.hours <= 0 || entry.hours > 24) throw new Error('state_invalid')
    if (entry.invoicedInvoiceId) {
      const invoice = invoices.get(String(entry.invoicedInvoiceId))
      if (!invoice || invoice.customerId !== entry.customerId || (invoice.orderId && invoice.orderId !== entry.orderId)) throw new Error('state_invalid')
    }
  }

  for (const expense of rows(next, 'expenses')) {
    if (!customers.has(String(expense.customerId))) throw new Error('state_invalid')
    if (expense.orderId) {
      const order = orders.get(String(expense.orderId))
      if (!order || order.customerId !== expense.customerId) throw new Error('state_invalid')
    }
    if (expense.contractId) {
      const contract = contracts.get(String(expense.contractId))
      if (!contract || contract.customerId !== expense.customerId) throw new Error('state_invalid')
    }
    if (expense.invoicedInvoiceId) {
      const invoice = invoices.get(String(expense.invoicedInvoiceId))
      if (!invoice || invoice.customerId !== expense.customerId) throw new Error('state_invalid')
    }
  }

  const usedTimes = new Map<string, string>()
  const usedExpenses = new Map<string, string>()
  for (const invoice of rows(next, 'invoices')) {
    if (!customers.has(String(invoice.customerId))) throw new Error('state_invalid')
    if (invoice.orderId) {
      const order = orders.get(String(invoice.orderId))
      if (!order || order.customerId !== invoice.customerId) throw new Error('state_invalid')
    }
    if (invoice.contractId) {
      const contract = contracts.get(String(invoice.contractId))
      if (!contract || contract.customerId !== invoice.customerId) throw new Error('state_invalid')
    }
    if (invoice.sourceQuoteId) {
      const quote = quotes.get(String(invoice.sourceQuoteId))
      if (!quote || quote.customerId !== invoice.customerId || quote.status !== 'accepted') throw new Error('state_invalid')
    }
    if (invoice.status === 'cancelled') continue
    for (const line of Array.isArray(invoice.lines) ? invoice.lines as Row[] : []) {
      for (const sourceId of Array.isArray(line.sourceTimeEntryIds) ? line.sourceTimeEntryIds : []) {
        const id = String(sourceId)
        const entry = times.get(id)
        if (!entry || entry.customerId !== invoice.customerId || (invoice.orderId && entry.orderId !== invoice.orderId) || entry.billable !== true || entry.approved !== true) throw new Error('state_invalid')
        const priorInvoice = usedTimes.get(id)
        if (priorInvoice && priorInvoice !== invoice.id) throw new Error('state_invalid')
        usedTimes.set(id, String(invoice.id))
      }
      for (const sourceId of Array.isArray(line.sourceExpenseIds) ? line.sourceExpenseIds : []) {
        const id = String(sourceId)
        const expense = expenses.get(id)
        if (!expense || expense.customerId !== invoice.customerId || (invoice.orderId && expense.orderId && expense.orderId !== invoice.orderId) || expense.billable !== true) throw new Error('state_invalid')
        const priorInvoice = usedExpenses.get(id)
        if (priorInvoice && priorInvoice !== invoice.id) throw new Error('state_invalid')
        usedExpenses.set(id, String(invoice.id))
      }
    }
  }

  const paymentTotals = new Map<string, number[]>()
  for (const payment of rows(next, 'payments')) {
    const invoice = invoices.get(String(payment.invoiceId))
    if (!invoice || typeof payment.amount !== 'number' || !Number.isFinite(payment.amount) || payment.amount <= 0) throw new Error('state_invalid')
    const list = paymentTotals.get(String(payment.invoiceId)) ?? []
    list.push(toMinorUnits(payment.amount))
    paymentTotals.set(String(payment.invoiceId), list)
  }
  for (const [invoiceId, amounts] of paymentTotals) {
    const invoice = invoices.get(invoiceId)!
    const maximum = addMinor(toMinorUnits(Number(invoice.amount)), -toMinorUnits(Number(invoice.creditedAmount ?? 0)))
    const booked = addMinor(...amounts)
    if (booked > maximum || toMinorUnits(Number(invoice.paidAmount ?? 0)) !== booked) throw new Error('financial_total_invalid')
  }

  const creditTotals = new Map<string, number[]>()
  for (const credit of rows(next, 'creditNotes')) {
    const invoice = invoices.get(String(credit.invoiceId))
    if (!invoice || invoice.customerId !== credit.customerId || typeof credit.amount !== 'number' || !Number.isFinite(credit.amount) || credit.amount <= 0) throw new Error('state_invalid')
    const list = creditTotals.get(String(credit.invoiceId)) ?? []
    list.push(toMinorUnits(credit.amount))
    creditTotals.set(String(credit.invoiceId), list)
  }
  for (const [invoiceId, amounts] of creditTotals) {
    const invoice = invoices.get(invoiceId)!
    const credited = addMinor(...amounts)
    const total = toMinorUnits(Number(invoice.amount))
    const paid = toMinorUnits(Number(invoice.paidAmount ?? 0))
    if (credited > total || addMinor(credited, paid) > total || toMinorUnits(Number(invoice.creditedAmount ?? 0)) !== credited) throw new Error('financial_total_invalid')
  }
  for (const supplierInvoice of rows(next, 'supplierInvoices')) {
    if (!suppliers.has(String(supplierInvoice.supplierId))) throw new Error('state_invalid')
    if (supplierInvoice.orderId && !orders.has(String(supplierInvoice.orderId))) throw new Error('state_invalid')
  }
}

