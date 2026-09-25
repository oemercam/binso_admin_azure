import { formatHours, formatMonthShort } from '@/lib/format/locale'
import type { SupplierInvoice, TimeEntry } from '@/types/domain'

export type FinancialTrendPoint = {
  key: string
  month: string
  revenue: number
  cost: number
}


function monthKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`
}

function startOfMonth(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1)
}

function addMonths(value: Date, amount: number) {
  return new Date(value.getFullYear(), value.getMonth() + amount, 1)
}

export function buildFinancialTrend(
  timeEntries: TimeEntry[],
  supplierInvoices: SupplierInvoice[],
  months = 6,
  referenceDate = new Date(),
): FinancialTrendPoint[] {
  const start = addMonths(startOfMonth(referenceDate), -(Math.max(1, months) - 1))
  const points = Array.from({ length: Math.max(1, months) }, (_, index) => {
    const date = addMonths(start, index)
    return {
      key: monthKey(date),
      month: formatMonthShort(date),
      revenue: 0,
      cost: 0,
    }
  })

  const byKey = new Map(points.map((point) => [point.key, point]))

  for (const entry of timeEntries) {
    const date = new Date(`${entry.date}T00:00:00`)
    if (Number.isNaN(date.getTime())) continue
    const point = byKey.get(monthKey(date))
    if (!point) continue
    point.revenue += entry.hours * entry.salesRate
    point.cost += entry.hours * entry.internalCostRate
  }

  for (const invoice of supplierInvoices) {
    const date = new Date(`${invoice.invoiceDate}T00:00:00`)
    if (Number.isNaN(date.getTime())) continue
    const point = byKey.get(monthKey(date))
    if (!point) continue
    point.cost += invoice.netAmount
  }

  return points
}

export type CostSummaryRow = {
  key: string
  title: string
  meta: string
  amount: number
}

export function buildCostSummary(timeEntries: TimeEntry[], supplierInvoices: SupplierInvoice[]): CostSummaryRow[] {
  const rows = new Map<string, CostSummaryRow & { hours?: number; count?: number; kind: 'time' | 'supplier' }>()

  for (const entry of timeEntries) {
    const key = `time:${entry.personId}`
    const current = rows.get(key)
    const amount = entry.hours * entry.internalCostRate
    if (current) {
      current.amount += amount
      current.hours = (current.hours ?? 0) + entry.hours
      continue
    }
    rows.set(key, {
      key,
      title: entry.personName,
      meta: '',
      amount,
      hours: entry.hours,
      kind: 'time',
    })
  }

  for (const invoice of supplierInvoices) {
    const key = `supplier:${invoice.supplierId}`
    const current = rows.get(key)
    if (current) {
      current.amount += invoice.netAmount
      current.count = (current.count ?? 0) + 1
      continue
    }
    rows.set(key, {
      key,
      title: invoice.supplierName,
      meta: '',
      amount: invoice.netAmount,
      count: 1,
      kind: 'supplier',
    })
  }

  return Array.from(rows.values())
    .map((row) => ({
      key: row.key,
      title: row.title,
      amount: row.amount,
      meta: row.kind === 'time'
        ? `Interne Leistung · ${formatHours(row.hours ?? 0)}`
        : `Externe Leistung · ${row.count ?? 0} ${row.count === 1 ? 'Rechnung' : 'Rechnungen'}`,
    }))
    .sort((a, b) => b.amount - a.amount)
}
