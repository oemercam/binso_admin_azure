'use client'

import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'
import { useBusinessStore } from '@/components/state/business-store'

const chf = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 })

export default function OrdersPage() {
  const store = useBusinessStore()
  return (
    <section className="page">
      <PageHeader eyebrow="PROJEKTE" title="Aufträge" description="Mandate, WTO-Bezug, Mitarbeitende, externe Leistungen, Budget und Abrechnung." action={<button className="button primary"><Icon name="plus" size={16}/> Auftrag erstellen</button>} />
      <div className="data-list">
        <div className="data-row order-grid data-head"><span>Auftrag</span><span>Budget</span><span>Verbraucht</span><span>Rest</span><span>Umsatz</span><span>Marge</span><span /></div>
        {store.orders.map((order) => {
          const linkedTimes = store.timeEntries.filter((entry) => entry.orderId === order.id)
          const used = linkedTimes.reduce((sum, entry) => sum + entry.hours, 0) || order.usedHours
          const revenue = linkedTimes.reduce((sum, entry) => sum + entry.hours * entry.salesRate, 0) || used * order.salesRate
          const cost = linkedTimes.reduce((sum, entry) => sum + entry.hours * entry.internalCostRate, 0) || used * order.costRate
          const margin = revenue ? Math.round(((revenue - cost) / revenue) * 100) : 0
          return <div className="data-row order-grid" key={order.id}><span className="primary-cell"><strong>{order.name}</strong><small>{order.customerName}{order.endCustomerName ? ` · Endkunde: ${order.endCustomerName}` : ''}</small></span><span>{order.budgetHours} h</span><span>{used} h</span><span><strong>{Math.max(0, order.budgetHours - used)} h</strong></span><span>{chf.format(revenue)}</span><span>{margin} %</span><Link className="row-link" href={`/orders/${order.id}`} aria-label={`${order.name} öffnen`}><Icon name="chevron" size={15}/></Link></div>
        })}
      </div>
      <div className="mobile-record-list">{store.orders.map((order) => { const used = store.timeEntries.filter((entry) => entry.orderId === order.id).reduce((sum, entry) => sum + entry.hours, 0) || order.usedHours; const percentage = Math.round((used / order.budgetHours) * 100); return <article className="mobile-record" key={order.id}><div className="record-top"><span><strong>{order.name}</strong><small>{order.customerName}</small></span><span>{percentage}%</span></div>{order.endCustomerName && <p className="record-note">Endkunde: {order.endCustomerName}</p>}<div className="mobile-progress"><i style={{ width: `${Math.min(100, percentage)}%` }}/></div><div className="record-meta"><span>{used} / {order.budgetHours} h</span><span>{Math.max(0, order.budgetHours - used)} h Rest</span></div></article> })}</div>
    </section>
  )
}
