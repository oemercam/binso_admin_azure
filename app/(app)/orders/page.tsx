'use client'

import { SearchField, Select, Input } from '@/components/ui/form-controls'
import { formatChf, normalizeSearch } from '@/lib/format/locale'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'
import { StandardFormSheet } from '@/components/ui/sheet-system'
import { InteractiveRow } from '@/components/ui/interactive-row'
import { useFeedback } from '@/components/ui/feedback'
import { useBusinessStore } from '@/components/state/business-store'
import { useCurrentUser } from '@/components/state/current-user'
import type { BillingModel } from '@/types/domain'
import { statusPresentation } from '@/components/ui/status-badge'
import { calculateOrderMetrics } from '@/modules/orders/metrics'
import { canManageOperations } from '@/lib/auth/capabilities'


export default function OrdersPage() {
  const store = useBusinessStore()
  const feedback = useFeedback()
  const user = useCurrentUser()
  const canManageOrders = canManageOperations(user.role)
  const currentEmployee = store.employees.find((item) => item.email.toLowerCase() === user.email.toLowerCase())
  const assignedOrderIds = new Set(store.orderAssignmentRules.filter((rule) => rule.active && currentEmployee && rule.personId === currentEmployee.id).map((rule) => rule.orderId))
  const visibleOrders = user.role === 'employee' ? store.orders.filter((order) => assignedOrderIds.has(order.id)) : store.orders
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const [customerId, setCustomerId] = useState(store.customers[0]?.id ?? '')
  const [name, setName] = useState('')
  const [reference, setReference] = useState('')
  const [endCustomerName, setEndCustomerName] = useState('')
  const [budgetHours, setBudgetHours] = useState('160')
  const [salesRate, setSalesRate] = useState('165')
  const [costRate, setCostRate] = useState('105')
  const [billingModel, setBillingModel] = useState<BillingModel>('time')
  const [query, setQuery] = useState('')
  const filteredOrders = useMemo(() => { const q = normalizeSearch(query); return q ? visibleOrders.filter((order) => normalizeSearch(`${order.name} ${order.customerName} ${order.mandateRef ?? ''} ${order.procurementRef ?? ''}`).includes(q)) : visibleOrders }, [query, visibleOrders])

  useEffect(() => {
    if (searchParams.get('new') !== '1' || !canManageOrders) return
    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) setOpen(true)
    })
    const params = new URLSearchParams(searchParams.toString())
    params.delete('new')
    const suffix = params.toString() ? `?${params.toString()}` : ''
    router.replace(`${pathname}${suffix}`, { scroll: false })
    return () => { cancelled = true }
  }, [canManageOrders, pathname, router, searchParams])

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
      mandateRef: reference.trim() || undefined,
      budgetHours: Number(budgetHours),
      salesRate: Number(salesRate),
      costRate: Number(costRate),
      billingModel,
      status: 'active',
    })
    feedback.success('Auftrag erstellt.')
    setOpen(false)
    router.push(`/orders/${order.id}`)
  }

  return (
    <section className="page">
      <PageHeader eyebrow="AUFTRÄGE" title="Aufträge" description="Aufträge, Leistungen, Budget und Abrechnung verwalten." action={canManageOrders ? <button className="button primary page-primary-action" onClick={() => setOpen(true)} aria-label="Auftrag erstellen" title="Auftrag erstellen"><Icon name="plus" size={16}/><span>Auftrag erstellen</span></button> : undefined} />
      <div className="module-toolbar"><SearchField value={query} onValueChange={setQuery} placeholder="Aufträge durchsuchen" aria-label="Aufträge durchsuchen"/><span className="toolbar-meta">{filteredOrders.length} Aufträge</span></div><div className="data-list compact-overview-list">
        <div className={`data-row order-grid${user.role === 'employee' ? ' employee-order-grid' : ''} data-head`}><span>Auftrag</span><span>Budget</span><span>Verbraucht</span><span>Rest</span>{user.role !== 'employee' && <><span>Umsatz</span><span>Marge</span></>}<span /></div>
        {filteredOrders.map((order) => {
          const metrics = calculateOrderMetrics(order, store.timeEntries)
          return <InteractiveRow className={`data-row order-grid${user.role === 'employee' ? ' employee-order-grid' : ''} compact-overview-row`} key={order.id} href={`/orders/${order.id}`} ariaLabel={`${order.name} öffnen`}><span className="primary-cell"><strong>{order.name}</strong><small className="desktop-row-detail">{order.customerName}{order.endCustomerName ? ` · Endkunde: ${order.endCustomerName}` : ''}</small><small className="mobile-row-summary">{order.customerName} · {metrics.usedHours} / {order.budgetHours} h · {statusPresentation(order.status).label}</small></span><span className="overview-desktop-cell">{order.budgetHours} h</span><span className="overview-desktop-cell">{metrics.usedHours} h</span><span className="overview-desktop-cell"><strong>{metrics.remainingHours} h</strong></span>{user.role !== 'employee' && <><span className="overview-desktop-cell">{formatChf(metrics.revenue)}</span><span className="overview-desktop-cell">{metrics.marginPercent} %</span></>}<span className="row-disclosure" aria-hidden="true"><Icon name="chevron" size={15}/></span></InteractiveRow>
        })}
      </div>

      <div className="mobile-record-list mobile-order-list">
        {filteredOrders.map((order) => {
          const metrics = calculateOrderMetrics(order, store.timeEntries)
          return <Link className="mobile-record" href={`/orders/${order.id}`} key={order.id}><div className="record-top"><span><strong>{order.name}</strong><small>{order.customerName}</small></span><Icon name="chevron" size={15}/></div><div className="record-meta"><span>{metrics.usedHours} / {order.budgetHours} h</span><span>{metrics.remainingHours} h Rest</span></div></Link>
        })}
      </div>

      {open && canManageOrders && (
        <StandardFormSheet open title={<>Auftrag erstellen</>} description={<>Auftrag mit den wichtigsten Angaben erfassen.</>} onClose={() => setOpen(false)} onSubmit={save} formId="orders-page-sheet-1" footer={<><button type="button" className="button secondary" onClick={() => setOpen(false)}>Abbrechen</button><button type="submit" form="orders-page-sheet-1" className="button primary">Auftrag erstellen</button></>}><div className="form-grid">
              <label className="full"><span>Kunde *</span><Select aria-label="Kunde" searchable searchPlaceholder="Kunden durchsuchen" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>{store.customers.filter((c) => c.status === 'active').map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</Select></label>
              <label className="full"><span>Auftragsname *</span><Input value={name} onChange={(e) => setName(e.target.value)} required/></label>
              <label><span>Referenz</span><Input value={reference} onChange={(e) => setReference(e.target.value)}/></label>
              <label><span>Endkunde</span><Input value={endCustomerName} onChange={(e) => setEndCustomerName(e.target.value)} placeholder="Optional"/></label>
              <label><span>Budget Stunden *</span><Input type="number" min="0.25" step="0.25" value={budgetHours} onChange={(e) => setBudgetHours(e.target.value)} required/></label>
              <label><span>Verkaufssatz CHF/h *</span><Input type="number" min="0" step="0.05" value={salesRate} onChange={(e) => setSalesRate(e.target.value)} required/></label>
              <label><span>Interner Kostensatz CHF/h *</span><Input type="number" min="0" step="0.05" value={costRate} onChange={(e) => setCostRate(e.target.value)} required/></label>
              <label><span>Abrechnungsmodell *</span><Select aria-label="Abrechnungsmodell" value={billingModel} onChange={(e) => setBillingModel(e.target.value as BillingModel)}><option value="time">Nach Aufwand</option><option value="fixed">Pauschal</option><option value="mixed">Gemischt</option></Select></label>
            </div></StandardFormSheet>
      )}
    </section>
  )
}
