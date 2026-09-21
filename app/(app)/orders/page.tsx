'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'
import { useBusinessStore } from '@/components/state/business-store'
import type { BillingModel } from '@/types/domain'

const chf = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 })

export default function OrdersPage() {
  const store = useBusinessStore()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const [customerId, setCustomerId] = useState(store.customers[0]?.id ?? '')
  const [name, setName] = useState('')
  const [mandateRef, setMandateRef] = useState('')
  const [endCustomerName, setEndCustomerName] = useState('')
  const [budgetHours, setBudgetHours] = useState('160')
  const [salesRate, setSalesRate] = useState('165')
  const [costRate, setCostRate] = useState('105')
  const [billingModel, setBillingModel] = useState<BillingModel>('time')

  useEffect(() => {
    if (searchParams.get('new') !== '1') return
    setOpen(true)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('new')
    const suffix = params.toString() ? `?${params.toString()}` : ''
    router.replace(`${pathname}${suffix}`, { scroll: false })
  }, [pathname, router, searchParams])

  function save(event: React.FormEvent) {
    event.preventDefault()
    const customer = store.customers.find((item) => item.id === customerId)
    if (!customer) return
    const order = store.createOrder({
      customerId: customer.id,
      customerName: customer.name,
      endCustomerName: endCustomerName.trim() || undefined,
      primeContractorName: customer.name,
      name: name.trim(),
      mandateRef: mandateRef.trim() || undefined,
      budgetHours: Number(budgetHours),
      salesRate: Number(salesRate),
      costRate: Number(costRate),
      billingModel,
      status: 'active',
    })
    setOpen(false)
    router.push(`/orders/${order.id}`)
  }

  return (
    <section className="page">
      <PageHeader eyebrow="PROJEKTE" title="Aufträge" description="Mandate, WTO-Bezug, Mitarbeitende, externe Leistungen, Budget und Abrechnung." action={<button className="button primary" onClick={() => setOpen(true)}><Icon name="plus" size={16}/> Auftrag erstellen</button>} />
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

      <div className="mobile-record-list">
        {store.orders.map((order) => {
          const used = store.timeEntries.filter((entry) => entry.orderId === order.id).reduce((sum, entry) => sum + entry.hours, 0) || order.usedHours
          return <Link className="mobile-record" href={`/orders/${order.id}`} key={order.id}><div className="record-top"><span><strong>{order.name}</strong><small>{order.customerName}</small></span><Icon name="chevron" size={15}/></div><div className="record-meta"><span>{used} / {order.budgetHours} h</span><span>{Math.max(0, order.budgetHours - used)} h Rest</span></div></Link>
        })}
      </div>

      {open && (
        <div className="overlay-layer sheet-layer" onMouseDown={() => setOpen(false)}>
          <form className="form-sheet mobile-fullscreen-sheet" onSubmit={save} onMouseDown={(e) => e.stopPropagation()}>
            <div className="sheet-grabber"/>
            <div className="sheet-heading"><div><strong>Auftrag erstellen</strong><span>Neues Mandat oder Projekt eröffnen.</span></div><button type="button" className="icon-button" onClick={() => setOpen(false)}><Icon name="close" size={17}/></button></div>
            <div className="form-grid">
              <label className="full"><span>Kunde *</span><select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>{store.customers.filter((c) => c.status === 'active').map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
              <label className="full"><span>Auftragsname *</span><input value={name} onChange={(e) => setName(e.target.value)} required/></label>
              <label><span>Mandats-/Vertragsreferenz</span><input value={mandateRef} onChange={(e) => setMandateRef(e.target.value)}/></label>
              <label><span>Endkunde</span><input value={endCustomerName} onChange={(e) => setEndCustomerName(e.target.value)} placeholder="Optional"/></label>
              <label><span>Budget Stunden *</span><input type="number" min="0.25" step="0.25" value={budgetHours} onChange={(e) => setBudgetHours(e.target.value)} required/></label>
              <label><span>Verkaufssatz CHF/h *</span><input type="number" min="0" step="0.05" value={salesRate} onChange={(e) => setSalesRate(e.target.value)} required/></label>
              <label><span>Interner Kostensatz CHF/h *</span><input type="number" min="0" step="0.05" value={costRate} onChange={(e) => setCostRate(e.target.value)} required/></label>
              <label><span>Abrechnungsmodell *</span><select value={billingModel} onChange={(e) => setBillingModel(e.target.value as BillingModel)}><option value="time">Nach Aufwand</option><option value="fixed">Pauschal</option><option value="mixed">Gemischt</option></select></label>
            </div>
            <div className="sheet-actions"><button type="button" className="button secondary" onClick={() => setOpen(false)}>Abbrechen</button><button className="button primary">Auftrag erstellen</button></div>
          </form>
        </div>
      )}
    </section>
  )
}
