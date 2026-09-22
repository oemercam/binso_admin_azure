import type { Order, TimeEntry } from '@/types/domain'

export type OrderMetrics = {
  usedHours: number
  remainingHours: number
  revenue: number
  cost: number
  contributionMargin: number
  marginPercent: number
  budgetUsagePercent: number
}

export function calculateOrderMetrics(order: Order, timeEntries: TimeEntry[]): OrderMetrics {
  const entries = timeEntries.filter((entry) => entry.orderId === order.id)
  const trackedHours = entries.reduce((sum, entry) => sum + entry.hours, 0)
  const usedHours = trackedHours || order.usedHours
  const revenue = entries.length
    ? entries.reduce((sum, entry) => sum + entry.hours * entry.salesRate, 0)
    : usedHours * order.salesRate
  const cost = entries.length
    ? entries.reduce((sum, entry) => sum + entry.hours * entry.internalCostRate, 0)
    : usedHours * order.costRate
  const contributionMargin = revenue - cost

  return {
    usedHours,
    remainingHours: Math.max(0, order.budgetHours - usedHours),
    revenue,
    cost,
    contributionMargin,
    marginPercent: revenue > 0 ? Math.round((contributionMargin / revenue) * 100) : 0,
    budgetUsagePercent: order.budgetHours > 0 ? Math.round((usedHours / order.budgetHours) * 100) : 0,
  }
}
