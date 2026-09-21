'use client'

import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'
import { useBusinessStore } from '@/components/state/business-store'
import type { Invoice, InvoiceStatus, Payment } from '@/types/domain'

const chf = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', minimumFractionDigits: 2, maximumFractionDigits: 2 })

const label: Record<InvoiceStatus, string> = {
  draft: 'Entwurf', sent: 'Versendet', partial: 'Teilbezahlt', paid: 'Bezahlt', overdue: 'Überfällig', cancelled: 'Storniert',
}

export default function InvoicesPage() {
  const store = useBusinessStore()
  const [preview, setPreview] = useState<Invoice | null>(null)
  const [payment, setPayment] = useState<Invoice | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<Payment['method']>('Bank')
  const [builderOpen, setBuilderOpen] = useState(false)
  const [orderId, setOrderId] = useState(store.orders[0]?.id ?? '')
  const [selected, setSelected] = useState<string[]>([])

  const selectedOrder = store.orders.find((order) => order.id === orderId)
  const eligibleTimes = useMemo(() => store.timeEntries.filter((entry) => entry.orderId === orderId && entry.billable && entry.approved && !entry.invoicedInvoiceId), [store.timeEntries, orderId])
  const selectedTimes = eligibleTimes.filter((entry) => selected.includes(entry.id))
  const draftSubtotal = selectedTimes.reduce((sum, entry) => sum + entry.hours * entry.salesRate, 0)

  function savePayment(event: React.FormEvent) {
    event.preventDefault()
    if (!payment) return
    store.recordPayment(payment.id, Number(paymentAmount), paymentMethod, new Date().toISOString().slice(0, 10))
    setPayment(null)
    setPaymentAmount('')
  }

  function createInvoice() {
    if (!selectedOrder || !selectedTimes.length) return
    const invoice = store.createInvoiceFromTimes({
      customerId: selectedOrder.customerId,
      orderId: selectedOrder.id,
      timeEntryIds: selectedTimes.map((entry) => entry.id),
      period: 'September 2026',
    })
    if (invoice) {
      setBuilderOpen(false)
      setSelected([])
      setPreview(invoice)
    }
  }

  return (
    <section className="page">
      <PageHeader eyebrow="FAKTURIERUNG" title="Rechnungen" description="Zeiten auswählen, Positionen prüfen, Rechnung erstellen und Zahlungen verbuchen." action={<button className="button primary" onClick={() => setBuilderOpen(true)}><Icon name="plus" size={16}/> Rechnung erstellen</button>} />

      <div className="workflow-strip invoice-workflow">
        <div><strong>{chf.format(store.invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + i.amount - i.paidAmount, 0))}</strong><span>Offen</span></div>
        <div><strong>{chf.format(store.invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.paidAmount, 0))}</strong><span>Bezahlt</span></div>
        <div><strong>{store.timeEntries.filter((entry) => entry.billable && entry.approved && !entry.invoicedInvoiceId).reduce((sum, entry) => sum + entry.hours, 0)} h</strong><span>Noch nicht verrechnet</span></div>
      </div>

      <div className="data-list">
        <div className="data-row invoice-grid data-head"><span>Rechnung</span><span>Kunde</span><span>Fällig</span><span>Betrag</span><span>Status</span><span /></div>
        {store.invoices.map((invoice) => (
          <div className="data-row invoice-grid" key={invoice.id}>
            <span className="primary-cell"><strong>{invoice.number}</strong><small>{invoice.orderName || invoice.period}</small></span>
            <span>{invoice.customerName}</span>
            <span>{formatDate(invoice.due)}</span>
            <span><strong>{chf.format(invoice.amount)}</strong><small>{invoice.lines.length} Positionen</small></span>
            <span className={`status ${invoice.status}`}>{label[invoice.status]}</span>
            <div className="row-actions">
              {invoice.status !== 'paid' && invoice.status !== 'cancelled' && <button className="row-link" title="Zahlung erfassen" onClick={() => { setPayment(invoice); setPaymentAmount(String(Math.round((invoice.amount - invoice.paidAmount) * 100) / 100)) }}><Icon name="credit-card" size={15}/></button>}
              <button className="row-link" title="Vorschau" onClick={() => setPreview(invoice)}><Icon name="chevron" size={15}/></button>
            </div>
          </div>
        ))}
      </div>

      <div className="mobile-record-list">
        {store.invoices.map((invoice) => (
          <article className="mobile-record" key={invoice.id} onClick={() => setPreview(invoice)}>
            <div className="record-top"><span><strong>{invoice.number}</strong><small>{invoice.customerName}</small></span><span className={`status ${invoice.status}`}>{label[invoice.status]}</span></div>
            <div className="record-meta"><span>{chf.format(invoice.amount)} · {invoice.lines.length} Pos.</span><span>fällig {formatDate(invoice.due)}</span></div>
          </article>
        ))}
      </div>

      {builderOpen && (
        <div className="overlay-layer sheet-layer" onMouseDown={() => setBuilderOpen(false)}>
          <div className="form-sheet invoice-builder-sheet" onMouseDown={(event) => event.stopPropagation()}>
            <div className="sheet-grabber"/>
            <div className="sheet-heading"><div><strong>Rechnung erstellen</strong><span>Offene Zeiterfassungen als Positionen übernehmen</span></div><button type="button" className="icon-button" onClick={() => setBuilderOpen(false)}><Icon name="close" size={17}/></button></div>
            <div className="form-grid">
              <label className="full"><span>Auftrag</span><select value={orderId} onChange={(e) => { setOrderId(e.target.value); setSelected([]) }}>{store.orders.map((order) => <option key={order.id} value={order.id}>{order.name} · {order.customerName}</option>)}</select></label>
            </div>

            <div className="invoice-source-list">
              <div className="invoice-source-head"><strong>Offene Zeiten</strong><span>{eligibleTimes.length} Einträge</span></div>
              {eligibleTimes.length === 0 && <div className="empty-state">Für diesen Auftrag gibt es keine offenen, freigegebenen Zeiten.</div>}
              {eligibleTimes.map((entry) => (
                <label className="invoice-source-row" key={entry.id}>
                  <input type="checkbox" checked={selected.includes(entry.id)} onChange={(e) => setSelected((current) => e.target.checked ? [...current, entry.id] : current.filter((id) => id !== entry.id))}/>
                  <span><strong>{formatDate(entry.date)} · {entry.personName}</strong><small>{entry.note}</small></span>
                  <span><strong>{entry.hours} h</strong><small>{chf.format(entry.salesRate)}/h</small></span>
                  <strong>{chf.format(entry.hours * entry.salesRate)}</strong>
                </label>
              ))}
            </div>

            <div className="invoice-builder-total"><span>Zwischentotal exkl. MWST</span><strong>{chf.format(draftSubtotal)}</strong></div>
            <div className="sheet-actions"><button type="button" className="button secondary" onClick={() => setBuilderOpen(false)}>Abbrechen</button><button type="button" className="button primary" disabled={!selectedTimes.length} onClick={createInvoice}>Rechnung als Entwurf erstellen</button></div>
          </div>
        </div>
      )}

      {preview && (
        <div className="overlay-layer" onMouseDown={() => setPreview(null)}>
          <div className="document-preview-shell" onMouseDown={(event) => event.stopPropagation()}>
            <div className="preview-toolbar"><div><strong>{preview.number}</strong><span>{preview.customerName}</span></div><div><button className="icon-button"><Icon name="download" size={16}/></button><button className="icon-button" onClick={() => setPreview(null)}><Icon name="close" size={16}/></button></div></div>
            <div className="document-preview invoice-document">
              <header><div className="preview-logo">BINSO</div><div><strong>RECHNUNG</strong><span>{preview.number}</span></div></header>
              <section><small>Rechnung an</small><strong>{preview.customerName}</strong><p>{preview.orderName || preview.period}</p></section>
              <div className="invoice-lines detailed">
                <div className="invoice-line invoice-line-head"><span>Position</span><span>Menge</span><span>Preis</span><span>Betrag</span></div>
                {preview.lines.map((line) => <div className="invoice-line" key={line.id}><span>{line.description}</span><span>{line.quantity} {line.unit}</span><span>{chf.format(line.unitPrice)}</span><strong>{chf.format(line.quantity * line.unitPrice)}</strong></div>)}
              </div>
              <div className="preview-totals"><div><span>Zwischentotal</span><strong>{chf.format(preview.subtotal)}</strong></div><div><span>MWST</span><strong>{chf.format(preview.vatAmount)}</strong></div><div className="grand-total"><span>Total</span><strong>{chf.format(preview.amount)}</strong></div></div>
              <footer>Rechnungsdatum {formatDate(preview.issueDate)} · Fällig am {formatDate(preview.due)}</footer>
            </div>
            <div className="preview-actions"><button className="button secondary"><Icon name="edit" size={15}/> Bearbeiten</button><button className="button secondary"><Icon name="send" size={15}/> Senden</button>{preview.status !== 'paid' && <button className="button primary" onClick={() => { setPayment(preview); setPreview(null); setPaymentAmount(String(Math.round((preview.amount - preview.paidAmount) * 100) / 100)) }}><Icon name="credit-card" size={15}/> Zahlung erfassen</button>}</div>
          </div>
        </div>
      )}

      {payment && (
        <div className="overlay-layer sheet-layer" onMouseDown={() => setPayment(null)}>
          <form className="form-sheet compact-sheet" onSubmit={savePayment} onMouseDown={(event) => event.stopPropagation()}>
            <div className="sheet-grabber"/>
            <div className="sheet-heading"><div><strong>Zahlung erfassen</strong><span>{payment.number} · {payment.customerName}</span></div><button type="button" className="icon-button" onClick={() => setPayment(null)}><Icon name="close" size={17}/></button></div>
            <div className="form-grid">
              <label><span>Betrag CHF</span><input inputMode="decimal" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} /></label>
              <label><span>Zahlungsdatum</span><input type="date" defaultValue={new Date().toISOString().slice(0, 10)}/></label>
              <label className="full"><span>Zahlungsart</span><select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as Payment['method'])}><option>Bank</option><option>Bar</option><option>Kreditkarte</option><option>Sonstige</option></select></label>
            </div>
            <div className="sheet-actions"><button type="button" className="button secondary" onClick={() => setPayment(null)}>Abbrechen</button><button className="button primary">Zahlung speichern</button></div>
          </form>
        </div>
      )}
    </section>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('de-CH').format(new Date(`${value}T12:00:00`))
}
