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
  status: 'active' | 'inactive'
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

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired'

export type QuoteLine = {
  id: string
  description: string
  quantity: number
  unit: 'h' | 'Tag' | 'pauschal'
  unitPrice: number
}

export type Quote = {
  id: string
  number: string
  customerId: string
  customerName: string
  title: string
  validUntil: string
  status: QuoteStatus
  version: number
  lines: QuoteLine[]
  amount: number
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
  note?: string
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
  targetHours: number
  bookedHours: number
  billableHours: number
  utilisation: number
  internalCostRate: number
}
