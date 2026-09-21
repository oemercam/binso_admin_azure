export type Role = 'admin' | 'employee' | 'finance'

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
  paymentDays: number
}

export type Order = {
  id: string
  customerId: string
  name: string
  budgetHours: number
  salesRate: number
  costRate: number
  status: 'active' | 'paused' | 'completed'
}

export type TimeEntry = {
  id: string
  orderId: string
  date: string
  hours: number
  note?: string
}
