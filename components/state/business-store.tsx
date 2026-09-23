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
  contracts as seedContracts,
  creditNotes as seedCreditNotes,
  customerActivities as seedCustomerActivities,
  customerContacts as seedCustomerContacts,
  customers as seedCustomers,
  expenses as seedExpenses,
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
import { DEFAULT_ORGANIZATION_ID, defaultOrganization } from '@/lib/data/organizations'
import { seedAuditEvents, seedEntitlements, seedExportJobs, seedImportJobs, seedMemberships, seedNumberSequences, seedSubscriptions } from '@/lib/data/saas'
import { hasPermission } from '@/lib/auth/permissions'
import { formatDate as formatLocaleDate, formatMonthYear } from '@/lib/format/locale'
import type {
  AppSettings,
  AppUser,
  CompanyProfile,
  Contract,
  CreditNote,
  CustomerActivity,
  Customer,
  CustomerContact,
  DocumentTemplates,
  Employee,
  Expense,
  Invoice,
  InvoiceLine,
  Order,
  Organization,
  OrganizationMembership,
  OrganizationSubscription,
  OrganizationEntitlements,
  AuditEvent,
  NumberSequence,
  ImportJob,
  DataExportJob,
  Permission,
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
import { effectiveInvoiceStatus } from '@/modules/invoices/status'
import { createDefaultOrderPolicy } from '@/modules/orders/defaults'
import { readStorage, removeStorage, writeStorage } from '@/lib/browser/storage'

type BusinessState = {
  organizations: Organization[]
  currentOrganizationId: string
  memberships: OrganizationMembership[]
  subscriptions: OrganizationSubscription[]
  entitlements: OrganizationEntitlements[]
  auditEvents: AuditEvent[]
  numberSequences: NumberSequence[]
  importJobs: ImportJob[]
  exportJobs: DataExportJob[]
  customers: Customer[]
  contracts: Contract[]
  expenses: Expense[]
  creditNotes: CreditNote[]
  customerActivities: CustomerActivity[]
  customerContacts: CustomerContact[]
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
  expenseIds?: string[]
  extraLines?: InvoiceLine[]
  period: string
  kind?: Invoice['kind']
}

type CreateQuoteInput = {
  customerId: string
  title: string
  validUntil: string
  lines: QuoteLine[]
  reference?: string
}

type CreateOrderInput = Omit<Order, 'id' | 'usedHours'>

type CreateContractInput = Omit<Contract, 'id' | 'number' | 'customerName'> & { customerId: string }

type BusinessStore = BusinessState & {
  currentOrganization: Organization
  setCurrentOrganization: (organizationId: string) => void
  activeMembership: OrganizationMembership | null
  can: (permission: Permission) => boolean
  addMembership: (membership: OrganizationMembership) => void
  updateMembership: (id: string, changes: Partial<OrganizationMembership>) => OrganizationMembership | null
  appendAuditEvent: (event: Omit<AuditEvent, 'id' | 'organizationId' | 'createdAt'>) => void
  createExportJob: (job: Omit<DataExportJob, 'id' | 'organizationId' | 'createdAt' | 'status'>) => DataExportJob
  createImportJob: (job: Omit<ImportJob, 'id' | 'organizationId' | 'createdAt' | 'status' | 'errorCount'>) => ImportJob
  addCustomer: (customer: Customer) => void
  updateCustomer: (id: string, changes: Partial<Customer>) => Customer | null
  createContract: (input: CreateContractInput) => Contract | null
  updateContract: (id: string, changes: Partial<Contract>) => Contract | null
  addExpense: (expense: Expense) => void
  createOrderFromContract: (contractId: string) => Order | null
  createInvoiceFromContract: (contractId: string, period?: string) => Invoice | null
  createCreditNote: (invoiceId: string, amount: number, reason: string) => CreditNote | null
  addActivityNote: (customerId: string, note: string) => void
  addCustomerContact: (contact: CustomerContact) => void
  updateCustomerContact: (id: string, changes: Partial<CustomerContact>) => CustomerContact | null
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
  createInvoiceFromQuote: (quoteId: string) => Invoice | null
  createInvoiceFromTimes: (input: CreateInvoiceInput) => Invoice | null
  updateInvoiceDraft: (id: string, changes: Partial<Invoice>) => Invoice | null
  sendInvoice: (id: string, to: string, mode?: 'invoice' | 'reminder') => Invoice | null
  cancelInvoice: (id: string) => Invoice | null
  recordPayment: (invoiceId: string, amount: number, method: Payment['method'], date: string, reference?: string) => void
  updateCompanyProfile: (changes: Partial<CompanyProfile>) => void
  updateDocumentTemplates: (changes: Partial<DocumentTemplates>) => void
  updateAppSettings: (changes: Partial<AppSettings>) => void
  resetDemo: () => void
}

const STORAGE_KEY = 'business-platform-demo-v13-organizations'
const LEGACY_STORAGE_KEYS = ['binso-admin-demo-v12-responsive', 'binso-admin-demo-v10-e2e', 'binso-admin-demo-v9', 'binso-admin-demo-v8']

function scopeRecords<T extends { organizationId?: string }>(items: T[], organizationId = DEFAULT_ORGANIZATION_ID): T[] {
  return items.map((item) => ({ ...item, organizationId: item.organizationId ?? organizationId }))
}

function freshState(): BusinessState {
  return {
    organizations: [defaultOrganization],
    currentOrganizationId: DEFAULT_ORGANIZATION_ID,
    memberships: seedMemberships,
    subscriptions: seedSubscriptions,
    entitlements: seedEntitlements,
    auditEvents: seedAuditEvents,
    numberSequences: seedNumberSequences,
    importJobs: seedImportJobs,
    exportJobs: seedExportJobs,
    customers: scopeRecords(seedCustomers),
    contracts: scopeRecords(seedContracts),
    expenses: scopeRecords(seedExpenses),
    creditNotes: scopeRecords(seedCreditNotes),
    customerActivities: scopeRecords(seedCustomerActivities),
    customerContacts: scopeRecords(seedCustomerContacts),
    suppliers: scopeRecords(seedSuppliers),
    quotes: scopeRecords(seedQuotes),
    orders: scopeRecords(seedOrders),
    timeEntries: scopeRecords(seedTimeEntries),
    invoices: scopeRecords(seedInvoices),
    payments: scopeRecords(seedPayments),
    supplierInvoices: scopeRecords(seedSupplierInvoices),
    employees: scopeRecords(seedEmployees),
    timeEvidence: scopeRecords(seedTimeEvidence),
    orderPolicies: scopeRecords(seedOrderPolicies),
    orderAssignmentRules: scopeRecords(seedOrderAssignmentRules),
    companyProfile: { ...defaultCompanyProfile, organizationId: DEFAULT_ORGANIZATION_ID },
    documentTemplates: defaultDocumentTemplates,
    appSettings: defaultAppSettings,
  }
}

const BusinessContext = createContext<BusinessStore | null>(null)

export function BusinessStoreProvider({ children, user }: { children: ReactNode; user?: AppUser }) {
  const [state, setState] = useState<BusinessState>(freshState)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      try {
        let raw = readStorage(STORAGE_KEY)

        if (!raw) {
          for (const key of LEGACY_STORAGE_KEYS) {
            const legacy = readStorage(key)
            if (legacy) {
              raw = legacy
              break
            }
          }
        }

        if (raw) {
          const parsed = JSON.parse(raw) as Partial<BusinessState>
          const seeded = freshState()

          // Demo releases must always contain usable reference data. Older browser
          // snapshots could contain empty arrays from previous UI-only versions and
          // would otherwise make whole modules appear blank after an upgrade.
          const organizations = parsed.organizations?.length ? parsed.organizations : seeded.organizations
          const requestedOrganizationId = parsed.currentOrganizationId ?? DEFAULT_ORGANIZATION_ID
          const currentOrganizationId = organizations.some((organization) => organization.id === requestedOrganizationId)
            ? requestedOrganizationId
            : organizations[0]?.id ?? DEFAULT_ORGANIZATION_ID

          setState({
            ...seeded,
            ...parsed,
            organizations,
            currentOrganizationId,
            memberships: parsed.memberships ?? seeded.memberships,
            subscriptions: parsed.subscriptions ?? seeded.subscriptions,
            entitlements: parsed.entitlements ?? seeded.entitlements,
            auditEvents: parsed.auditEvents ?? seeded.auditEvents,
            numberSequences: parsed.numberSequences ?? seeded.numberSequences,
            importJobs: parsed.importJobs ?? seeded.importJobs,
            exportJobs: parsed.exportJobs ?? seeded.exportJobs,
            customers: scopeRecords(parsed.customers?.length ? parsed.customers : seeded.customers, currentOrganizationId),
            contracts: scopeRecords(parsed.contracts ?? seeded.contracts, currentOrganizationId),
            expenses: scopeRecords(parsed.expenses ?? seeded.expenses, currentOrganizationId),
            creditNotes: scopeRecords(parsed.creditNotes ?? seeded.creditNotes, currentOrganizationId),
            customerActivities: scopeRecords(parsed.customerActivities ?? seeded.customerActivities, currentOrganizationId),
            customerContacts: scopeRecords(parsed.customerContacts ?? seeded.customerContacts, currentOrganizationId),
            suppliers: scopeRecords(parsed.suppliers?.length ? parsed.suppliers : seeded.suppliers, currentOrganizationId),
            quotes: scopeRecords(parsed.quotes?.length ? parsed.quotes : seeded.quotes, currentOrganizationId),
            orders: scopeRecords(parsed.orders?.length ? parsed.orders : seeded.orders, currentOrganizationId),
            timeEntries: scopeRecords(parsed.timeEntries?.length ? parsed.timeEntries.map((entry) => { const legacy = entry as typeof entry & { note?: string }; return { ...entry, description: entry.description ?? legacy.note ?? '' } }) : seeded.timeEntries, currentOrganizationId),
            invoices: scopeRecords(parsed.invoices?.length ? parsed.invoices : seeded.invoices, currentOrganizationId),
            payments: scopeRecords(parsed.payments?.length ? parsed.payments : seeded.payments, currentOrganizationId),
            supplierInvoices: scopeRecords(parsed.supplierInvoices?.length ? parsed.supplierInvoices : seeded.supplierInvoices, currentOrganizationId),
            employees: scopeRecords(parsed.employees?.length ? parsed.employees : seeded.employees, currentOrganizationId),
            timeEvidence: scopeRecords(parsed.timeEvidence?.length ? parsed.timeEvidence : seeded.timeEvidence, currentOrganizationId),
            orderPolicies: scopeRecords(parsed.orderPolicies?.length ? parsed.orderPolicies : seeded.orderPolicies, currentOrganizationId),
            orderAssignmentRules: scopeRecords(parsed.orderAssignmentRules?.length ? parsed.orderAssignmentRules : seeded.orderAssignmentRules, currentOrganizationId),
            companyProfile: { ...defaultCompanyProfile, ...(parsed.companyProfile ?? {}), organizationId: currentOrganizationId },
            documentTemplates: { ...defaultDocumentTemplates, ...(parsed.documentTemplates ?? {}) },
            appSettings: mergeAppSettings(parsed.appSettings),
          })
        }
      } catch {
        // Ungültige Demo-Daten werden ignoriert; Seeds bleiben verfügbar.
      } finally {
        if (!cancelled) setHydrated(true)
      }
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    writeStorage(STORAGE_KEY, JSON.stringify(state))
  }, [state, hydrated])

  const store = useMemo<BusinessStore>(() => ({
    ...state,
    customers: state.customers.filter((item) => item.organizationId === state.currentOrganizationId),
    contracts: state.contracts.filter((item) => item.organizationId === state.currentOrganizationId),
    expenses: state.expenses.filter((item) => item.organizationId === state.currentOrganizationId),
    creditNotes: state.creditNotes.filter((item) => item.organizationId === state.currentOrganizationId),
    customerActivities: state.customerActivities.filter((item) => item.organizationId === state.currentOrganizationId),
    customerContacts: state.customerContacts.filter((item) => item.organizationId === state.currentOrganizationId),
    suppliers: state.suppliers.filter((item) => item.organizationId === state.currentOrganizationId),
    quotes: state.quotes.filter((item) => item.organizationId === state.currentOrganizationId),
    orders: state.orders.filter((item) => item.organizationId === state.currentOrganizationId),
    timeEntries: state.timeEntries.filter((item) => item.organizationId === state.currentOrganizationId),
    invoices: state.invoices.filter((item) => item.organizationId === state.currentOrganizationId),
    payments: state.payments.filter((item) => item.organizationId === state.currentOrganizationId),
    supplierInvoices: state.supplierInvoices.filter((item) => item.organizationId === state.currentOrganizationId),
    employees: state.employees.filter((item) => item.organizationId === state.currentOrganizationId),
    timeEvidence: state.timeEvidence.filter((item) => item.organizationId === state.currentOrganizationId),
    orderPolicies: state.orderPolicies.filter((item) => item.organizationId === state.currentOrganizationId),
    orderAssignmentRules: state.orderAssignmentRules.filter((item) => item.organizationId === state.currentOrganizationId),
    memberships: state.memberships.filter((item) => item.organizationId === state.currentOrganizationId),
    subscriptions: state.subscriptions.filter((item) => item.organizationId === state.currentOrganizationId),
    entitlements: state.entitlements.filter((item) => item.organizationId === state.currentOrganizationId),
    auditEvents: state.auditEvents.filter((item) => item.organizationId === state.currentOrganizationId),
    numberSequences: state.numberSequences.filter((item) => item.organizationId === state.currentOrganizationId),
    importJobs: state.importJobs.filter((item) => item.organizationId === state.currentOrganizationId),
    exportJobs: state.exportJobs.filter((item) => item.organizationId === state.currentOrganizationId),
    currentOrganization: state.organizations.find((organization) => organization.id === state.currentOrganizationId) ?? defaultOrganization,
    setCurrentOrganization(organizationId) {
      if (!state.organizations.some((organization) => organization.id === organizationId)) return
      if (user && !state.memberships.some((membership) => membership.organizationId === organizationId && membership.userId === user.id && membership.status === 'active')) return
      setState((current) => ({ ...current, currentOrganizationId: organizationId }))
    },
    activeMembership: user
      ? state.memberships.find((membership) =>
          membership.organizationId === state.currentOrganizationId &&
          (membership.userId === user.id || membership.email.toLowerCase() === user.email.toLowerCase()) &&
          membership.status === 'active'
        ) ?? null
      : null,
    can(permission) {
      const role = user
        ? state.memberships.find((membership) => membership.organizationId === state.currentOrganizationId && (membership.userId === user.id || membership.email.toLowerCase() === user.email.toLowerCase()) && membership.status === 'active')?.role ?? user.role
        : 'employee'
      return hasPermission(role, permission)
    },
    addMembership(membership) {
      if (membership.organizationId !== state.currentOrganizationId) return
      setState((current) => ({ ...current, memberships: [membership, ...current.memberships] }))
    },
    updateMembership(id, changes) {
      const existing = state.memberships.find((item) => item.id === id && item.organizationId === state.currentOrganizationId)
      if (!existing) return null
      const updated = { ...existing, ...changes, organizationId: existing.organizationId, updatedAt: new Date().toISOString() }
      setState((current) => ({ ...current, memberships: current.memberships.map((item) => item.id === id ? updated : item) }))
      return updated
    },
    appendAuditEvent(event) {
      const created: AuditEvent = { ...event, id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, organizationId: state.currentOrganizationId, createdAt: new Date().toISOString() }
      setState((current) => ({ ...current, auditEvents: [created, ...current.auditEvents] }))
    },
    createExportJob(job) {
      const created: DataExportJob = { ...job, id: `export-${Date.now()}`, organizationId: state.currentOrganizationId, status: 'queued', createdAt: new Date().toISOString() }
      setState((current) => ({ ...current, exportJobs: [created, ...current.exportJobs] }))
      return created
    },
    createImportJob(job) {
      const created: ImportJob = { ...job, id: `import-${Date.now()}`, organizationId: state.currentOrganizationId, status: 'draft', errorCount: 0, createdAt: new Date().toISOString() }
      setState((current) => ({ ...current, importJobs: [created, ...current.importJobs] }))
      return created
    },
    addCustomer(customer) {
      setState((current) => ({ ...current, customers: [{ ...customer, organizationId: state.currentOrganizationId }, ...current.customers] }))
    },
    updateCustomer(id, changes) {
      const existing = state.customers.find((item) => item.id === id)
      if (!existing) return null
      const updated = { ...existing, ...changes }
      setState((current) => ({ ...current, customers: current.customers.map((item) => item.id === id ? updated : item) }))
      return updated
    },
    createContract(input) {
      const customer = state.customers.find((item) => item.id === input.customerId)
      if (!customer || !input.name.trim() || !input.lines.length) return null
      const contract: Contract = {
        ...input,
        organizationId: state.currentOrganizationId,
        id: `con-${Date.now()}`,
        number: nextContractNumber(state.contracts),
        customerName: customer.name,
      }
      setState((current) => ({
        ...current,
        contracts: [contract, ...current.contracts],
        customerActivities: [makeActivity(state.currentOrganizationId, customer.id, 'contract', `Vertrag ${contract.number} erstellt`, contract.name), ...current.customerActivities],
      }))
      return contract
    },
    updateContract(id, changes) {
      const existing = state.contracts.find((item) => item.id === id)
      if (!existing) return null
      const updated = { ...existing, ...changes }
      setState((current) => ({ ...current, contracts: current.contracts.map((item) => item.id === id ? updated : item) }))
      return updated
    },
    addExpense(expense) {
      setState((current) => ({ ...current, expenses: [{ ...expense, organizationId: state.currentOrganizationId }, ...current.expenses] }))
    },
    createOrderFromContract(contractId) {
      const contract = state.contracts.find((item) => item.id === contractId)
      if (!contract) return null
      const existing = state.orders.find((item) => item.contractId === contract.id)
      if (existing) return existing
      const hours = contract.lines.filter((line) => line.unit === 'h').reduce((sum, line) => sum + line.quantity, 0)
      const hourlyRevenue = contract.lines.filter((line) => line.unit === 'h').reduce((sum, line) => sum + line.quantity * line.unitPrice, 0)
      const order: Order = { organizationId: state.currentOrganizationId, id: `ord-${Date.now()}`, customerId: contract.customerId, customerName: contract.customerName, name: contract.name, mandateRef: contract.reference || contract.number, budgetHours: hours || 160, usedHours: 0, salesRate: hours ? Math.round(hourlyRevenue / hours) : 165, costRate: 105, billingModel: contract.billingInterval === 'none' ? 'mixed' : 'retainer', contractId: contract.id, status: 'active' }
      const policy = createDefaultOrderPolicy(order.id, order.billingModel, {
        ...customerProcessFor(state.customers.find((customer) => customer.id === order.customerId), state.appSettings),
        ...(contract.workflowOverride ?? {}),
      })
      setState((current) => ({ ...current, orders: [order, ...current.orders], orderPolicies: [policy, ...current.orderPolicies], customerActivities: [makeActivity(state.currentOrganizationId, contract.customerId, 'order', `Auftrag aus ${contract.number} erstellt`, contract.name), ...current.customerActivities] }))
      return order
    },
    createInvoiceFromContract(contractId, period) {
      const contract = state.contracts.find((item) => item.id === contractId)
      if (!contract || contract.status !== 'active' || contract.billingInterval === 'none') return null
      const customer = state.customers.find((item) => item.id === contract.customerId)
      if (!customer || !contract.lines.length) return null
      const billingDate = contract.nextInvoiceDate || today()
      const billingPeriod = period || monthLabel(billingDate)
      const existing = state.invoices.find((item) =>
        item.contractId === contract.id &&
        item.period === billingPeriod &&
        item.status !== 'cancelled'
      )
      if (existing) return existing
      const lines: InvoiceLine[] = contract.lines.map((line, index) => ({
        id: `il-${Date.now()}-${index}`, description: line.description, quantity: line.quantity, unit: line.unit, unitPrice: line.unitPrice, vatRate: line.vatRate, sourceTimeEntryIds: [],
      }))
      const issueDate = today()
      const invoice: Invoice = {
        organizationId: state.currentOrganizationId,
        id: `inv-${Date.now()}`, number: nextInvoiceNumber(state.invoices), customerId: customer.id, customerName: customer.name,
        contractId: contract.id, contractName: contract.name, kind: 'recurring', period: billingPeriod, issueDate,
        due: addDays(issueDate, customer.paymentDays), status: 'draft', lines, ...invoiceTotals(lines), paidAmount: 0,
        recipientName: customer.legalName || customer.name, recipientAddress: customer.address, recipientZip: customer.zip, recipientCity: customer.city,
        recipientCountry: customer.country, recipientEmail: customer.email, introText: state.documentTemplates.invoiceIntro, outroText: state.documentTemplates.invoiceOutro, reference: contract.reference,
      }
      const nextInvoiceDate = advanceBillingDate(billingDate, contract.billingInterval)
      setState((current) => ({
        ...current,
        invoices: [invoice, ...current.invoices],
        contracts: current.contracts.map((item) => item.id === contract.id ? { ...item, nextInvoiceDate } : item),
        customerActivities: [makeActivity(state.currentOrganizationId, customer.id, 'invoice', `Rechnung ${invoice.number} aus Vertrag erstellt`, contract.name), ...current.customerActivities],
      }))
      return invoice
    },
    createCreditNote(invoiceId, amount, reason) {
      const invoice = state.invoices.find((item) => item.id === invoiceId)
      if (!invoice || !['sent', 'partial', 'paid', 'overdue'].includes(effectiveInvoiceStatus(invoice)) || !Number.isFinite(amount) || amount <= 0) return null
      const maximum = Math.max(0, invoice.amount - (invoice.creditedAmount ?? 0))
      const booked = round2(Math.min(maximum, amount))
      if (!booked) return null
      const credit: CreditNote = { organizationId: state.currentOrganizationId, id: `credit-${Date.now()}`, number: nextCreditNumber(state.creditNotes), invoiceId, invoiceNumber: invoice.number, customerId: invoice.customerId, customerName: invoice.customerName, date: today(), amount: booked, reason: reason.trim() || 'Korrektur' }
      setState((current) => ({
        ...current,
        creditNotes: [credit, ...current.creditNotes],
        invoices: current.invoices.map((item) => item.id === invoiceId ? { ...item, creditedAmount: round2((item.creditedAmount ?? 0) + booked) } : item),
        customerActivities: [makeActivity(state.currentOrganizationId, invoice.customerId, 'credit', `Gutschrift ${credit.number} erstellt`, `${invoice.number} · CHF ${booked.toFixed(2)}`), ...current.customerActivities],
      }))
      return credit
    },
    addActivityNote(customerId, note) {
      const cleaned = note.trim()
      if (!cleaned) return
      setState((current) => ({ ...current, customerActivities: [makeActivity(state.currentOrganizationId, customerId, 'note', 'Notiz', cleaned), ...current.customerActivities] }))
    },
    addCustomerContact(contact) {
      setState((current) => ({
        ...current,
        customerContacts: [{ ...contact, organizationId: state.currentOrganizationId }, ...current.customerContacts.map((item) => contact.primary && item.customerId === contact.customerId ? { ...item, primary: false } : item)],
      }))
    },
    updateCustomerContact(id, changes) {
      const existing = state.customerContacts.find((item) => item.id === id)
      if (!existing) return null
      const updated = { ...existing, ...changes }
      setState((current) => ({
        ...current,
        customerContacts: current.customerContacts.map((item) => item.id === id ? updated : (changes.primary && item.customerId === existing.customerId ? { ...item, primary: false } : item)),
      }))
      return updated
    },
    createOrder(input) {
      const order: Order = { ...input, organizationId: state.currentOrganizationId, id: `ord-${Date.now()}`, usedHours: 0 }
      const policy = createDefaultOrderPolicy(order.id, order.billingModel, customerProcessFor(state.customers.find((customer) => customer.id === order.customerId), state.appSettings))
      setState((current) => ({
        ...current,
        orders: [order, ...current.orders],
        orderPolicies: [policy, ...current.orderPolicies],
        customerActivities: [makeActivity(state.currentOrganizationId, order.customerId, 'order', 'Auftrag erstellt', order.name), ...current.customerActivities],
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
      setState((current) => ({ ...current, employees: [{ ...employee, organizationId: state.currentOrganizationId }, ...current.employees] }))
    },
    updateEmployee(id, changes) {
      const existing = state.employees.find((item) => item.id === id)
      if (!existing) return null
      const updated = { ...existing, ...changes }
      setState((current) => ({ ...current, employees: current.employees.map((item) => item.id === id ? updated : item) }))
      return updated
    },
    addSupplierInvoice(invoice) {
      setState((current) => ({ ...current, supplierInvoices: [{ ...invoice, organizationId: state.currentOrganizationId }, ...current.supplierInvoices] }))
    },
    updateSupplierInvoice(id, changes) {
      const existing = state.supplierInvoices.find((item) => item.id === id)
      if (!existing) return null
      const updated = { ...existing, ...changes }
      setState((current) => ({ ...current, supplierInvoices: current.supplierInvoices.map((item) => item.id === id ? updated : item) }))
      return updated
    },
    addTimeEntry(entry) {
      setState((current) => ({ ...current, timeEntries: [{ ...entry, organizationId: state.currentOrganizationId }, ...current.timeEntries] }))
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
      setState((current) => ({ ...current, timeEvidence: [{ ...evidence, organizationId: state.currentOrganizationId }, ...current.timeEvidence] }))
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
          ? current.orderPolicies.map((item) => item.orderId === orderId ? { ...policy, organizationId: state.currentOrganizationId } : item)
          : [{ ...policy, organizationId: state.currentOrganizationId }, ...current.orderPolicies],
      }))
    },
    updateOrderAssignmentRule(rule) {
      setState((current) => {
        const exists = current.orderAssignmentRules.some((item) => item.orderId === rule.orderId && item.personId === rule.personId)
        return {
          ...current,
          orderAssignmentRules: exists
            ? current.orderAssignmentRules.map((item) => item.orderId === rule.orderId && item.personId === rule.personId ? { ...rule, organizationId: state.currentOrganizationId } : item)
            : [{ ...rule, organizationId: state.currentOrganizationId }, ...current.orderAssignmentRules],
        }
      })
    },
    updateQuote(id, changes) {
      const existing = state.quotes.find((quote) => quote.id === id)
      if (!existing) return
      const statusChanged = changes.status && changes.status !== existing.status
      if (statusChanged) {
        const allowed = existing.status === 'sent' && ['accepted', 'declined', 'expired'].includes(changes.status!)
        if (!allowed) return
      }
      const statusLabels: Partial<Record<Quote['status'], string>> = { accepted: 'angenommen', declined: 'abgelehnt', expired: 'abgelaufen', revised: 'ersetzt' }
      setState((current) => ({
        ...current,
        quotes: current.quotes.map((quote) => quote.id === id ? recalcQuote({ ...quote, ...changes }) : quote),
        customerActivities: statusChanged && statusLabels[changes.status!]
          ? [makeActivity(state.currentOrganizationId, existing.customerId, 'quote', `Angebot ${existing.number} ${statusLabels[changes.status!]}`, existing.title), ...current.customerActivities]
          : current.customerActivities,
      }))
    },
    createQuote(input) {
      const customer = state.customers.find((item) => item.id === input.customerId && item.status === 'active')
      const validLines = input.lines.filter((line) =>
        line.description.trim() &&
        Number.isFinite(line.quantity) &&
        line.quantity > 0 &&
        Number.isFinite(line.unitPrice) &&
        line.unitPrice >= 0
      )
      if (!customer || !input.title.trim() || !input.validUntil || !validLines.length) return null
      const quote: Quote = recalcQuote({
        organizationId: state.currentOrganizationId,
        id: `quo-${Date.now()}`,
        number: nextQuoteNumber(state.quotes),
        customerId: customer.id,
        customerName: customer.name,
        title: input.title.trim(),
        issueDate: today(),
        validUntil: input.validUntil,
        status: 'draft',
        version: 1,
        lines: validLines,
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
      setState((current) => ({ ...current, quotes: [quote, ...current.quotes], customerActivities: [makeActivity(state.currentOrganizationId, customer.id, 'quote', `Angebot ${quote.number} erstellt`, quote.title), ...current.customerActivities] }))
      return quote
    },
    createQuoteRevision(quoteId) {
      const source = state.quotes.find((item) => item.id === quoteId)
      if (!source || !['sent', 'declined', 'expired'].includes(source.status)) return null
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
      setState((current) => ({ ...current, quotes: [revision, ...current.quotes.map((item) => item.id === source.id ? { ...item, status: 'revised' as const } : item)] }))
      return revision
    },
    sendQuote(id, to) {
      const quote = state.quotes.find((item) => item.id === id)
      if (!quote || !['draft', 'sent'].includes(quote.status) || !to.trim()) return null
      const updated: Quote = { ...quote, status: 'sent', sentAt: new Date().toISOString(), sentTo: to.trim(), recipientEmail: to.trim() }
      setState((current) => ({ ...current, quotes: current.quotes.map((item) => item.id === id ? updated : item), customerActivities: [makeActivity(state.currentOrganizationId, quote.customerId, 'quote', `Versand zu Angebot ${quote.number} erfasst`, to.trim()), ...current.customerActivities] }))
      return updated
    },
    createOrderFromQuote(quoteId) {
      const quote = state.quotes.find((item) => item.id === quoteId)
      if (!quote) return null
      if (state.appSettings.workflow.requireQuoteAcceptanceBeforeOrder && quote.status !== 'accepted') return null
      const existing = state.orders.find((order) => order.sourceQuoteId === quote.id || order.mandateRef === quote.number)
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
        sourceQuoteId: quote.id,
        status: 'active',
      }
      const policy = createDefaultOrderPolicy(order.id, order.billingModel, customerProcessFor(state.customers.find((customer) => customer.id === order.customerId), state.appSettings))
      setState((current) => ({
        ...current,
        orders: [order, ...current.orders],
        orderPolicies: [policy, ...current.orderPolicies],
        customerActivities: [makeActivity(state.currentOrganizationId, order.customerId, 'order', `Auftrag aus ${quote.number} erstellt`, order.name), ...current.customerActivities],
      }))
      return order
    },
    createInvoiceFromQuote(quoteId) {
      const quote = state.quotes.find((item) => item.id === quoteId)
      if (!quote || quote.status !== 'accepted') return null
      const existing = state.invoices.find((item) =>
        item.status !== 'cancelled' &&
        (item.sourceQuoteId === quote.id || item.reference === quote.number)
      )
      if (existing) return existing
      const customer = state.customers.find((item) => item.id === quote.customerId)
      if (!customer || !quote.lines.length) return null
      const linkedOrder = state.orders.find((item) => item.sourceQuoteId === quote.id || item.mandateRef === quote.number)
      const lines: InvoiceLine[] = quote.lines.map((line, index) => ({ id: `il-q-${Date.now()}-${index}`, description: line.description, quantity: line.quantity, unit: line.unit === 'Tag' ? 'Stk.' : line.unit, unitPrice: line.unitPrice, vatRate: line.vatRate ?? 8.1, sourceTimeEntryIds: [] }))
      const issueDate = today()
      const invoice: Invoice = {
        organizationId: state.currentOrganizationId,
        id: `inv-${Date.now()}`,
        number: nextInvoiceNumber(state.invoices),
        customerId: customer.id,
        customerName: customer.name,
        orderId: linkedOrder?.id,
        orderName: linkedOrder?.name,
        sourceQuoteId: quote.id,
        kind: 'standard',
        period: monthLabel(issueDate),
        issueDate,
        due: addDays(issueDate, customer.paymentDays),
        status: 'draft',
        lines,
        ...invoiceTotals(lines),
        paidAmount: 0,
        recipientName: customer.legalName || customer.name,
        recipientAddress: customer.address,
        recipientZip: customer.zip,
        recipientCity: customer.city,
        recipientCountry: customer.country,
        recipientEmail: customer.email,
        introText: state.documentTemplates.invoiceIntro,
        outroText: state.documentTemplates.invoiceOutro,
        reference: quote.number,
      }
      setState((current) => ({ ...current, invoices: [invoice, ...current.invoices], customerActivities: [makeActivity(state.currentOrganizationId, customer.id, 'invoice', `Rechnung ${invoice.number} aus ${quote.number} erstellt`, quote.title), ...current.customerActivities] }))
      return invoice
    },
    createInvoiceFromTimes(input) {
      const customer = state.customers.find((item) => item.id === input.customerId)
      if (!customer) return null
      const order = input.orderId ? state.orders.find((item) => item.id === input.orderId) : undefined
      if (input.orderId && (!order || order.customerId !== customer.id)) return null
      const requestedTimeIds = new Set(input.timeEntryIds)
      const selected = state.timeEntries.filter((entry) =>
        requestedTimeIds.has(entry.id) &&
        entry.customerId === customer.id &&
        (!order || entry.orderId === order.id) &&
        getTimeEntryBillingEligibility(entry, state.timeEvidence, state.orderPolicies, state.orderAssignmentRules).eligible
      )
      if (selected.length !== requestedTimeIds.size) return null
      const selectedOrderIds = new Set(selected.map((entry) => entry.orderId))
      if (selectedOrderIds.size > 1) return null
      const requestedExpenseIds = new Set(input.expenseIds ?? [])
      const selectedExpenses = state.expenses.filter((expense) =>
        requestedExpenseIds.has(expense.id) &&
        expense.customerId === customer.id &&
        (!order || expense.orderId === order.id) &&
        expense.billable &&
        !expense.invoicedInvoiceId
      )
      if (selectedExpenses.length !== requestedExpenseIds.size) return null
      const expenseLines: InvoiceLine[] = selectedExpenses.map((expense, index) => ({ id: `il-exp-${Date.now()}-${index}`, description: `${formatDate(expense.date)} – ${expense.description}`, quantity: expense.quantity, unit: 'Stk.', unitPrice: expense.unitPrice, vatRate: 8.1, sourceTimeEntryIds: [], sourceExpenseIds: [expense.id] }))
      const extraLines = input.extraLines?.filter((line) =>
        line.description.trim() &&
        Number.isFinite(line.quantity) &&
        line.quantity > 0 &&
        Number.isFinite(line.unitPrice) &&
        line.unitPrice >= 0 &&
        Number.isFinite(line.vatRate) &&
        line.vatRate >= 0
      ) ?? []
      if (!selected.length && !selectedExpenses.length && !extraLines.length) return null
      const timeLines: InvoiceLine[] = selected.map((entry, index) => ({
        id: `il-${Date.now()}-${index}`,
        description: `${formatDate(entry.date)} – ${entry.description || 'Dienstleistung'} – ${entry.personName}`,
        quantity: entry.hours,
        unit: 'h',
        unitPrice: entry.salesRate,
        vatRate: 8.1,
        sourceTimeEntryIds: [entry.id],
      }))
      const lines = [...timeLines, ...expenseLines, ...extraLines]
      const totals = invoiceTotals(lines)
      const issueDate = today()
      const invoice: Invoice = {
        organizationId: state.currentOrganizationId,
        id: `inv-${Date.now()}`,
        number: nextInvoiceNumber(state.invoices),
        customerId: customer.id,
        customerName: customer.name,
        orderId: order?.id,
        orderName: order?.name,
        kind: input.kind ?? 'standard',
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
        expenses: current.expenses.map((expense) => selectedExpenses.some((selectedExpense) => selectedExpense.id === expense.id) ? { ...expense, invoicedInvoiceId: invoice.id } : expense),
        customerActivities: [makeActivity(state.currentOrganizationId, customer.id, 'invoice', `Rechnung ${invoice.number} erstellt`, input.period), ...current.customerActivities],
      }))
      return invoice
    },
    updateInvoiceDraft(id, changes) {
      const existing = state.invoices.find((item) => item.id === id)
      if (!existing || existing.status !== 'draft') return null
      const updated = recalcInvoice({ ...existing, ...changes })
      const nextTimeIds = new Set(updated.lines.flatMap((line) => line.sourceTimeEntryIds))
      const nextExpenseIds = new Set(updated.lines.flatMap((line) => line.sourceExpenseIds ?? []))
      setState((current) => ({
        ...current,
        invoices: current.invoices.map((item) => item.id === id ? updated : item),
        timeEntries: current.timeEntries.map((entry) =>
          entry.invoicedInvoiceId === id && !nextTimeIds.has(entry.id)
            ? { ...entry, invoicedInvoiceId: undefined }
            : entry
        ),
        expenses: current.expenses.map((expense) =>
          expense.invoicedInvoiceId === id && !nextExpenseIds.has(expense.id)
            ? { ...expense, invoicedInvoiceId: undefined }
            : expense
        ),
      }))
      return updated
    },
    sendInvoice(id, to, mode = 'invoice') {
      const invoice = state.invoices.find((item) => item.id === id)
      if (!invoice || invoice.status === 'cancelled' || !to.trim()) return null
      const currentStatus = effectiveInvoiceStatus(invoice)
      if (mode === 'reminder' && currentStatus !== 'overdue') return null
      const now = new Date().toISOString()
      const updated: Invoice = {
        ...invoice,
        recipientEmail: to.trim(),
        sentTo: to.trim(),
        ...(mode === 'reminder' ? { lastReminderAt: now, reminderLevel: Math.min(3, (invoice.reminderLevel ?? 0) + 1) as 1 | 2 | 3 } : { sentAt: now, status: invoice.status === 'draft' ? 'sent' : invoice.status }),
      }
      setState((current) => ({ ...current, invoices: current.invoices.map((item) => item.id === id ? updated : item), customerActivities: [makeActivity(state.currentOrganizationId, invoice.customerId, mode === 'reminder' ? 'reminder' : 'invoice', mode === 'reminder' ? `Mahnung ${updated.reminderLevel ?? 1} zu ${invoice.number} dokumentiert` : `Versand zu Rechnung ${invoice.number} erfasst`, to.trim()), ...current.customerActivities] }))
      return updated
    },
    cancelInvoice(id) {
      const invoice = state.invoices.find((item) => item.id === id)
      if (!invoice || !['sent', 'partial', 'overdue'].includes(effectiveInvoiceStatus(invoice))) return null
      const sourceIds = new Set(invoice.lines.flatMap((line) => line.sourceTimeEntryIds))
      const expenseIds = new Set(invoice.lines.flatMap((line) => line.sourceExpenseIds ?? []))
      const updated: Invoice = { ...invoice, status: 'cancelled' }
      setState((current) => ({
        ...current,
        invoices: current.invoices.map((item) => item.id === id ? updated : item),
        timeEntries: current.timeEntries.map((entry) => sourceIds.has(entry.id) && entry.invoicedInvoiceId === id ? { ...entry, invoicedInvoiceId: undefined } : entry),
        expenses: current.expenses.map((expense) => expenseIds.has(expense.id) && expense.invoicedInvoiceId === id ? { ...expense, invoicedInvoiceId: undefined } : expense),
      }))
      return updated
    },
    recordPayment(invoiceId, amount, method, date, reference) {
      if (!Number.isFinite(amount) || amount <= 0 || !date) return
      const invoice = state.invoices.find((item) => item.id === invoiceId)
      if (!invoice || !['sent', 'partial', 'overdue'].includes(effectiveInvoiceStatus(invoice))) return
      const netAmount = Math.max(0, invoice.amount - (invoice.creditedAmount ?? 0))
      const remaining = Math.max(0, netAmount - invoice.paidAmount)
      const booked = Math.min(remaining, amount)
      if (!booked) return
      const payment: Payment = { organizationId: state.currentOrganizationId, id: `pay-${Date.now()}`, invoiceId, date, amount: booked, method, reference: reference?.trim() || undefined }
      setState((current) => ({
        ...current,
        payments: [payment, ...current.payments],
        customerActivities: [makeActivity(state.currentOrganizationId, invoice.customerId, 'payment', `Zahlung zu ${invoice.number} erfasst`, `CHF ${booked.toFixed(2)}`), ...current.customerActivities],
        invoices: current.invoices.map((item) => {
          if (item.id !== invoiceId) return item
          const netAmount = Math.max(0, item.amount - (item.creditedAmount ?? 0))
          const paidAmount = round2(Math.min(netAmount, item.paidAmount + booked))
          return { ...item, paidAmount, status: paidAmount >= netAmount ? 'paid' : 'partial' }
        }),
      }))
    },
    updateCompanyProfile(changes) {
      setState((current) => ({ ...current, companyProfile: { ...current.companyProfile, ...changes, organizationId: current.currentOrganizationId } }))
    },
    updateDocumentTemplates(changes) {
      setState((current) => ({ ...current, documentTemplates: { ...current.documentTemplates, ...changes } }))
    },
    updateAppSettings(changes) {
      setState((current) => ({ ...current, appSettings: mergeAppSettings(changes, current.appSettings) }))
    },
    resetDemo() {
      removeStorage(STORAGE_KEY)
      setState(freshState())
    },
  }), [state, user])

  return <BusinessContext.Provider value={store}>{children}</BusinessContext.Provider>
}

export function useBusinessStore() {
  const value = useContext(BusinessContext)
  if (!value) throw new Error('useBusinessStore must be used inside BusinessStoreProvider')
  return value
}


function customerProcessFor(customer: Customer | undefined, settings: AppSettings) {
  return {
    ...settings.workflow.customerProcess,
    ...(customer?.workflowOverride ?? {}),
  }
}

function recalcInvoice(invoice: Invoice): Invoice { return { ...invoice, ...invoiceTotals(invoice.lines) } }
function recalcQuote(quote: Quote): Quote { return { ...quote, amount: round2(quote.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0)) } }
function invoiceTotals(lines: InvoiceLine[]) {
  const subtotal = round2(lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0))
  const vatAmount = round2(lines.reduce((sum, line) => sum + line.quantity * line.unitPrice * (line.vatRate / 100), 0))
  return { subtotal, vatAmount, amount: round2(subtotal + vatAmount) }
}
function round2(value: number) { return Math.round((value + Number.EPSILON) * 100) / 100 }
function nextInvoiceNumber(invoices: Invoice[]) { const year = new Date().getFullYear(); const current = invoices.reduce((max, invoice) => { const match = invoice.number.match(new RegExp(`^RE-${year}-(\d+)$`)); return match ? Math.max(max, Number(match[1])) : max }, 0); return `RE-${year}-${String(current + 1).padStart(3, '0')}` }
function nextContractNumber(contracts: Contract[]) { const year = new Date().getFullYear(); const current = contracts.reduce((max, contract) => { const match = contract.number.match(new RegExp(`^VR-${year}-(\d+)$`)); return match ? Math.max(max, Number(match[1])) : max }, 0); return `VR-${year}-${String(current + 1).padStart(3, '0')}` }
function nextCreditNumber(credits: CreditNote[]) { const year = new Date().getFullYear(); const current = credits.reduce((max, credit) => { const match = credit.number.match(new RegExp(`^GS-${year}-(\d+)$`)); return match ? Math.max(max, Number(match[1])) : max }, 0); return `GS-${year}-${String(current + 1).padStart(3, '0')}` }
function nextQuoteNumber(quotes: Quote[]) { const year = new Date().getFullYear(); const current = quotes.reduce((max, quote) => { const match = quote.number.match(new RegExp(`^AN-${year}-(\d+)$`)); return match ? Math.max(max, Number(match[1])) : max }, 0); return `AN-${year}-${String(current + 1).padStart(3, '0')}` }
function addDays(date: string, days: number) { const value = new Date(`${date}T12:00:00`); value.setDate(value.getDate() + days); return value.toISOString().slice(0, 10) }
function today() { return new Date().toISOString().slice(0, 10) }
function monthLabel(date: string) { return formatMonthYear(date) }
function advanceBillingDate(date: string, interval: Contract['billingInterval']) { const value = new Date(`${date}T12:00:00`); if (interval === 'monthly') value.setMonth(value.getMonth() + 1); else if (interval === 'quarterly') value.setMonth(value.getMonth() + 3); else if (interval === 'yearly') value.setFullYear(value.getFullYear() + 1); return value.toISOString().slice(0, 10) }
function makeActivity(organizationId: string, customerId: string, type: CustomerActivity['type'], title: string, detail?: string): CustomerActivity { return { organizationId, id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, customerId, type, title, detail, createdAt: new Date().toISOString() } }
function formatDate(date: string) { return formatLocaleDate(date) }
function mergeAppSettings(changes?: Partial<AppSettings>, base: AppSettings = defaultAppSettings): AppSettings {
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
