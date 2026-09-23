'use client'

import { Select, Input } from '@/components/ui/form-controls'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'
import { StandardFormSheet } from '@/components/ui/sheet-system'
import { InteractiveRow } from '@/components/ui/interactive-row'
import { useBusinessStore } from '@/components/state/business-store'
import type { BillingModel } from '@/types/domain'
import { formatChf } from '@/lib/format/locale'
const chf = (value: number) => formatChf(value, { maximumFractionDigits: 0 })

export default function OrdersPage() {
  const store = useBusinessStore()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const requestedCustomer = searchParams.get('customer')
  const [customerId, setCustomerId] = useState(requestedCustomer && store.customers.some((item) => item.id === requestedCustomer) ? requestedCustomer : store.customers.find((item) => item.status === 'active')?.id ?? '')
  const [name, setName] = useState('')
  const [mandateRef, setMandateRef] = useState('')
  const [endCustomerName, setEndCustomerName] = useState('')
  const [budgetHours, setBudgetHours] = useState('160')
  const [salesRate, setSalesRate] = useState('165')
  const [costRate, setCostRate] = useState('105')
  const [billingModel, setBillingModel] = useState<BillingModel>('time')

  useEffect(() => {
    if (searchParams.get('new') !== '1') return
    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) setOpen(true)
    })
    const params = new URLSearchParams(searchParams.toString())
    params.delete('new')
    const suffix = params.toString() ? `?${params.toString()}` : ''
    router.replace(`${pathname}${suffix}`, { scroll: false })
    return () => { cancelled = true }
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
    <section className="page apple-page">
      <PageHeader eyebrow="LEISTUNG" title="Aufträge" description="Kundenaufträge, Budgets, Leistungserbringung und Abrechnung zentral steuern." action={<button className="button primary page-primary-action" onClick={() => setOpen(true)} aria-label="Auftrag erstellen" title="Auftrag erstellen"><Icon name="plus" size={16}/><span>Auftrag erstellen</span></button>} />
      <div className="data-list compact-overview-list">
        <div className="data-row order-grid data-head"><span>Auftrag</span><span>Budget</span><span>Verbraucht</span><span>Rest</span><span>Umsatz</span><span>Marge</span><span /></div>
        {store.orders.map((order) => {
          const linkedTimes = store.timeEntries.filter((entry) => entry.orderId === order.id)
          const used = linkedTimes.reduce((sum, entry) => sum + entry.hours, 0) || order.usedHours
          const revenue = linkedTimes.reduce((sum, entry) => sum + entry.hours * entry.salesRate, 0) || used * order.salesRate
          const cost = linkedTimes.reduce((sum, entry) => sum + entry.hours * entry.internalCostRate, 0) || used * order.costRate
          const margin = revenue ? Math.round(((revenue - cost) / revenue) * 100) : 0
          return <InteractiveRow className="data-row order-grid compact-overview-row" key={order.id} href={`/orders/${order.id}`} ariaLabel={`${order.name} öffnen`}><span className="primary-cell"><strong>{order.name}</strong><small className="desktop-row-detail">{order.customerName}{order.endCustomerName ? ` · Endkunde: ${order.endCustomerName}` : ''}</small><small className="mobile-row-summary">{order.customerName} · {used} / {order.budgetHours} h · {order.status === 'active' ? 'Aktiv' : order.status === 'paused' ? 'Pausiert' : 'Abgeschlossen'}</small></span><span className="overview-desktop-cell">{order.budgetHours} h</span><span className="overview-desktop-cell">{used} h</span><span className="overview-desktop-cell"><strong>{Math.max(0, order.budgetHours - used)} h</strong></span><span className="overview-desktop-cell">{chf(revenue)}</span><span className="overview-desktop-cell">{margin} %</span><span className="row-disclosure" aria-hidden="true"><Icon name="chevron" size={15}/></span></InteractiveRow>
        })}
      </div>
      {open && (
        <StandardFormSheet open title={<>Auftrag erstellen</>} description={<>Neues Mandat oder Projekt eröffnen.</>} onClose={() => setOpen(false)} onSubmit={save} formId="orders-page-sheet-1" footer={<><button type="button" className="button secondary" onClick={() => setOpen(false)}>Abbrechen</button><button type="submit" form="orders-page-sheet-1" className="button primary">Auftrag erstellen</button></>}><div className="form-grid">
              <label className="full"><span>Kunde *</span><Select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>{store.customers.filter((c) => c.status === 'active').map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</Select></label>
              <label className="full"><span>Auftragsname *</span><Input value={name} onChange={(e) => setName(e.target.value)} required/></label>
              <label><span>Mandats-/Vertragsreferenz</span><Input value={mandateRef} onChange={(e) => setMandateRef(e.target.value)}/></label>
              <label><span>Endkunde</span><Input value={endCustomerName} onChange={(e) => setEndCustomerName(e.target.value)} placeholder="Optional"/></label>
              <label><span>Budget Stunden *</span><Input type="number" min="0.25" step="0.25" value={budgetHours} onChange={(e) => setBudgetHours(e.target.value)} required/></label>
              <label><span>Verkaufssatz CHF/h *</span><Input type="number" min="0" step="0.05" value={salesRate} onChange={(e) => setSalesRate(e.target.value)} required/></label>
              <label><span>Interner Kostensatz CHF/h *</span><Input type="number" min="0" step="0.05" value={costRate} onChange={(e) => setCostRate(e.target.value)} required/></label>
              <label><span>Abrechnungsmodell *</span><Select value={billingModel} onChange={(e) => setBillingModel(e.target.value as BillingModel)}><option value="time">Nach Aufwand</option><option value="fixed">Pauschal</option><option value="retainer">Retainer</option><option value="milestone">Meilenstein</option><option value="mixed">Gemischt</option></Select></label>
            </div></StandardFormSheet>
      )}
    </section>
  )
}
