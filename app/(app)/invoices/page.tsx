'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'
import { CloseButton } from '@/components/ui/close-button'
import { InteractiveRow } from '@/components/ui/interactive-row'
import { BusinessDocument } from '@/components/documents/business-document'
import { DocumentPreviewFrame } from '@/components/documents/document-preview-frame'
import { useBusinessStore } from '@/components/state/business-store'
import type { Invoice, InvoiceLine, Payment } from '@/types/domain'
import { getTimeEntryBillingEligibility } from '@/modules/time/eligibility'
import { effectiveInvoiceStatus } from '@/modules/invoices/status'

const chf = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', minimumFractionDigits: 2 })

export default function InvoicesPage() {
  const store = useBusinessStore()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [preview, setPreview] = useState<Invoice | null>(null)
  const [editing, setEditing] = useState<Invoice | null>(null)
  const [sending, setSending] = useState<{ invoice: Invoice; mode: 'invoice' | 'reminder' } | null>(null)
  const [payment, setPayment] = useState<Invoice | null>(null)
  const [builderOpen, setBuilderOpen] = useState(false)
  const [customerId, setCustomerId] = useState(store.customers.find((item) => item.status === 'active')?.id ?? '')
  const [orderId, setOrderId] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [extraLines, setExtraLines] = useState<InvoiceLine[]>([])
  const [notice, setNotice] = useState('')

  const [paymentPicker, setPaymentPicker] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    let consumed = false
    if (params.get('new') === '1') { setBuilderOpen(true); params.delete('new'); consumed = true }
    if (params.get('payment') === '1') { setPaymentPicker(true); params.delete('payment'); consumed = true }
    const viewId = params.get('view')
    if (viewId) {
      const invoice = store.invoices.find((item) => item.id === viewId)
      if (invoice) { setPreview(invoice); params.delete('view'); consumed = true }
    }
    if (consumed) {
      const suffix = params.toString() ? `?${params.toString()}` : ''
      router.replace(`${pathname}${suffix}`, { scroll: false })
    }
  }, [pathname, router, searchParams, store.invoices])

  const selectedOrder = store.orders.find((order) => order.id === orderId)
  const invoiceCustomerId = selectedOrder?.customerId ?? customerId
  const selectedCustomer = store.customers.find((customer) => customer.id === customerId)
  const eligibleTimes = useMemo(
    () => orderId ? store.timeEntries.filter((entry) => entry.orderId === orderId && getTimeEntryBillingEligibility(entry, store.timeEvidence, store.orderPolicies, store.orderAssignmentRules).eligible) : [],
    [store.timeEntries, store.timeEvidence, store.orderPolicies, store.orderAssignmentRules, orderId],
  )
  const selectedTimes = eligibleTimes.filter((entry) => selected.includes(entry.id))

  function createInvoice() {
    if (!selectedCustomer || (!selectedTimes.length && !extraLines.some((line) => line.description.trim() && line.quantity > 0))) return
    const invoice = store.createInvoiceFromTimes({
      customerId: selectedCustomer.id,
      orderId: selectedOrder?.id,
      timeEntryIds: selectedTimes.map((entry) => entry.id),
      period: selectedTimes[0] ? new Intl.DateTimeFormat('de-CH', { month: 'long', year: 'numeric' }).format(new Date(`${selectedTimes[0].date}T12:00:00`)) : new Intl.DateTimeFormat('de-CH', { month: 'long', year: 'numeric' }).format(new Date()),
      extraLines,
    })
    if (invoice) {
      setBuilderOpen(false)
      setSelected([])
      setExtraLines([])
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
      <PageHeader eyebrow="FAKTURIERUNG" title="Rechnungen" description="Zeiten übernehmen, Entwürfe bearbeiten, PDF prüfen, versenden und Zahlungen verbuchen." action={<button className="button primary page-primary-action" onClick={() => setBuilderOpen(true)} aria-label="Rechnung erstellen" title="Rechnung erstellen"><Icon name="plus" size={16}/><span>Rechnung erstellen</span></button>} />

      {notice && <div className="inline-notice"><Icon name="check" size={15}/><span>{notice}</span></div>}

      <div className="data-list compact-overview-list">
        <div className="data-row invoice-grid data-head"><span>Rechnung</span><span>Kunde</span><span>Fällig</span><span>Betrag</span><span>Status</span><span /></div>
        {store.invoices.map((invoice) => (
          <InteractiveRow className="data-row invoice-grid compact-overview-row" key={invoice.id} onActivate={() => setPreview(invoice)} ariaLabel={`${invoice.number} öffnen`}>
            <span className="primary-cell"><strong>{invoice.number} · {invoice.customerName}</strong><small className="desktop-row-detail">{invoice.orderName || invoice.period}</small><small className="mobile-row-summary">{chf.format(invoice.amount)} · Fällig {fmt(invoice.due)} · {invoiceStatusLabel(effectiveInvoiceStatus(invoice))}</small></span>
            <span className="overview-desktop-cell">{invoice.customerName}</span><span className="overview-desktop-cell">{fmt(invoice.due)}</span><span className="overview-desktop-cell"><strong>{chf.format(invoice.amount)}</strong><small>{invoice.lines.length} Positionen</small></span><span className={`status ${effectiveInvoiceStatus(invoice)} overview-desktop-cell`}>{invoiceStatusLabel(effectiveInvoiceStatus(invoice))}</span>
            <span className="row-disclosure" aria-hidden="true"><Icon name="chevron" size={15}/></span>
          </InteractiveRow>
        ))}
      </div>

      {builderOpen && (
        <div className="overlay-layer sheet-layer" onMouseDown={() => setBuilderOpen(false)}>
          <div className="form-sheet invoice-builder-sheet mobile-fullscreen-sheet" onMouseDown={(e) => e.stopPropagation()}>
            <div className="sheet-heading"><div><strong>Rechnung erstellen</strong><span>Zeiten übernehmen oder freie Rechnungspositionen erfassen.</span></div><CloseButton onClick={() => setBuilderOpen(false)} /></div>
            <details className="edit-step" open><summary><span><strong>1 · Quelle</strong><small>Kunde und Auftrag auswählen</small></span><Icon name="chevron" size={15}/></summary><div className="edit-step-body"><div className="form-grid"><label className="full"><span>Kunde *</span><select value={customerId} onChange={(e) => { setCustomerId(e.target.value); setOrderId(''); setSelected([]) }} required>{store.customers.filter((customer) => customer.status === 'active').map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label><label className="full"><span>Auftrag</span><select value={orderId} onChange={(e) => { const next = e.target.value; setOrderId(next); setSelected([]); const order = store.orders.find((item) => item.id === next); if (order) setCustomerId(order.customerId) }}><option value="">Freie Rechnung ohne Auftrag</option>{store.orders.filter((order) => order.customerId === customerId).map((order) => <option key={order.id} value={order.id}>{order.name}</option>)}</select></label></div></div></details>
            {orderId && <details className="edit-step"><summary><span><strong>2 · Zeiten übernehmen</strong><small>{eligibleTimes.length} verfügbare Einträge</small></span><Icon name="chevron" size={15}/></summary><div className="edit-step-body"><div className="invoice-source-list">{eligibleTimes.length ? eligibleTimes.map((entry) => <label className="invoice-source-row" key={entry.id}><input type="checkbox" checked={selected.includes(entry.id)} onChange={(e) => setSelected((cur) => e.target.checked ? [...cur, entry.id] : cur.filter((id) => id !== entry.id))}/><span><strong>{fmt(entry.date)} · {entry.personName}</strong><small>{entry.note}</small></span><span>{entry.hours} h · {chf.format(entry.salesRate)}/h</span><strong>{chf.format(entry.hours * entry.salesRate)}</strong></label>) : <div className="empty-state"><span>Keine freigegebenen, noch nicht verrechneten Zeiten vorhanden.</span></div>}</div></div></details>}
            <details className="edit-step"><summary><span><strong>{orderId ? '3' : '2'} · Zusätzliche Positionen</strong><small>{extraLines.length ? `${extraLines.length} erfasst` : 'Optional'}</small></span><Icon name="chevron" size={15}/></summary><div className="edit-step-body"><div className="line-editor"><div className="line-editor-head"><strong>Zusätzliche Positionen</strong><button type="button" className="text-button" onClick={() => setExtraLines((current) => [...current, { id: `il-extra-${Date.now()}`, description: '', quantity: 1, unit: 'Stk.', unitPrice: 0, vatRate: 8.1, sourceTimeEntryIds: [] }])}><Icon name="plus" size={14}/> Position</button></div>{extraLines.map((line) => <div className="line-editor-row" key={line.id}><label><span>Beschreibung</span><input value={line.description} onChange={(e) => setExtraLines((current) => current.map((item) => item.id === line.id ? { ...item, description: e.target.value } : item))}/></label><label><span>Menge</span><input type="number" min="0.01" step="0.25" value={line.quantity} onChange={(e) => setExtraLines((current) => current.map((item) => item.id === line.id ? { ...item, quantity: Number(e.target.value) } : item))}/></label><label><span>Einheit</span><select value={line.unit} onChange={(e) => setExtraLines((current) => current.map((item) => item.id === line.id ? { ...item, unit: e.target.value as InvoiceLine['unit'] } : item))}><option value="h">h</option><option value="Stk.">Stk.</option><option value="pauschal">pauschal</option></select></label><label><span>Preis CHF</span><input type="number" min="0" step="0.05" value={line.unitPrice} onChange={(e) => setExtraLines((current) => current.map((item) => item.id === line.id ? { ...item, unitPrice: Number(e.target.value) } : item))}/></label><label><span>MWST %</span><input type="number" min="0" step="0.1" value={line.vatRate} onChange={(e) => setExtraLines((current) => current.map((item) => item.id === line.id ? { ...item, vatRate: Number(e.target.value) } : item))}/></label><button type="button" className="line-remove" onClick={() => setExtraLines((current) => current.filter((item) => item.id !== line.id))}>×</button></div>)}</div></div></details>
            <div className="sheet-actions"><button className="button secondary" onClick={() => setBuilderOpen(false)}>Abbrechen</button><button className="button primary" disabled={!selected.length && !extraLines.some((line) => line.description.trim())} onClick={createInvoice}>Entwurf erstellen</button></div>
          </div>
        </div>
      )}

      {preview && (
        <div className="overlay-layer document-overlay" onMouseDown={() => setPreview(null)}>
          <div className="document-preview-shell" onMouseDown={(e) => e.stopPropagation()}>
            <div className="preview-toolbar"><div><strong>{preview.number}</strong><span>{preview.customerName}</span></div><div><button className="icon-button" onClick={() => window.print()} title="PDF / Drucken"><Icon name="download" size={16}/></button><CloseButton onClick={() => setPreview(null)} /></div></div>
            {readiness(preview).length > 0 && <div className="document-warning"><strong>Noch nicht versandbereit</strong><span>Fehlend: {readiness(preview).join(', ')}</span></div>}
            <DocumentPreviewFrame><BusinessDocument type="invoice" company={store.companyProfile} customer={documentCustomer(preview)} invoice={preview}/></DocumentPreviewFrame>
            <div className="preview-actions">
              <button className="button secondary" disabled={preview.status !== 'draft'} onClick={() => setEditing(preview)}><Icon name="edit" size={15}/> Bearbeiten</button>
              <button className="button secondary" disabled={readiness(preview).length > 0} onClick={() => setSending({ invoice: preview, mode: 'invoice' })}><Icon name="send" size={15}/> {preview.status === 'draft' ? 'Senden' : 'Erneut senden'}</button>
              {effectiveInvoiceStatus(preview) === 'overdue' && <button className="button secondary" onClick={() => setSending({ invoice: preview, mode: 'reminder' })}><Icon name="warning" size={15}/> Mahnung</button>}
              {!['paid', 'cancelled'].includes(preview.status) && <button className="button secondary" onClick={() => { if (window.confirm('Rechnung wirklich stornieren? Zugeordnete Zeiten werden wieder zur Fakturierung freigegeben.')) { const updated = store.cancelInvoice(preview.id); if (updated) { setPreview(updated); setNotice('Rechnung wurde storniert. Zugeordnete Zeiten sind wieder verfügbar.') } } }}>Stornieren</button>}
              {!['paid', 'cancelled'].includes(preview.status) && <button className="button primary" onClick={() => setPayment(preview)}><Icon name="credit-card" size={15}/> Zahlung erfassen</button>}
            </div>
          </div>
        </div>
      )}

      {editing && <InvoiceEditor invoice={editing} onClose={() => setEditing(null)} onSave={(updated) => { setEditing(null); setPreview(updated) }} />}
      {sending && <SendDialog invoice={sending.invoice} mode={sending.mode} onClose={() => setSending(null)} onSent={(updated) => { setSending(null); setPreview(updated); setNotice(sending.mode === 'reminder' ? 'Mahnung im Demo-Versand erfasst.' : 'Rechnung im Demo-Versand als versendet markiert.') }} />}
      {payment && <PaymentDialog invoice={payment} onClose={() => setPayment(null)} />}
      {paymentPicker && <div className="overlay-layer sheet-layer" onMouseDown={() => setPaymentPicker(false)}><div className="form-sheet compact-sheet bottom-sheet" onMouseDown={(e) => e.stopPropagation()}><div className="sheet-heading"><div><strong>Zahlung erfassen</strong><span>Offene Rechnung auswählen</span></div><CloseButton onClick={() => setPaymentPicker(false)} /></div><div className="compact-list">{store.invoices.filter((item) => !['paid', 'cancelled'].includes(effectiveInvoiceStatus(item))).map((item) => <button type="button" className="payment-pick-row" key={item.id} onClick={() => { setPaymentPicker(false); setPayment(item) }}><span className="primary-cell"><strong>{item.number} · {item.customerName}</strong><small>{chf.format(item.amount - item.paidAmount)} offen</small></span><Icon name="chevron" size={15}/></button>)}</div></div></div>}
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
    return <div className="overlay-layer sheet-layer"><form className="form-sheet document-editor mobile-fullscreen-sheet" onSubmit={save} onMouseDown={(e) => e.stopPropagation()}><div className="sheet-heading"><div><strong>Rechnung bearbeiten</strong><span>{invoice.number} · nur Entwürfe sind änderbar</span></div><CloseButton onClick={onClose} /></div>{error && <div className="field-error">{error}</div>}<details className="edit-step" open><summary><span><strong>1 · Empfänger und Daten</strong><small>Adresse, Datum und Zahlungsziel</small></span><Icon name="chevron" size={15}/></summary><div className="edit-step-body"><div className="form-grid">
      <label><span>Empfänger *</span><input value={draft.recipientName ?? ''} onChange={(e) => setDraft({ ...draft, recipientName: e.target.value })} required/></label><label><span>E-Mail *</span><input type="email" value={draft.recipientEmail ?? ''} onChange={(e) => setDraft({ ...draft, recipientEmail: e.target.value })} required/></label><label className="full"><span>Adresse *</span><input value={draft.recipientAddress ?? ''} onChange={(e) => setDraft({ ...draft, recipientAddress: e.target.value })} required/></label><label><span>PLZ *</span><input value={draft.recipientZip ?? ''} onChange={(e) => setDraft({ ...draft, recipientZip: e.target.value })} required/></label><label><span>Ort *</span><input value={draft.recipientCity ?? ''} onChange={(e) => setDraft({ ...draft, recipientCity: e.target.value })} required/></label><label><span>Rechnungsdatum *</span><input type="date" value={draft.issueDate} onChange={(e) => setDraft({ ...draft, issueDate: e.target.value })} required/></label><label><span>Fällig *</span><input type="date" value={draft.due} onChange={(e) => setDraft({ ...draft, due: e.target.value })} required/></label></div></div></details><details className="edit-step"><summary><span><strong>2 · Positionen</strong><small>{draft.lines.length} Positionen</small></span><Icon name="chevron" size={15}/></summary><div className="edit-step-body"><div className="line-editor"><div className="line-editor-head"><strong>Positionen</strong><button type="button" className="text-button" onClick={() => setDraft((cur) => ({ ...cur, lines: [...cur.lines, { id: `il-${Date.now()}`, description: '', quantity: 1, unit: 'Stk.', unitPrice: 0, vatRate: 8.1, sourceTimeEntryIds: [] }] }))}><Icon name="plus" size={14}/> Position</button></div>{draft.lines.map((line) => <div className="line-editor-row" key={line.id}><label><span>Beschreibung *</span><input value={line.description} onChange={(e) => updateLine(line.id, { description: e.target.value })} required/></label><label><span>Menge</span><input type="number" min="0.01" step="0.25" value={line.quantity} onChange={(e) => updateLine(line.id, { quantity: Number(e.target.value) })}/></label><label><span>Einheit</span><select value={line.unit} onChange={(e) => updateLine(line.id, { unit: e.target.value as InvoiceLine['unit'] })}><option value="h">h</option><option value="Stk.">Stk.</option><option value="pauschal">pauschal</option></select></label><label><span>Preis CHF</span><input type="number" min="0" step="0.05" value={line.unitPrice} onChange={(e) => updateLine(line.id, { unitPrice: Number(e.target.value) })}/></label><label><span>MWST %</span><input type="number" min="0" step="0.1" value={line.vatRate} onChange={(e) => updateLine(line.id, { vatRate: Number(e.target.value) })}/></label><button type="button" className="line-remove" disabled={draft.lines.length === 1} onClick={() => setDraft((cur) => ({ ...cur, lines: cur.lines.filter((item) => item.id !== line.id) }))}>×</button></div>)}</div></div></details><details className="edit-step"><summary><span><strong>3 · Texte</strong><small>Einleitung und Schlusstext</small></span><Icon name="chevron" size={15}/></summary><div className="edit-step-body"><label className="block-field"><span>Einleitungstext</span><textarea rows={4} value={draft.introText ?? store.documentTemplates.invoiceIntro} onChange={(e) => setDraft({ ...draft, introText: e.target.value })}/></label><label className="block-field"><span>Schlusstext</span><textarea rows={4} value={draft.outroText ?? store.documentTemplates.invoiceOutro} onChange={(e) => setDraft({ ...draft, outroText: e.target.value })}/></label></div></details><div className="sheet-actions"><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button className="button primary">Speichern</button></div></form></div>
  }

  function SendDialog({ invoice, mode, onClose, onSent }: { invoice: Invoice; mode: 'invoice' | 'reminder'; onClose: () => void; onSent: (invoice: Invoice) => void }) {
    const customer = documentCustomer(invoice)
    const [to, setTo] = useState(invoice.recipientEmail || customer?.email || '')
    const subjectTemplate = mode === 'reminder' ? store.documentTemplates.reminderEmailSubject : store.documentTemplates.invoiceEmailSubject
    const bodyTemplate = mode === 'reminder' ? store.documentTemplates.reminderEmailBody : store.documentTemplates.invoiceEmailBody
    const [subject, setSubject] = useState(fillTemplate(subjectTemplate, invoice))
    const [body, setBody] = useState(fillTemplate(bodyTemplate, invoice))
    function send(e: React.FormEvent) { e.preventDefault(); const updated = store.sendInvoice(invoice.id, to, mode); if (updated) onSent(updated) }
    const from = mode === 'reminder' ? store.appSettings.mail.reminderSender : store.appSettings.mail.invoiceSender
    return <div className="overlay-layer sheet-layer"><form className="form-sheet compact-sheet bottom-sheet" onSubmit={send}><div className="sheet-heading"><div><strong>{mode === 'reminder' ? 'Mahnung versenden' : 'Rechnung versenden'}</strong><span>PDF-Vorschau entspricht dem Dokument im Anhang.</span></div><CloseButton onClick={onClose} /></div><div className="send-meta"><span><small>Von</small><strong>{from || 'Nicht konfiguriert'}</strong></span>{store.appSettings.mail.financeCc && <span><small>CC</small><strong>{store.appSettings.mail.financeCc}</strong></span>}</div><div className="form-grid"><label className="full"><span>Empfänger *</span><input type="email" value={to} onChange={(e) => setTo(e.target.value)} required/></label><label className="full"><span>Betreff *</span><input value={subject} onChange={(e) => setSubject(e.target.value)} required/></label><label className="full"><span>Nachricht *</span><textarea rows={8} value={body} onChange={(e) => setBody(e.target.value)} required/></label></div><div className="demo-hint">Demo: Status, Empfänger und Versandzeitpunkt werden gespeichert. Der echte Versand über {from || 'die konfigurierte Absenderadresse'} benötigt noch Microsoft Graph und serverseitige PDF-Erzeugung.</div><div className="sheet-actions"><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button className="button primary" disabled={!from}><Icon name="send" size={15}/> Senden</button></div></form></div>
  }

  function PaymentDialog({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
    const [amount, setAmount] = useState(String(Math.round((invoice.amount - invoice.paidAmount) * 100) / 100))
    const [method, setMethod] = useState<Payment['method']>('Bank')
    function save(e: React.FormEvent) { e.preventDefault(); store.recordPayment(invoice.id, Number(amount), method, new Date().toISOString().slice(0, 10)); onClose(); setPreview(null) }
    return <div className="overlay-layer sheet-layer"><form className="form-sheet compact-sheet bottom-sheet" onSubmit={save}><div className="sheet-heading"><div><strong>Zahlung erfassen</strong><span>{invoice.number}</span></div><CloseButton onClick={onClose} /></div><div className="form-grid"><label><span>Betrag *</span><input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} required/></label><label><span>Zahlungsart *</span><select value={method} onChange={(e) => setMethod(e.target.value as Payment['method'])}><option>Bank</option><option>Bar</option><option>Kreditkarte</option><option>Sonstige</option></select></label></div><div className="sheet-actions"><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button className="button primary">Zahlung speichern</button></div></form></div>
  }
}

function fmt(value?: string) { if (!value) return '–'; return new Intl.DateTimeFormat('de-CH').format(new Date(`${value}T12:00:00`)) }
function fillTemplate(template: string, invoice: Invoice) { return template.replaceAll('{{number}}', invoice.number).replaceAll('{{amount}}', chf.format(invoice.amount)).replaceAll('{{customer}}', invoice.customerName) }

function invoiceStatusLabel(value: string) { const labels: Record<string, string> = { draft: 'Entwurf', sent: 'Versendet', partial: 'Teilbezahlt', paid: 'Bezahlt', overdue: 'Überfällig', cancelled: 'Storniert' }; return labels[value] ?? value }
