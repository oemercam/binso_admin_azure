import { isDeepStrictEqual } from 'node:util'
import type { Role } from '@/types/domain'

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
      if (key === 'invoices' && (!prior || prior.number !== row.number) && proposed.some(other => other.id !== row.id && other.number === row.number)) throw new Error('state_invalid')
    }
  }
}
