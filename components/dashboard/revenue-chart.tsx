'use client'

import { useMemo } from 'react'
import { useBusinessStore } from '@/components/state/business-store'
import { formatMonthShort } from '@/lib/format/locale'

export type RevenuePoint = { month: string; revenue: number; cost: number }

export function RevenueChart({ series }: { series?: RevenuePoint[] } = {}) {
  const store = useBusinessStore()
  const resolved = useMemo(() => series ?? buildSeries(store.invoices, store.supplierInvoices), [series, store.invoices, store.supplierInvoices])
  const max = Math.max(1, ...resolved.flatMap((item) => [item.revenue, item.cost]))

  const points = resolved.map((item, index) => {
    const x = resolved.length > 1 ? (index / (resolved.length - 1)) * 100 : 0
    const y = 100 - (item.revenue / max) * 82 - 8
    return `${x},${y}`
  }).join(' ')

  const costPoints = resolved.map((item, index) => {
    const x = resolved.length > 1 ? (index / (resolved.length - 1)) * 100 : 0
    const y = 100 - (item.cost / max) * 82 - 8
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="line-chart">
      <div className="line-chart-legend"><span><i className="legend-primary" /> Umsatz</span><span><i className="legend-secondary" /> Kosten</span></div>
      <div className="line-chart-stage">
        <div className="line-chart-grid"><i /><i /><i /><i /></div>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Umsatz und Kosten der letzten sechs Monate">
          <polyline className="chart-line secondary" points={costPoints} />
          <polyline className="chart-line primary" points={points} />
        </svg>
      </div>
      <div className="line-chart-labels">{resolved.map((item) => <span key={item.month}>{item.month}</span>)}</div>
    </div>
  )
}

function buildSeries(invoices: Array<{ issueDate: string; amount: number; status: string }>, supplierInvoices: Array<{ invoiceDate: string; amount: number }>): RevenuePoint[] {
  const now = new Date()
  return Array.from({ length: 6 }, (_, offset) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - offset), 1)
    const year = date.getFullYear()
    const month = date.getMonth()
    const sameMonth = (value: string) => {
      const parsed = new Date(`${value}T12:00:00`)
      return parsed.getFullYear() === year && parsed.getMonth() === month
    }
    return {
      month: formatMonthShort(date),
      revenue: invoices.filter((item) => item.status !== 'cancelled' && sameMonth(item.issueDate)).reduce((sum, item) => sum + item.amount, 0),
      cost: supplierInvoices.filter((item) => sameMonth(item.invoiceDate)).reduce((sum, item) => sum + item.amount, 0),
    }
  })
}
