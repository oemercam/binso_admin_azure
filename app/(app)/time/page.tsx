'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'
import { useBusinessStore } from '@/components/state/business-store'
import type { WorkerType } from '@/types/domain'

export default function TimePage() {
  const router = useRouter()
  const store = useBusinessStore()
  const [open, setOpen] = useState(false)
  const [orderId, setOrderId] = useState(store.orders[0]?.id ?? '')
  const [hours, setHours] = useState('8')
  const [note, setNote] = useState('')
  const [personId, setPersonId] = useState('emp-001')
  const [personName, setPersonName] = useState('Ömer Cam')
  const [workerType, setWorkerType] = useState<WorkerType>('employee')
  const [selected, setSelected] = useState<string[]>([])

  const total = store.timeEntries.reduce((sum, entry) => sum + entry.hours, 0)
  const billable = store.timeEntries.filter((entry) => entry.billable).reduce((sum, entry) => sum + entry.hours, 0)
  const unbilled = store.timeEntries.filter((entry) => entry.billable && entry.approved && !entry.invoicedInvoiceId)

  const selectedEntries = useMemo(
    () => unbilled.filter((entry) => selected.includes(entry.id)),
    [selected, unbilled],
  )

  const selectedCustomerIds = new Set(selectedEntries.map((entry) => entry.customerId))
  const selectedOrderIds = new Set(selectedEntries.map((entry) => entry.orderId))
  const canInvoice = selectedEntries.length > 0 && selectedCustomerIds.size === 1 && selectedOrderIds.size === 1

  function save(event: React.FormEvent) {
    event.preventDefault()
    const order = store.orders.find((item) => item.id === orderId)
    if (!order) return
    const isExternal = workerType === 'external'
    store.addTimeEntry({
      id: `time-${Date.now()}`,
      orderId,
      orderName: order.name,
      customerId: order.customerId,
      customerName: order.customerName,
      personId,
      personName,
      workerType,
      date: new Date().toISOString().slice(0, 10),
      hours: Number(hours),
      note,
      billable: true,
      approved: true,
      salesRate: workerType === 'hourly_employee' ? 145 : order.salesRate,
      internalCostRate: isExternal ? 125 : workerType === 'hourly_employee' ? 72 : order.costRate,
    })
    setNote('')
    setOpen(false)
  }

  function createInvoiceFromSelected() {
    if (!canInvoice) return
    const first = selectedEntries[0]
    const invoice = store.createInvoiceFromTimes({
      customerId: first.customerId,
      orderId: first.orderId,
      timeEntryIds: selectedEntries.map((entry) => entry.id),
      period: 'September 2026',
    })
    if (invoice) router.push('/invoices')
  }

  return (
    <section className="page">
      <PageHeader
        eyebrow="ZEIT"
        title="Zeiterfassung"
        description="Zeiten erfassen, freigeben und direkt in Rechnungspositionen übernehmen."
        action={<button className="button primary" onClick={() => setOpen(true)}><Icon name="plus" size={16}/> Zeit erfassen</button>}
      />

      <div className="time-hero">
        <div><span>September</span><strong>{total} h</strong><small>erfasst</small></div>
        <div className="time-hero-progress"><i style={{ width: `${Math.min(100, (total / 168) * 100)}%` }}/></div>
        <div><span>Verrechenbar</span><strong>{billable} h</strong><small>{unbilled.reduce((sum, entry) => sum + entry.hours, 0)} h noch offen</small></div>
      </div>

      <div className="selection-bar">
        <div>
          <strong>{selectedEntries.length} Zeiten ausgewählt</strong>
          <span>{canInvoice ? 'Bereit für Rechnung' : selectedEntries.length ? 'Für eine Rechnung nur Zeiten desselben Auftrags auswählen' : 'Offene verrechenbare Zeiten markieren'}</span>
        </div>
        <button className="button primary" disabled={!canInvoice} onClick={createInvoiceFromSelected}><Icon name="invoices" size={15}/> Rechnung aus Zeiten</button>
      </div>

      <div className="data-list">
        <div className="data-row time-grid-v5 data-head"><span/><span>Datum</span><span>Auftrag / Person</span><span>Tätigkeit</span><span>Stunden</span><span>Abrechnung</span></div>
        {store.timeEntries.map((entry) => {
          const selectable = entry.billable && entry.approved && !entry.invoicedInvoiceId
          return (
            <div className="data-row time-grid-v5" key={entry.id}>
              <span><input type="checkbox" disabled={!selectable} checked={selected.includes(entry.id)} onChange={(e) => setSelected((current) => e.target.checked ? [...current, entry.id] : current.filter((id) => id !== entry.id))}/></span>
              <span>{formatDate(entry.date)}</span>
              <span className="primary-cell"><strong>{entry.orderName}</strong><small>{entry.personName} · {workerLabel(entry.workerType)}</small></span>
              <span>{entry.note || '–'}</span>
              <span><strong>{entry.hours} h</strong></span>
              <span className={entry.invoicedInvoiceId ? 'status paid' : 'status active'}>{entry.invoicedInvoiceId ? 'Verrechnet' : 'Offen'}</span>
            </div>
          )
        })}
      </div>

      <div className="mobile-record-list">
        {store.timeEntries.map((entry) => {
          const selectable = entry.billable && entry.approved && !entry.invoicedInvoiceId
          return (
            <article className="mobile-record" key={entry.id}>
              <div className="record-top">
                <span><strong>{entry.hours} h · {entry.note || 'Zeiteintrag'}</strong><small>{entry.orderName}</small></span>
                {selectable && <input type="checkbox" checked={selected.includes(entry.id)} onChange={(e) => setSelected((current) => e.target.checked ? [...current, entry.id] : current.filter((id) => id !== entry.id))}/>} 
              </div>
              <div className="record-meta"><span>{entry.personName}</span><span>{entry.invoicedInvoiceId ? 'Verrechnet' : 'Offen'}</span></div>
            </article>
          )
        })}
      </div>

      {open && (
        <div className="overlay-layer sheet-layer" onMouseDown={() => setOpen(false)}>
          <form className="form-sheet" onSubmit={save} onMouseDown={(event) => event.stopPropagation()}>
            <div className="sheet-grabber"/>
            <div className="sheet-heading"><div><strong>Zeit erfassen</strong><span>Direkt einem Auftrag zuordnen</span></div><button type="button" className="icon-button" onClick={() => setOpen(false)}><Icon name="close" size={17}/></button></div>
            <div className="form-grid">
              <label className="full"><span>Auftrag</span><select value={orderId} onChange={(e) => setOrderId(e.target.value)}>{store.orders.map((order) => <option key={order.id} value={order.id}>{order.name} · {order.customerName}</option>)}</select></label>
              <label><span>Leistung durch</span><select value={workerType} onChange={(e) => { const type = e.target.value as WorkerType; setWorkerType(type); if (type === 'employee') { setPersonId('emp-001'); setPersonName('Ömer Cam') } if (type === 'hourly_employee') { setPersonId('emp-002'); setPersonName('Nina Keller') } if (type === 'external') { setPersonId('ext-001'); setPersonName('Dario Meier / Meier Cloud Consulting GmbH') } }}><option value="employee">Festangestellt / Inhaber</option><option value="hourly_employee">Mitarbeiter im Stundenlohn</option><option value="external">Externe Firma</option></select></label>
              <label><span>Person</span><input value={personName} onChange={(e) => setPersonName(e.target.value)} /></label>
              <label><span>Stunden</span><input inputMode="decimal" value={hours} onChange={(e) => setHours(e.target.value)} /></label>
              <label><span>Verrechenbar</span><select defaultValue="Ja"><option>Ja</option><option>Nein</option></select></label>
              <label className="full"><span>Beschreibung</span><textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Was wurde gemacht?" /></label>
            </div>
            <div className="sheet-actions"><button type="button" className="button secondary" onClick={() => setOpen(false)}>Abbrechen</button><button className="button primary">Speichern</button></div>
          </form>
        </div>
      )}
    </section>
  )
}

function workerLabel(value: WorkerType) {
  if (value === 'hourly_employee') return 'Stundenlohn'
  if (value === 'external') return 'Externe Firma'
  return 'Intern'
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('de-CH').format(new Date(`${value}T12:00:00`))
}
