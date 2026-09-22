import { revenueSeries } from '@/lib/data/demo'

export function RevenueChart({ series = revenueSeries }: { series?: typeof revenueSeries } = {}) {
  const max = Math.max(...series.flatMap((item) => [item.revenue, item.cost]))

  const points = series
    .map((item, index) => {
      const x = series.length > 1 ? (index / (series.length - 1)) * 100 : 0
      const y = 100 - (item.revenue / max) * 82 - 8
      return `${x},${y}`
    })
    .join(' ')

  const costPoints = series
    .map((item, index) => {
      const x = series.length > 1 ? (index / (series.length - 1)) * 100 : 0
      const y = 100 - (item.cost / max) * 82 - 8
      return `${x},${y}`
    })
    .join(' ')

  return (
    <div className="line-chart">
      <div className="line-chart-legend">
        <span><i className="legend-primary" /> Umsatz</span>
        <span><i className="legend-secondary" /> Kosten</span>
      </div>

      <div className="line-chart-stage">
        <div className="line-chart-grid">
          <i /><i /><i /><i />
        </div>

        <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Umsatz und Kosten der letzten sechs Monate">
          <polyline className="chart-line secondary" points={costPoints} />
          <polyline className="chart-line primary" points={points} />
        </svg>
      </div>

      <div className="line-chart-labels">
        {series.map((item) => <span key={item.month}>{item.month}</span>)}
      </div>
    </div>
  )
}
