import type {
  AppSettings, AuditEvent, CompanyProfile, Contract, CreditNote, Customer, CustomerActivity,
  CustomerContact, DataExportJob, DocumentTemplates, Employee, Expense, ImportJob, Invoice, InvoiceLine,
  NumberSequence, Order, Organization, OrganizationEntitlements, OrganizationMembership, OrganizationSubscription,
  Payment, Permission, Quote, QuoteLine, Supplier, SupplierInvoice, TimeEntry,
} from '@/types/domain'
import type { OrderPolicy } from '@/modules/orders/types'
import type { OrderAssignmentRule } from '@/modules/workforce/types'
import type { TimeEvidence } from '@/modules/time/types'

export type BusinessState = {
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
  companyProfiles: Record<string, CompanyProfile>
  documentTemplatesByOrganization: Record<string, DocumentTemplates>
  appSettingsByOrganization: Record<string, AppSettings>
}

export type CreateInvoiceInput = {
  customerId: string
  orderId?: string
  timeEntryIds: string[]
  expenseIds?: string[]
  extraLines?: InvoiceLine[]
  period: string
  kind?: Invoice['kind']
}

export type CreateQuoteInput = {
  customerId: string
  title: string
  validUntil: string
  lines: QuoteLine[]
  reference?: string
}

export type CreateOrderInput = Omit<Order, 'id' | 'usedHours' | 'organizationId'>

export type CreateContractInput = Omit<Contract, 'id' | 'number' | 'customerName' | 'organizationId'> & { customerId: string }

export type BusinessStore = BusinessState & {
  queueDocumentMail: (kind: 'quote' | 'invoice' | 'reminder', entityId: string, to: string, key: string) => Promise<void>
  currentOrganization: Organization
  setCurrentOrganization: (organizationId: string) => void
  createOrganization: (input: { organizationId?: string; name: string; slug: string; ownerEmail: string; plan: OrganizationSubscription['plan'] }) => Organization
  activeMembership: OrganizationMembership | null
  can: (permission: Permission) => boolean
  addMembership: (membership: OrganizationMembership) => void
  updateMembership: (id: string, changes: Partial<OrganizationMembership>) => OrganizationMembership | null
  appendAuditEvent: (event: Omit<AuditEvent, 'id' | 'organizationId' | 'createdAt'>) => void
  createExportJob: (job: Omit<DataExportJob, 'id' | 'organizationId' | 'createdAt' | 'status'>) => DataExportJob
  updateExportJob: (id: string, changes: Partial<DataExportJob>) => void
  createImportJob: (job: Omit<ImportJob, 'id' | 'organizationId' | 'createdAt' | 'status' | 'errorCount'>) => ImportJob
  updateImportJob: (id: string, changes: Partial<ImportJob>) => void
  addCustomer: (customer: Customer) => void
  updateCustomer: (id: string, changes: Partial<Customer>) => Customer | null
  createContract: (input: CreateContractInput) => Contract | null
  updateContract: (id: string, changes: Partial<Contract>) => Contract | null
  addExpense: (expense: Omit<Expense, 'organizationId'>) => void
  createOrderFromContract: (contractId: string) => Order | null
  createInvoiceFromContract: (contractId: string, period?: string) => Invoice | null
  createCreditNote: (invoiceId: string, amount: number, reason: string) => CreditNote | null
  addActivityNote: (customerId: string, note: string) => void
  addCustomerContact: (contact: Omit<CustomerContact, 'organizationId'>) => void
  updateCustomerContact: (id: string, changes: Partial<CustomerContact>) => CustomerContact | null
  createOrder: (input: CreateOrderInput) => Order
  updateOrder: (id: string, changes: Partial<Order>) => Order | null
  addEmployee: (employee: Employee) => void
  updateEmployee: (id: string, changes: Partial<Employee>) => Employee | null
  addSupplierInvoice: (invoice: Omit<SupplierInvoice, 'organizationId'>) => void
  updateSupplierInvoice: (id: string, changes: Partial<SupplierInvoice>) => SupplierInvoice | null
  addTimeEntry: (entry: Omit<TimeEntry, 'organizationId'>) => void
  updateTimeEntry: (id: string, changes: Partial<TimeEntry>) => TimeEntry | null
  addEvidence: (evidence: Omit<TimeEvidence, 'organizationId'>) => void
  updateEvidence: (id: string, changes: Partial<TimeEvidence>) => TimeEvidence | null
  updateOrderPolicy: (orderId: string, policy: OrderPolicy) => void
  updateOrderAssignmentRule: (rule: Omit<OrderAssignmentRule, 'organizationId'>) => void
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

