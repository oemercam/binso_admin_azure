'use client'

import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'
import { BusinessDocument } from '@/components/documents/business-document'
import { useBusinessStore } from '@/components/state/business-store'
import type { Invoice, InvoiceLine, Payment } from '@/types/domain'

const chf = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', minimumFractionDigits: 2 })

export default function InvoicesPage() {
  const store = useBusinessStore()
  const [preview, setPreview] = useState<Invoice | null>(null)
  const [editing, setEditing] = useState<Invoice | null>(null)
  const [sending, setSending] = useState<{ invoice: Invoice; mode: 'invoice' | 'reminder' } | null>(null)
  const [payment, setPayment] = useState<Invoice | null>(null)
  const [builderOpen, setBuilderOpen] = useState(false)
  const [orderId, setOrderId] = useState(store.orders[0]?.id ?? '')
  const [selected, setSelected] = useState<string[]>([])
  const [notice, setNotice] = useState('')

  const selectedOrder = store.orders.find((order) => order.id === orderId)
  const eligibleTimes = useMemo(
    () => store.timeEntries.filter((entry) => entry.orderId === orderId && entry.billable && entry.approved && !entry.invoicedInvoiceId),
    [store.timeEntries, orderId],
  )
  const selectedTimes = eligibleTimes.filter((entry) => selected.includes(entry.id))

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

  function documentCustomer(invoice: Invoice) {
    return store.customers.find((customer) => customer.id === invoice.customerId)
  }

  function readiness(invoice: Invoice) {
    const customer = documentCustomer(invoice)
    const missing = [
      !invoice.recipientName && !customer?.name ? 'Empfänger' : '',
      !invoice.recipientAddress && !customer?.address ? 'Adresse' : '',
      !invoice.recipientZip && !customer?.zip ? 'PLZ' : '',
      !invoice.recipientCity && !customer?.city ? 'Ort' : '',
      !invoice.recipientEmail && !customer?.email ? 'E-Mail' : '',
      !invoice.issueDate ? 'Rechnungsdatum' : '',
      !invoice.due ? 'Fälligkeitsdatum' : '',
      !invoice.lines.length ? 'Positionen' : '',
      !store.companyProfile.iban ? 'IBAN' : '',
      !store.companyProfile.uid ? 'UID/MWST' : '',
    ].filter(Boolean)
    return missing
  }

  return (
    <section className="page">
      <PageHeader eyebrow="FAKTURIERUNG" title="Rechnungen" description="Zeiten übernehmen, Entwürfe bearbeiten, PDF prüfen, versenden und Zahlungen verbuchen." action={<button className="button primary" onClick={() => setBuilderOpen(true)}><Icon name="plus" size={16}/> Rechnung erstellen</button>} />

      {notice && <div className="inline-notice"><Icon name="check" size={15}/><span>{notice}</span></div>}

      <div className="data-list">
        <div className="data-row invoice-grid data-head"><span>Rechnung</span><span>Kunde</span><span>Fällig</span><span>Betrag</span><span>Status</span><span /></div>
        {store.invoices.map((invoice) => (
          <div className="data-row invoice-grid" key={invoice.id}>
            <span className="primary-cell"><strong>{invoice.number}</strong><small>{invoice.orderName || invoice.period}</small></span>
            <span>{invoice.customerName}</span><span>{fmt(invoice.due)}</span><span><strong>{chf.format(invoice.amount)}</strong><small>{invoice.lines.length} Positionen</small></span><span className={`status ${invoice.status}`}>{invoice.status}</span>
            <div className="row-actions"><button className="row-link" onClick={() => setPreview(invoice)} title="Vorschau"><Icon name="chevron" size={15}/></button></div>
          </div>
        ))}
      </div>

      {builderOpen && (
        <div className="overlay-layer sheet-layer" onMouseDown={() => setBuilderOpen(false)}>
          <div className="form-sheet invoice-builder-sheet" onMouseDown={(e) => e.stopPropagation()}>
            <div className="sheet-heading"><div><strong>Rechnung aus Zeiten</strong><span>Nur freigegebene, noch nicht verrechnete Zeiten werden angezeigt.</span></div><button className="icon-button" onClick={() => setBuilderOpen(false)}><Icon name="close" size={17}/></button></div>
            <div className="form-grid"><label className="full"><span>Auftrag *</span><select value={orderId} onChange={(e) => { setOrderId(e.target.value); setSelected([]) }}>{store.orders.map((order) => <option key={order.id} value={order.id}>{order.name} · {order.customerName}</option>)}</select></label></div>
            <div className="invoice-source-list">{eligibleTimes.map((entry) => <label className="invoice-source-row" key={entry.id}><input type="checkbox" checked={selected.includes(entry.id)} onChange={(e) => setSelected((cur) => e.target.checked ? [...cur, entry.id] : cur.filter((id) => id !== entry.id))}/><span><strong>{fmt(entry.date)} · {entry.personName}</strong><small>{entry.note}</small></span><span>{entry.hours} h · {chf.format(entry.salesRate)}/h</span><strong>{chf.format(entry.hours * entry.salesRate)}</strong></label>)}</div>
            <div className="sheet-actions"><button className="button secondary" onClick={() => setBuilderOpen(false)}>Abbrechen</button><button className="button primary" disabled={!selected.length} onClick={createInvoice}>Entwurf erstellen</button></div>
          </div>
        </div>
      )}

      {preview && (
        <div className="overlay-layer document-overlay" onMouseDown={() => setPreview(null)}>
          <div className="document-preview-shell" onMouseDown={(e) => e.stopPropagation()}>
            <div className="preview-toolbar"><div><strong>{preview.number}</strong><span>{preview.customerName}</span></div><div><button className="icon-button" onClick={() => window.print()} title="PDF / Drucken"><Icon name="download" size={16}/></button><button className="icon-button" onClick={() => setPreview(null)}><Icon name="close" size={16}/></button></div></div>
            {readiness(preview).length > 0 && <div className="document-warning"><strong>Noch nicht versandbereit</strong><span>Fehlend: {readiness(preview).join(', ')}</span></div>}
            <BusinessDocument type="invoice" company={store.companyProfile} customer={documentCustomer(preview)} invoice={preview}/>
            <div className="preview-actions">
              <button className="button secondary" disabled={preview.status !== 'draft'} onClick={() => setEditing(preview)}><Icon name="edit" size={15}/> Bearbeiten</button>
              <button className="button secondary" disabled={readiness(preview).length > 0} onClick={() => setSending({ invoice: preview, mode: 'invoice' })}><Icon name="send" size={15}/> {preview.status === 'draft' ? 'Senden' : 'Erneut senden'}</button>
              {preview.status === 'overdue' && <button className="button secondary" onClick={() => setSending({ invoice: preview, mode: 'reminder' })}><Icon name="warning" size={15}/> Mahnung</button>}
              {preview.status !== 'paid' && <button className="button primary" onClick={() => setPayment(preview)}><Icon name="credit-card" size={15}/> Zahlung erfassen</button>}
            </div>
          </div>
        </div>
      )}

      {editing && <InvoiceEditor invoice={editing} onClose={() => setEditing(null)} onSave={(updated) => { setEditing(null); setPreview(updated) }} />}
      {sending && <SendDialog invoice={sending.invoice} mode={sending.mode} onClose={() => setSending(null)} onSent={(updated) => { setSending(null); setPreview(updated); setNotice(sending.mode === 'reminder' ? 'Mahnung im Demo-Versand erfasst.' : 'Rechnung im Demo-Versand als versendet markiert.') }} />}
      {payment && <PaymentDialog invoice={payment} onClose={() => setPayment(null)} />}
    </section>
  )

  function InvoiceEditor({ invoice, onClose, onSave }: { invoice: Invoice; onClose: () => void; onSave: (invoice: Invoice) => void }) {
    const [draft, setDraft] = useState(invoice)
    const [error, setError] = useState('')
    function save(e: React.FormEvent) {
      e.preventDefault()
      if (!draft.recipientName || !draft.recipientAddress || !draft.recipientZip || !draft.recipientCity || !draft.recipientEmail || !draft.issueDate || !draft.due || !draft.lines.length) { setError('Bitte alle Pflichtfelder ausfüllen.'); return }
      const updated = store.updateInvoiceDraft(draft.id, draft)
      if (updated) onSave(updated)
    }
    function updateLine(id: string, changes: Partial<InvoiceLine>) { setDraft((cur) => ({ ...cur, lines: cur.lines.map((line) => line.id === id ? { ...line, ...changes } : line) })) }
    return <div className="overlay-layer sheet-layer"><form className="form-sheet document-editor" onSubmit={save} onMouseDown={(e) => e.stopPropagation()}><div className="sheet-heading"><div><strong>Rechnung bearbeiten</strong><span>{invoice.number} · nur Entwürfe sind änderbar</span></div><button type="button" className="icon-button" onClick={onClose}><Icon name="close" size={17}/></button></div>{error && <div className="field-error">{error}</div>}<div className="form-grid">
      <label><span>Empfänger *</span><input value={draft.recipientName ?? ''} onChange={(e) => setDraft({ ...draft, recipientName: e.target.value })} required/></label><label><span>E-Mail *</span><input type="email" value={draft.recipientEmail ?? ''} onChange={(e) => setDraft({ ...draft, recipientEmail: e.target.value })} required/></label><label className="full"><span>Adresse *</span><input value={draft.recipientAddress ?? ''} onChange={(e) => setDraft({ ...draft, recipientAddress: e.target.value })} required/></label><label><span>PLZ *</span><input value={draft.recipientZip ?? ''} onChange={(e) => setDraft({ ...draft, recipientZip: e.target.value })} required/></label><label><span>Ort *</span><input value={draft.recipientCity ?? ''} onChange={(e) => setDraft({ ...draft, recipientCity: e.target.value })} required/></label><label><span>Rechnungsdatum *</span><input type="date" value={draft.issueDate} onChange={(e) => setDraft({ ...draft, issueDate: e.target.value })} required/></label><label><span>Fällig *</span><input type="date" value={draft.due} onChange={(e) => setDraft({ ...draft, due: e.target.value })} required/></label><label className="full"><span>Einleitungstext</span><textarea rows={4} value={draft.introText ?? store.documentTemplates.invoiceIntro} onChange={(e) => setDraft({ ...draft, introText: e.target.value })}/></label></div>
      <div className="editor-lines">{draft.lines.map((line) => <div className="editor-line" key={line.id}><input value={line.description} onChange={(e) => updateLine(line.id, { description: e.target.value })}/><input type="number" step="0.25" value={line.quantity} onChange={(e) => updateLine(line.id, { quantity: Number(e.target.value) })}/><input type="number" step="0.05" value={line.unitPrice} onChange={(e) => updateLine(line.id, { unitPrice: Number(e.target.value) })}/></div>)}</div>
      <label className="block-field"><span>Schlusstext</span><textarea rows={4} value={draft.outroText ?? store.documentTemplates.invoiceOutro} onChange={(e) => setDraft({ ...draft, outroText: e.target.value })}/></label><div className="sheet-actions"><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button className="button primary">Speichern</button></div></form></div>
  }

  function SendDialog({ invoice, mode, onClose, onSent }: { invoice: Invoice; mode: 'invoice' | 'reminder'; onClose: () => void; onSent: (invoice: Invoice) => void }) {
    const customer = documentCustomer(invoice)
    const [to, setTo] = useState(invoice.recipientEmail || customer?.email || '')
    const subjectTemplate = mode === 'reminder' ? store.documentTemplates.reminderEmailSubject : store.documentTemplates.invoiceEmailSubject
    const bodyTemplate = mode === 'reminder' ? store.documentTemplates.reminderEmailBody : store.documentTemplates.invoiceEmailBody
    const [subject, setSubject] = useState(fillTemplate(subjectTemplate, invoice))
    const [body, setBody] = useState(fillTemplate(bodyTemplate, invoice))
    function send(e: React.FormEvent) { e.preventDefault(); const updated = store.sendInvoice(invoice.id, to, mode); if (updated) onSent(updated) }
    return <div className="overlay-layer sheet-layer"><form className="form-sheet compact-sheet" onSubmit={send}><div className="sheet-heading"><div><strong>{mode === 'reminder' ? 'Mahnung versenden' : 'Rechnung versenden'}</strong><span>PDF-Vorschau entspricht dem Dokument im Anhang.</span></div><button type="button" className="icon-button" onClick={onClose}><Icon name="close" size={17}/></button></div><div className="form-grid"><label className="full"><span>Empfänger *</span><input type="email" value={to} onChange={(e) => setTo(e.target.value)} required/></label><label className="full"><span>Betreff *</span><input value={subject} onChange={(e) => setSubject(e.target.value)} required/></label><label className="full"><span>Nachricht *</span><textarea rows={8} value={body} onChange={(e) => setBody(e.target.value)} required/></label></div><div className="demo-hint">Demo: Der Versand wird protokolliert und der Status aktualisiert. Für echten E-Mail-Versand mit PDF-Anhang wird anschliessend Microsoft Graph oder ein Maildienst angebunden.</div><div className="sheet-actions"><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button className="button primary"><Icon name="send" size={15}/> Senden</button></div></form></div>
  }

  function PaymentDialog({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
    const [amount, setAmount] = useState(String(Math.round((invoice.amount - invoice.paidAmount) * 100) / 100))
    const [method, setMethod] = useState<Payment['method']>('Bank')
    function save(e: React.FormEvent) { e.preventDefault(); store.recordPayment(invoice.id, Number(amount), method, new Date().toISOString().slice(0, 10)); onClose(); setPreview(null) }
    return <div className="overlay-layer sheet-layer"><form className="form-sheet compact-sheet" onSubmit={save}><div className="sheet-heading"><div><strong>Zahlung erfassen</strong><span>{invoice.number}</span></div><button type="button" className="icon-button" onClick={onClose}><Icon name="close" size={17}/></button></div><div className="form-grid"><label><span>Betrag *</span><input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} required/></label><label><span>Zahlungsart *</span><select value={method} onChange={(e) => setMethod(e.target.value as Payment['method'])}><option>Bank</option><option>Bar</option><option>Kreditkarte</option><option>Sonstige</option></select></label></div><div className="sheet-actions"><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button className="button primary">Zahlung speichern</button></div></form></div>
  }
}

function fmt(value?: string) { if (!value) return '–'; return new Intl.DateTimeFormat('de-CH').format(new Date(`${value}T12:00:00`)) }
function fillTemplate(template: string, invoice: Invoice) { return template.replaceAll('{{number}}', invoice.number).replaceAll('{{amount}}', chf.format(invoice.amount)).replaceAll('{{customer}}', invoice.customerName) }
