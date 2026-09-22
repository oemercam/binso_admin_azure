import type { FinancialTrendPoint } from '@/modules/dashboard/financial-trend'
import { formatChf } from '@/lib/format/locale'

export function RevenueChart({ series }: { series: FinancialTrendPoint[] }) {
  const safeSeries = series.length ? series : [{ key: 'empty', month: '–', revenue: 0, cost: 0 }]
  const max = Math.max(1, ...safeSeries.flatMap((item) => [item.revenue, item.cost]))
  const divisor = Math.max(1, safeSeries.length - 1)

  const points = safeSeries
    .map((item, index) => {
      const x = (index / divisor) * 100
      const y = 100 - (item.revenue / max) * 82 - 8
      return `${x},${y}`
    })
    .join(' ')

  const costPoints = safeSeries
    .map((item, index) => {
      const x = (index / divisor) * 100
      const y = 100 - (item.cost / max) * 82 - 8
      return `${x},${y}`
    })
    .join(' ')

  const revenueTotal = safeSeries.reduce((sum, item) => sum + item.revenue, 0)
  const costTotal = safeSeries.reduce((sum, item) => sum + item.cost, 0)

  return (
    <div className="line-chart">
      <div className="line-chart-legend">
        <span><i className="legend-primary" /> Umsatz</span>
        <span><i className="legend-secondary" /> Kosten</span>
      </div>

      <div className="line-chart-stage">
        <div className="line-chart-grid" aria-hidden="true">
          <i /><i /><i /><i />
        </div>

        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          role="img"
          aria-label={`Umsatz ${formatChf(revenueTotal)}, Kosten ${formatChf(costTotal)} in den dargestellten Monaten`}
        >
          <polyline className="chart-line secondary" points={costPoints} />
          <polyline className="chart-line primary" points={points} />
        </svg>
      </div>

      <div className="line-chart-labels">
        {safeSeries.map((item) => <span key={item.key}>{item.month}</span>)}
      </div>
    </div>
  )
}
