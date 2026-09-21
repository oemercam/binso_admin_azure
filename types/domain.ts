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
  contact?: string
  email?: string
  phone?: string
  paymentDays: number
  status: 'active' | 'inactive'
}

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired'

export type Quote = {
  id: string
  number: string
  customerId: string
  customerName: string
  title: string
  amount: number
  validUntil: string
  status: QuoteStatus
  version: number
}

export type Order = {
  id: string
  customerId: string
  customerName: string
  name: string
  budgetHours: number
  usedHours: number
  salesRate: number
  costRate: number
  status: 'active' | 'paused' | 'completed'
}

export type TimeEntry = {
  id: string
  orderId: string
  orderName: string
  customerName: string
  date: string
  hours: number
  note?: string
  billable: boolean
  invoiced: boolean
}

export type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled'

export type Invoice = {
  id: string
  number: string
  customerName: string
  period: string
  amount: number
  due: string
  status: InvoiceStatus
  paidAmount: number
}

export type Employee = {
  id: string
  name: string
  role: Role
  email: string
  targetHours: number
  bookedHours: number
  billableHours: number
  utilisation: number
}
