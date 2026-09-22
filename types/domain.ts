export type Role = 'owner' | 'admin' | 'finance' | 'employee'

export type AppUser = {
  id: string
  name: string
  email: string
  role: Role
}

export type Customer = {
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
  status: 'prospect' | 'active' | 'inactive'
  notes?: string
}

export type Supplier = {
  id: string
  name: string
  supplierNo: string
  contact: string
  email: string
  uid?: string
  paymentDays: number
  status: 'active' | 'inactive'
}

export type CompanyProfile = {
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

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired'

export type QuoteLine = {
  id: string
  description: string
  quantity: number
  unit: 'h' | 'Tag' | 'pauschal'
  unitPrice: number
  vatRate?: number
}

export type Quote = {
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
export type BillingModel = 'time' | 'fixed' | 'mixed'

export type Order = {
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
  status: OrderStatus
}

export type WorkerType = 'employee' | 'hourly_employee' | 'external'

export type TimeEntry = {
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
}

export type Payment = {
  id: string
  invoiceId: string
  date: string
  amount: number
  method: 'Bank' | 'Bar' | 'Kreditkarte' | 'Sonstige'
  reference?: string
}

export type Invoice = {
  id: string
  number: string
  customerId: string
  customerName: string
  orderId?: string
  orderName?: string
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
}

export type SupplierInvoice = {
  id: string
  number: string
  supplierId: string
  supplierName: string
  orderId?: string
  orderName?: string
  invoiceDate: string
  due: string
  netAmount: number
  vatAmount: number
  amount: number
  status: 'open' | 'paid' | 'review'
  note?: string
}

export type Employee = {
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
  }
  notifications: {
    overdueInvoice: boolean
    budgetWarning: boolean
    expiringQuote: boolean
    paymentReceived: boolean
    timesheetReady: boolean
  }
}
