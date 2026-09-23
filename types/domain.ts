export type Role = 'owner' | 'admin' | 'finance' | 'employee'

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

export type AppUser = {
  id: string
  name: string
  email: string
  role: Role
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
