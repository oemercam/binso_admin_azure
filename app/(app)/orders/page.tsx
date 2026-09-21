import { orders } from '@/lib/data/demo'
import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'

const chf = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 })

export default function OrdersPage() {
  return (
    <section className="page">
      <PageHeader eyebrow="PROJEKTE" title="Aufträge" description="Budget, Leistung, Marge und Abrechnung im Blick." action={<button className="button primary"><Icon name="plus" size={16}/> Auftrag erstellen</button>} />

      <div className="data-list">
        <div className="data-row order-grid data-head"><span>Auftrag</span><span>Budget</span><span>Verbraucht</span><span>Rest</span><span>Umsatz</span><span>Marge</span><span /></div>
        {orders.map((order) => {
          const remaining = order.budgetHours - order.usedHours
          const revenue = order.usedHours * order.salesRate
          const margin = Math.round(((order.salesRate - order.costRate) / order.salesRate) * 100)
          return (
            <div className="data-row order-grid" key={order.id}>
              <span className="primary-cell"><strong>{order.name}</strong><small>{order.customerName}</small></span>
              <span>{order.budgetHours} h</span>
              <span>{order.usedHours} h</span>
              <span><strong>{remaining} h</strong></span>
              <span>{chf.format(revenue)}</span>
              <span>{margin} %</span>
              <button className="row-link"><Icon name="chevron" size={15}/></button>
            </div>
          )
        })}
      </div>

      <div className="mobile-record-list">
        {orders.map((order) => {
          const percentage = Math.round((order.usedHours / order.budgetHours) * 100)
          return (
            <article className="mobile-record" key={order.id}>
              <div className="record-top"><span><strong>{order.name}</strong><small>{order.customerName}</small></span><span>{percentage}%</span></div>
              <div className="mobile-progress"><i style={{ width: `${percentage}%` }}/></div>
              <div className="record-meta"><span>{order.usedHours} / {order.budgetHours} h</span><span>{order.budgetHours - order.usedHours} h Rest</span></div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
