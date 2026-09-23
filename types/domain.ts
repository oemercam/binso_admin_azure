export type Role = 'owner' | 'admin' | 'finance' | 'employee'
export type PlatformRole = 'platform_owner' | 'platform_admin' | 'platform_support'

export type OrganizationId = string

export type Organization = {
  id: OrganizationId
  name: string
  slug: string
  status: 'active' | 'inactive'
  country: string
  currency: 'CHF' | 'EUR'
  locale: 'de-CH' | 'fr-CH' | 'it-CH' | 'en-CH'
  createdAt: string
  updatedAt: string
}

export type OrganizationScoped = {
  /**
   * Optional during the V46 compatibility migration.
   * V48 will make tenant ownership mandatory at all persistence boundaries.
   */
  organizationId?: OrganizationId
}


export type OrganizationMembership = {
  id: string
  organizationId: OrganizationId
  userId: string
  email: string
  role: Role
  status: 'invited' | 'active' | 'suspended'
  createdAt: string
  updatedAt: string
}

export type Permission =
  | 'organization.read'
  | 'organization.manage'
  | 'members.read'
  | 'members.manage'
  | 'customers.read'
  | 'customers.write'
  | 'quotes.read'
  | 'quotes.write'
  | 'orders.read'
  | 'orders.write'
  | 'contracts.read'
  | 'contracts.write'
  | 'time.read'
  | 'time.write'
  | 'time.approve'
  | 'invoices.read'
  | 'invoices.write'
  | 'payments.write'
  | 'finance.read'
  | 'margin.read'
  | 'employees.read'
  | 'employees.write'
  | 'employee_costs.read'
  | 'settings.manage'
  | 'audit.read'
  | 'exports.create'

export type SubscriptionPlan = 'starter' | 'business' | 'professional' | 'enterprise'
export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'expired' | 'cancelled'

export type OrganizationSubscription = {
  id: string
  organizationId: OrganizationId
  plan: SubscriptionPlan
  status: SubscriptionStatus
  seats: number
  trialUntil?: string
  billingCustomerId?: string
  billingSubscriptionId?: string
  billingProvider?: 'manual' | 'stripe'
  billingInterval?: 'monthly' | 'yearly'
  unitAmountChf?: number
  currentPeriodEnd?: string
  nextBillingAt?: string
  cancelAtPeriodEnd?: boolean
  cancelledAt?: string
  scheduledPlan?: SubscriptionPlan
}

export type AuditEvent = {
  id: string
  organizationId: OrganizationId
  actorUserId: string
  actorName: string
  action: string
  entityType: string
  entityId?: string
  detail?: string
  createdAt: string
}

export type NumberSequence = {
  organizationId: OrganizationId
  kind: 'customer' | 'quote' | 'order' | 'contract' | 'invoice' | 'credit_note'
  prefix: string
  nextValue: number
  padding: number
  includeYear: boolean
}

export type OrganizationFeature =
  | 'crm'
  | 'quotes'
  | 'orders'
  | 'contracts'
  | 'time'
  | 'invoices'
  | 'finance'
  | 'employees'
  | 'audit'
  | 'imports'
  | 'exports'
  | 'api'

export type OrganizationEntitlements = {
  organizationId: OrganizationId
  features: OrganizationFeature[]
  maxUsers: number
  maxStorageMb: number
}

export type BusinessBootstrap = {
  organizations: Organization[]
  currentOrganizationId: OrganizationId
  memberships: OrganizationMembership[]
  subscriptions: OrganizationSubscription[]
  entitlements: OrganizationEntitlements[]
  companyProfiles: Record<string, CompanyProfile>
}


export type PlanDefinition = {
  id: SubscriptionPlan
  name: string
  monthlyPriceChf?: number
  includedUsers: number
  features: OrganizationFeature[]
  description: string
  recommended?: boolean
}

export type PlatformTenantStatus = 'trial' | 'active' | 'past_due' | 'suspended' | 'expired' | 'cancelled'

export type PlatformTenant = {
  id: string
  organizationId: OrganizationId
  companyName: string
  ownerName: string
  ownerEmail: string
  plan: SubscriptionPlan
  status: PlatformTenantStatus
  subscriptionStatus?: SubscriptionStatus
  seats: number
  users: number
  monthlyRevenueChf: number
  createdAt: string
  lastActiveAt: string
  storageMb: number
  trialUntil?: string
  currentPeriodEnd?: string
  cancelAtPeriodEnd?: boolean
  scheduledPlan?: SubscriptionPlan
  billingProvider?: 'manual' | 'stripe'
}

export type SignupRequest = {
  id: string
  companyName: string
  ownerName: string
  email: string
  plan: SubscriptionPlan
  status: 'started' | 'account_created' | 'trial_started' | 'active' | 'cancelled'
  createdAt: string
}

export type DataExportJob = {
  id: string
  organizationId: OrganizationId
  requestedBy: string
  status: 'queued' | 'processing' | 'ready' | 'failed'
  format: 'csv' | 'xlsx' | 'zip' | 'json'
  scope: 'all' | 'customers' | 'contacts' | 'invoices' | 'time'
  createdAt: string
  completedAt?: string
}

export type ImportJob = {
  id: string
  organizationId: OrganizationId
  requestedBy: string
  status: 'draft' | 'validated' | 'importing' | 'completed' | 'failed'
  entityType: 'customers' | 'contacts' | 'employees' | 'invoices'
  fileName: string
  createdAt: string
  completedAt?: string
  errorCount: number
}

export type AppUser = {
  id: string
  name: string
  email: string
  role: Role
  platformRole?: PlatformRole
}

export type CustomerWorkflowPolicy = {
  timeTrackingMode: 'internal' | 'external_customer_system' | 'both'
  monthlyReportRequired: boolean
  customerSignatureRequired: boolean
  customerApprovalRequired: boolean
  blockBillingUntilReportApproved: boolean
  blockPayoutUntilReportApproved: boolean
}

export type SettlementPolicy = {
  mode: 'salary' | 'hourly_payroll' | 'supplier_invoice'
  requireApprovedMonthlyReport: boolean
  requireSupplierInvoice: boolean
  requireFinanceApproval: boolean
}

export type Customer = {
  organizationId?: OrganizationId
  id: string
  name: string
  legalName?: string
  customerNo: string
  contact?: string
  email?: string
  phone?: string
  address?: string
  zip?: string
  city?: string
  country: string
  uid?: string
  paymentDays: number
  status: 'active' | 'inactive'
  notes?: string
  workflowOverride?: Partial<CustomerWorkflowPolicy>
}


export type CustomerContact = {
  organizationId?: OrganizationId
  id: string
  customerId: string
  name: string
  email?: string
  phone?: string
  role?: string
  primary: boolean
}

export type Supplier = {
  organizationId?: OrganizationId
  id: string
  name: string
  supplierNo: string
  contact: string
  email: string
  uid?: string
  paymentDays: number
  status: 'active' | 'inactive'
  settlementOverride?: Partial<SettlementPolicy>
}

export type CompanyProfile = {
  organizationId?: OrganizationId
  name: string
  address: string
  zip: string
  city: string
  country: string
  uid: string
  email: string
  phone: string
  website: string
  iban: string
  bankName: string
  defaultPaymentDays: number
}

export type DocumentTemplates = {
  invoiceIntro: string
  invoiceOutro: string
  quoteIntro: string
  quoteOutro: string
  reminderIntro: string
  reminderOutro: string
  invoiceEmailSubject: string
  invoiceEmailBody: string
  quoteEmailSubject: string
  quoteEmailBody: string
  reminderEmailSubject: string
  reminderEmailBody: string
}

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired' | 'revised'

export type QuoteLine = {
  id: string
  description: string
  quantity: number
  unit: 'h' | 'Tag' | 'pauschal'
  unitPrice: number
  vatRate?: number
}

export type Quote = {
  organizationId?: OrganizationId
  id: string
  number: string
  customerId: string
  customerName: string
  title: string
  issueDate?: string
  validUntil: string
  status: QuoteStatus
  version: number
  lines: QuoteLine[]
  amount: number
  recipientName?: string
  recipientAddress?: string
  recipientZip?: string
  recipientCity?: string
  recipientCountry?: string
  recipientEmail?: string
  introText?: string
  outroText?: string
  reference?: string
  sentAt?: string
  sentTo?: string
}

export type OrderStatus = 'active' | 'paused' | 'completed'
export type BillingModel = 'time' | 'fixed' | 'retainer' | 'milestone' | 'mixed'

export type Order = {
  organizationId?: OrganizationId
  id: string
  customerId: string
  customerName: string
  endCustomerName?: string
  primeContractorName?: string
  name: string
  mandateRef?: string
  procurementRef?: string
  budgetHours: number
  usedHours: number
  salesRate: number
  costRate: number
  billingModel: BillingModel
  sourceQuoteId?: string
  contractId?: string
  status: OrderStatus
}

export type WorkerType = 'employee' | 'hourly_employee' | 'external'

export type TimeEntry = {
  organizationId?: OrganizationId
  id: string
  orderId: string
  orderName: string
  customerId: string
  customerName: string
  personId: string
  personName: string
  workerType: WorkerType
  date: string
  hours: number
  description?: string
  billable: boolean
  approved: boolean
  salesRate: number
  internalCostRate: number
  invoicedInvoiceId?: string
}

export type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled'

export type InvoiceLine = {
  id: string
  description: string
  quantity: number
  unit: 'h' | 'Stk.' | 'pauschal'
  unitPrice: number
  vatRate: number
  sourceTimeEntryIds: string[]
  sourceExpenseIds?: string[]
}

export type Payment = {
  organizationId?: OrganizationId
  id: string
  invoiceId: string
  date: string
  amount: number
  method: 'Bank' | 'Bar' | 'Kreditkarte' | 'Sonstige'
  reference?: string
}

export type Invoice = {
  organizationId?: OrganizationId
  id: string
  number: string
  customerId: string
  customerName: string
  orderId?: string
  orderName?: string
  sourceQuoteId?: string
  contractId?: string
  contractName?: string
  kind?: 'standard' | 'deposit' | 'partial' | 'final' | 'recurring'
  period: string
  issueDate: string
  due: string
  status: InvoiceStatus
  lines: InvoiceLine[]
  subtotal: number
  vatAmount: number
  amount: number
  paidAmount: number
  recipientName?: string
  recipientAddress?: string
  recipientZip?: string
  recipientCity?: string
  recipientCountry?: string
  recipientEmail?: string
  introText?: string
  outroText?: string
  reference?: string
  sentAt?: string
  sentTo?: string
  lastReminderAt?: string
  reminderLevel?: 0 | 1 | 2 | 3
  creditedAmount?: number
}


export type ContractStatus = 'draft' | 'active' | 'paused' | 'ended' | 'cancelled'
export type BillingInterval = 'none' | 'monthly' | 'quarterly' | 'yearly'

export type ContractLine = {
  id: string
  description: string
  quantity: number
  unit: 'h' | 'Stk.' | 'pauschal'
  unitPrice: number
  vatRate: number
}

export type Contract = {
  organizationId?: OrganizationId
  id: string
  number: string
  customerId: string
  customerName: string
  name: string
  startDate: string
  endDate?: string
  status: ContractStatus
  autoRenew: boolean
  noticeDays: number
  billingInterval: BillingInterval
  nextInvoiceDate?: string
  billingDay?: number
  lines: ContractLine[]
  reference?: string
  notes?: string
  workflowOverride?: Partial<CustomerWorkflowPolicy>
}

export type Expense = {
  organizationId?: OrganizationId
  id: string
  customerId: string
  customerName: string
  orderId?: string
  orderName?: string
  contractId?: string
  date: string
  description: string
  category: 'expense' | 'material' | 'travel' | 'other'
  quantity: number
  unitPrice: number
  billable: boolean
  invoicedInvoiceId?: string
}

export type CreditNote = {
  organizationId?: OrganizationId
  id: string
  number: string
  invoiceId: string
  invoiceNumber: string
  customerId: string
  customerName: string
  date: string
  amount: number
  reason: string
}

export type CustomerActivity = {
  organizationId?: OrganizationId
  id: string
  customerId: string
  type: 'note' | 'quote' | 'order' | 'contract' | 'invoice' | 'payment' | 'reminder' | 'credit'
  title: string
  detail?: string
  createdAt: string
}

export type SupplierInvoice = {
  organizationId?: OrganizationId
  id: string
  number: string
  supplierId: string
  supplierName: string
  orderId?: string
  orderName?: string
  invoiceDate: string
  due: string
  period?: string
  hours?: number
  netAmount: number
  vatAmount: number
  amount: number
  status: 'open' | 'paid' | 'review'
  note?: string
}

export type Employee = {
  organizationId?: OrganizationId
  id: string
  name: string
  role: Role
  email: string
  employmentType: 'salary' | 'hourly'
  status: 'active' | 'inactive'
  targetHours: number
  bookedHours: number
  billableHours: number
  utilisation: number
  internalCostRate: number
  settlementOverride?: Partial<SettlementPolicy>
}


export type MailProvider = 'microsoft365' | 'smtp'

export type AppSettings = {
  mail: {
    provider: MailProvider
    senderName: string
    invoiceSender: string
    quoteSender: string
    reminderSender: string
    payrollSender: string
    replyTo: string
    financeCc: string
    attachPdf: boolean
    deliveryTracking: boolean
    copySender: boolean
  }
  reminders: {
    enabled: boolean
    automaticSend: boolean
    firstAfterDays: number
    secondAfterDays: number
    thirdAfterDays: number
    onlyBusinessDays: boolean
    stopWhenPaid: boolean
  }
  payroll: {
    enabled: boolean
    generateAfterApprovedTimesheet: boolean
    autoSend: boolean
    requireFinanceApproval: boolean
    hourlyEmployeesOnly: boolean
    period: 'monthly'
    subject: string
    emailBody: string
  }
  workflow: {
    requireTimeApproval: boolean
    allowSelfApproval: boolean
    lockInvoicedTimes: boolean
    requireQuoteAcceptanceBeforeOrder: boolean
    customerProcess: CustomerWorkflowPolicy
    employeeSettlement: SettlementPolicy
    supplierSettlement: SettlementPolicy
  }
  notifications: {
    overdueInvoice: boolean
    budgetWarning: boolean
    expiringQuote: boolean
    paymentReceived: boolean
    timesheetReady: boolean
  }
}
