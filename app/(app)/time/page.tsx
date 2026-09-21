'use client'

import { useState } from 'react'
import { orders, timeEntries as initialEntries } from '@/lib/data/demo'
import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'

export default function TimePage() {
  const [entries, setEntries] = useState(initialEntries)
  const [open, setOpen] = useState(false)
  const [orderId, setOrderId] = useState(orders[0].id)
  const [hours, setHours] = useState('8')
  const [note, setNote] = useState('')

  const total = entries.reduce((sum, entry) => sum + entry.hours, 0)

  function save(event: React.FormEvent) {
    event.preventDefault()
    const order = orders.find((item) => item.id === orderId)
    if (!order) return
    setEntries((current) => [{
      id: `demo-${Date.now()}`,
      orderId,
      orderName: order.name,
      customerName: order.customerName,
      date: new Intl.DateTimeFormat('de-CH').format(new Date()),
      hours: Number(hours),
      note,
      billable: true,
      invoiced: false,
    }, ...current])
    setNote('')
    setOpen(false)
  }

  return (
    <section className="page">
      <PageHeader eyebrow="ZEIT" title="Zeiterfassung" description="Schnell erfassen, freigeben und später verrechnen." action={<button className="button primary" onClick={() => setOpen(true)}><Icon name="plus" size={16}/> Zeit erfassen</button>} />

      <div className="time-hero">
        <div><span>September</span><strong>{total} h</strong><small>von 168 h Soll</small></div>
        <div className="time-hero-progress"><i style={{ width: `${Math.min(100, (total / 168) * 100)}%` }}/></div>
        <div><span>Verrechenbar</span><strong>112 h</strong><small>89.9 %</small></div>
      </div>

      <div className="data-list">
        <div className="data-row time-grid data-head"><span>Datum</span><span>Auftrag</span><span>Tätigkeit</span><span>Stunden</span><span>Abrechnung</span><span /></div>
        {entries.map((entry) => (
          <div className="data-row time-grid" key={entry.id}>
            <span>{entry.date}</span>
            <span className="primary-cell"><strong>{entry.orderName}</strong><small>{entry.customerName}</small></span>
            <span>{entry.note || '–'}</span>
            <span><strong>{entry.hours} h</strong></span>
            <span className={entry.invoiced ? 'status paid' : 'status active'}>{entry.invoiced ? 'Verrechnet' : 'Offen'}</span>
            <button className="row-link"><Icon name="chevron" size={15}/></button>
          </div>
        ))}
      </div>

      <div className="mobile-record-list">
        {entries.map((entry) => (
          <article className="mobile-record" key={entry.id}>
            <div className="record-top"><span><strong>{entry.hours} h · {entry.note || 'Zeiteintrag'}</strong><small>{entry.orderName}</small></span><span>{entry.date}</span></div>
            <div className="record-meta"><span>{entry.customerName}</span><span>{entry.invoiced ? 'Verrechnet' : 'Offen'}</span></div>
          </article>
        ))}
      </div>

      {open && (
        <div className="overlay-layer sheet-layer" onMouseDown={() => setOpen(false)}>
          <form className="form-sheet" onSubmit={save} onMouseDown={(event) => event.stopPropagation()}>
            <div className="sheet-grabber"/>
            <div className="sheet-heading"><div><strong>Zeit erfassen</strong><span>Schnelleingabe</span></div><button type="button" className="icon-button" onClick={() => setOpen(false)}><Icon name="close" size={17}/></button></div>
            <div className="form-grid">
              <label className="full"><span>Auftrag</span><select value={orderId} onChange={(e) => setOrderId(e.target.value)}>{orders.map((order) => <option key={order.id} value={order.id}>{order.name} · {order.customerName}</option>)}</select></label>
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
