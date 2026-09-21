'use client'

import { useState } from 'react'
import { invoices as initialInvoices } from '@/lib/data/demo'
import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'
import type { Invoice, InvoiceStatus } from '@/types/domain'

const chf = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 })

const label: Record<InvoiceStatus, string> = {
  draft: 'Entwurf',
  sent: 'Versendet',
  partial: 'Teilbezahlt',
  paid: 'Bezahlt',
  overdue: 'Überfällig',
  cancelled: 'Storniert',
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState(initialInvoices)
  const [preview, setPreview] = useState<Invoice | null>(null)
  const [payment, setPayment] = useState<Invoice | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')

  function savePayment(event: React.FormEvent) {
    event.preventDefault()
    if (!payment) return
    const amount = Number(paymentAmount)
    if (!amount || amount <= 0) return
    setInvoices((current) => current.map((invoice) => {
      if (invoice.id !== payment.id) return invoice
      const paidAmount = Math.min(invoice.amount, invoice.paidAmount + amount)
      return { ...invoice, paidAmount, status: paidAmount >= invoice.amount ? 'paid' : 'partial' }
    }))
    setPayment(null)
    setPaymentAmount('')
  }

  return (
    <section className="page">
      <PageHeader eyebrow="FAKTURIERUNG" title="Rechnungen" description="Erstellen, versenden, überwachen und Zahlungseingänge verbuchen." action={<button className="button primary"><Icon name="plus" size={16}/> Rechnung erstellen</button>} />

      <div className="workflow-strip invoice-workflow">
        <div><strong>{chf.format(invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + i.amount - i.paidAmount, 0))}</strong><span>Offen</span></div>
        <div><strong>{chf.format(invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.paidAmount, 0))}</strong><span>Bezahlt</span></div>
        <div><strong>{chf.format(invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount - i.paidAmount, 0))}</strong><span>Überfällig</span></div>
      </div>

      <div className="data-list">
        <div className="data-row invoice-grid data-head"><span>Rechnung</span><span>Kunde</span><span>Fällig</span><span>Betrag</span><span>Status</span><span /></div>
        {invoices.map((invoice) => (
          <div className="data-row invoice-grid" key={invoice.id}>
            <span className="primary-cell"><strong>{invoice.number}</strong><small>{invoice.period}</small></span>
            <span>{invoice.customerName}</span>
            <span>{invoice.due}</span>
            <span><strong>{chf.format(invoice.amount)}</strong></span>
            <span className={`status ${invoice.status}`}>{label[invoice.status]}</span>
            <div className="row-actions">
              {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                <button className="row-link" title="Zahlung erfassen" onClick={() => { setPayment(invoice); setPaymentAmount(String(invoice.amount - invoice.paidAmount)) }}><Icon name="credit-card" size={15}/></button>
              )}
              <button className="row-link" title="Vorschau" onClick={() => setPreview(invoice)}><Icon name="chevron" size={15}/></button>
            </div>
          </div>
        ))}
      </div>

      <div className="mobile-record-list">
        {invoices.map((invoice) => (
          <article className="mobile-record" key={invoice.id} onClick={() => setPreview(invoice)}>
            <div className="record-top"><span><strong>{invoice.number}</strong><small>{invoice.customerName}</small></span><span className={`status ${invoice.status}`}>{label[invoice.status]}</span></div>
            <div className="record-meta"><span>{chf.format(invoice.amount)}</span><span>fällig {invoice.due}</span></div>
          </article>
        ))}
      </div>

      {preview && (
        <div className="overlay-layer" onMouseDown={() => setPreview(null)}>
          <div className="document-preview-shell" onMouseDown={(event) => event.stopPropagation()}>
            <div className="preview-toolbar"><div><strong>{preview.number}</strong><span>{preview.customerName}</span></div><div><button className="icon-button"><Icon name="download" size={16}/></button><button className="icon-button" onClick={() => setPreview(null)}><Icon name="close" size={16}/></button></div></div>
            <div className="document-preview invoice-document">
              <header><div className="preview-logo">BINSO</div><div><strong>RECHNUNG</strong><span>{preview.number}</span></div></header>
              <section><small>Rechnung an</small><strong>{preview.customerName}</strong><p>Leistungen {preview.period}</p></section>
              <div className="invoice-lines"><div><span>IT-Dienstleistungen</span><span>{chf.format(preview.amount)}</span></div></div>
              <div className="preview-total"><span>Total</span><strong>{chf.format(preview.amount)}</strong></div>
              <footer>Fällig am {preview.due}</footer>
            </div>
            <div className="preview-actions"><button className="button secondary"><Icon name="edit" size={15}/> Bearbeiten</button><button className="button secondary"><Icon name="send" size={15}/> Senden</button>{preview.status !== 'paid' && <button className="button primary" onClick={() => { setPayment(preview); setPreview(null); setPaymentAmount(String(preview.amount - preview.paidAmount)) }}><Icon name="credit-card" size={15}/> Zahlung erfassen</button>}</div>
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
              <label><span>Zahlungsdatum</span><input type="date" defaultValue="2026-09-21"/></label>
              <label className="full"><span>Zahlungsart</span><select defaultValue="Bank"><option>Bank</option><option>Bar</option><option>Kreditkarte</option><option>Sonstige</option></select></label>
            </div>
            <div className="sheet-actions"><button type="button" className="button secondary" onClick={() => setPayment(null)}>Abbrechen</button><button className="button primary">Zahlung speichern</button></div>
          </form>
        </div>
      )}
    </section>
  )
}
