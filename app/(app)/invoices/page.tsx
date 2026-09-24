'use client'

import { Checkbox, DatePicker, Select, Textarea, Input } from '@/components/ui/form-controls'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'
import { RemoveButton } from '@/components/ui/close-button'
import { InteractiveRow } from '@/components/ui/interactive-row'
import { SheetActions, StandardFormSheet } from '@/components/ui/sheet-system'
import { ResponsiveOverlay } from '@/components/ui/responsive-overlay'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { useFeedback } from '@/components/ui/feedback'
import { BusinessDocument } from '@/components/documents/business-document'
import { DocumentPreviewFrame } from '@/components/documents/document-preview-frame'
import { ResponsivePreview } from '@/components/documents/responsive-preview'
import { useBusinessStore } from '@/components/state/business-store'
import type { Invoice, InvoiceLine, Payment } from '@/types/domain'
import { getTimeEntryBillingEligibility } from '@/modules/time/eligibility'
import { effectiveInvoiceStatus, invoiceOpenAmount } from '@/modules/invoices/status'
import { printCurrentDocument } from '@/lib/browser/actions'
import { formatChf, formatDate, formatMonthYear } from '@/lib/format/locale'
const chf = (value: number) => formatChf(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

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
  const requestedCustomer = searchParams.get('customer')
  const visibleInvoices = requestedCustomer ? store.invoices.filter((item) => item.customerId === requestedCustomer) : store.invoices
  const requestedOrder = searchParams.get('order')
  const [customerId, setCustomerId] = useState(requestedCustomer && store.customers.some((item) => item.id === requestedCustomer) ? requestedCustomer : store.customers.find((item) => item.status === 'active')?.id ?? '')
  const [orderId, setOrderId] = useState(requestedOrder && store.orders.some((item) => item.id === requestedOrder) ? requestedOrder : '')
  const [invoiceKind, setInvoiceKind] = useState<NonNullable<Invoice['kind']>>('standard')
  const [selected, setSelected] = useState<string[]>([])
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([])
  const [extraLines, setExtraLines] = useState<InvoiceLine[]>([])
  const feedback = useFeedback()
  const [cancelInvoiceTarget, setCancelInvoiceTarget] = useState<Invoice | null>(null)
  const [creditInvoice, setCreditInvoice] = useState<Invoice | null>(null)

  const [paymentPicker, setPaymentPicker] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const createRequested = params.get('new') === '1'
    const paymentRequested = params.get('payment') === '1'
    const viewId = params.get('view')
    const viewInvoice = viewId ? store.invoices.find((item) => item.id === viewId) : undefined
    if (!createRequested && !paymentRequested && !viewInvoice) return
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      if (createRequested) setBuilderOpen(true)
      if (paymentRequested) setPaymentPicker(true)
      if (viewInvoice) setPreview(viewInvoice)
    })
    if (createRequested) params.delete('new')
    if (paymentRequested) params.delete('payment')
    if (viewInvoice) params.delete('view')
    const suffix = params.toString() ? `?${params.toString()}` : ''
    router.replace(`${pathname}${suffix}`, { scroll: false })
    return () => { cancelled = true }
  }, [pathname, router, searchParams, store.invoices])

  const selectedOrder = store.orders.find((order) => order.id === orderId)
  const selectedCustomer = store.customers.find((customer) => customer.id === customerId)
  const eligibleTimes = useMemo(
    () => orderId ? store.timeEntries.filter((entry) => entry.orderId === orderId && getTimeEntryBillingEligibility(entry, store.timeEvidence, store.orderPolicies, store.orderAssignmentRules).eligible) : [],
    [store.timeEntries, store.timeEvidence, store.orderPolicies, store.orderAssignmentRules, orderId],
  )
  const selectedTimes = eligibleTimes.filter((entry) => selected.includes(entry.id))
  const eligibleExpenses = store.expenses.filter((expense) => expense.customerId === customerId && (!orderId || expense.orderId === orderId) && expense.billable && !expense.invoicedInvoiceId)
  const chosenExpenses = eligibleExpenses.filter((expense) => selectedExpenses.includes(expense.id))

  function createInvoice() {
    if (!selectedCustomer || (!selectedTimes.length && !chosenExpenses.length && !extraLines.some((line) => line.description.trim() && line.quantity > 0))) return
    const invoice = store.createInvoiceFromTimes({
      customerId: selectedCustomer.id,
      orderId: selectedOrder?.id,
      timeEntryIds: selectedTimes.map((entry) => entry.id),
      expenseIds: chosenExpenses.map((expense) => expense.id),
      kind: invoiceKind,
      period: selectedTimes[0] ? formatMonthYear(selectedTimes[0].date) : formatMonthYear(new Date()),
      extraLines,
    })
    if (invoice) {
      setBuilderOpen(false)
      setSelected([])
      setSelectedExpenses([])
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

  const previewStatus = preview ? effectiveInvoiceStatus(preview) : null
  const previewIsDraft = preview?.status === 'draft'
  const previewCanSend = Boolean(preview && preview.status !== 'cancelled')
  const previewCanRecordPayment = Boolean(preview && previewStatus && ['sent', 'partial', 'overdue'].includes(previewStatus))
  const previewCanRemind = Boolean(preview && previewStatus === 'overdue')
  const previewCanCredit = Boolean(preview && previewStatus && ['sent', 'partial', 'paid', 'overdue'].includes(previewStatus))
  const previewCanCancel = Boolean(preview && previewStatus && ['sent', 'partial', 'overdue'].includes(previewStatus))
  const previewHasMoreActions = previewCanRemind || previewCanCredit || previewCanCancel

  return (
    <section className="page apple-page mobile-standard-page">
      <PageHeader title="Rechnungen" description="Rechnungen erstellen, prüfen, Zahlungen erfassen und Korrekturen verwalten." action={<button className="button primary page-primary-action" onClick={() => setBuilderOpen(true)} aria-label="Rechnung erstellen" title="Rechnung erstellen"><Icon name="plus" size={16}/><span>Rechnung erstellen</span></button>} />


      <div className="data-list compact-overview-list">
        <div className="data-row invoice-grid data-head"><span>Rechnung</span><span>Kunde</span><span>Fällig</span><span>Betrag</span><span>Status</span><span /></div>
        {visibleInvoices.map((invoice) => (
          <InteractiveRow className="data-row invoice-grid compact-overview-row" key={invoice.id} onActivate={() => setPreview(invoice)} ariaLabel={`${invoice.number} öffnen`}>
            <span className="primary-cell"><strong>{invoice.number} · {invoice.customerName}</strong><small className="desktop-row-detail">{invoice.orderName || invoice.period}</small><small className="mobile-row-summary">{invoice.orderName || invoice.period || 'Rechnung öffnen'}</small></span>
            <span className="overview-desktop-cell">{invoice.customerName}</span><span className="overview-desktop-cell">{fmt(invoice.due)}</span><span className="overview-desktop-cell"><strong>{chf(invoice.amount)}</strong><small>{invoice.lines.length} Positionen</small></span><span className={`status ${effectiveInvoiceStatus(invoice)} overview-desktop-cell`}>{invoiceStatusLabel(effectiveInvoiceStatus(invoice))}</span>
            <span className="row-disclosure" aria-hidden="true"><Icon name="chevron" size={15}/></span>
          </InteractiveRow>
        ))}
      </div>

      {builderOpen && (
        <ResponsiveOverlay open={builderOpen} mobile="fullscreen" desktop="dialog" title="Rechnung erstellen" description="Zeiten, Spesen oder freie Positionen in einem verständlichen Ablauf übernehmen." onClose={() => setBuilderOpen(false)} footer={<SheetActions><button type="button" className="button secondary" onClick={() => setBuilderOpen(false)}>Abbrechen</button><button type="button" className="button primary" disabled={!selected.length && !selectedExpenses.length && !extraLines.some((line) => line.description.trim())} onClick={createInvoice}>Entwurf erstellen</button></SheetActions>}>
            <details className="edit-step" open><summary><span><strong>1 · Quelle</strong><small>Kunde und Auftrag auswählen</small></span><Icon name="chevron" size={15}/></summary><div className="edit-step-body"><div className="form-grid"><label className="full"><span>Kunde *</span><Select value={customerId} onChange={(e) => { setCustomerId(e.target.value); setOrderId(''); setSelected([]); setSelectedExpenses([]) }} required>{store.customers.filter((customer) => customer.status === 'active').map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</Select></label><label><span>Rechnungsart</span><Select value={invoiceKind} onChange={(e) => setInvoiceKind(e.target.value as NonNullable<Invoice['kind']>)}><option value="standard">Standardrechnung</option><option value="deposit">Akontorechnung</option><option value="partial">Teilrechnung</option><option value="final">Schlussrechnung</option></Select></label><label><span>Auftrag</span><Select value={orderId} onChange={(e) => { const next = e.target.value; setOrderId(next); setSelected([]); setSelectedExpenses([]); const order = store.orders.find((item) => item.id === next); if (order) setCustomerId(order.customerId) }}><option value="">Freie Rechnung ohne Auftrag</option>{store.orders.filter((order) => order.customerId === customerId).map((order) => <option key={order.id} value={order.id}>{order.name}</option>)}</Select></label></div></div></details>
            {orderId && <details className="edit-step"><summary><span><strong>2 · Zeiten übernehmen</strong><small>{eligibleTimes.length} verfügbare Einträge</small></span><Icon name="chevron" size={15}/></summary><div className="edit-step-body"><div className="invoice-source-list">{eligibleTimes.length ? eligibleTimes.map((entry) => <label className="invoice-source-row" key={entry.id}><Checkbox checked={selected.includes(entry.id)} onChange={(e) => setSelected((cur) => e.target.checked ? [...cur, entry.id] : cur.filter((id) => id !== entry.id))}/><span><strong>{fmt(entry.date)} · {entry.personName}</strong><small>{entry.description || 'Keine Beschreibung'}</small></span><span>{entry.hours} h · {chf(entry.salesRate)}/h</span><strong>{chf(entry.hours * entry.salesRate)}</strong></label>) : <div className="empty-state"><span>Keine freigegebenen, noch nicht verrechneten Zeiten vorhanden.</span></div>}</div></div></details>}
            {eligibleExpenses.length > 0 && <details className="edit-step"><summary><span><strong>{orderId ? '3' : '2'} · Spesen und Material</strong><small>{eligibleExpenses.length} offene Positionen</small></span><Icon name="chevron" size={15}/></summary><div className="edit-step-body"><div className="invoice-source-list">{eligibleExpenses.map((expense) => <label className="invoice-source-row" key={expense.id}><Checkbox checked={selectedExpenses.includes(expense.id)} onChange={(e) => setSelectedExpenses((current) => e.target.checked ? [...current, expense.id] : current.filter((id) => id !== expense.id))}/><span><strong>{fmt(expense.date)} · {expense.description}</strong><small>{expense.category === 'material' ? 'Material' : expense.category === 'travel' ? 'Reisekosten' : expense.category === 'expense' ? 'Spesen' : 'Sonstiges'}</small></span><span>{expense.quantity} × {chf(expense.unitPrice)}</span><strong>{chf(expense.quantity * expense.unitPrice)}</strong></label>)}</div></div></details>}
            <details className="edit-step"><summary><span><strong>{orderId ? (eligibleExpenses.length ? '4' : '3') : (eligibleExpenses.length ? '3' : '2')} · Zusätzliche Positionen</strong><small>{extraLines.length ? `${extraLines.length} erfasst` : 'Optional'}</small></span><Icon name="chevron" size={15}/></summary><div className="edit-step-body"><div className="line-editor"><div className="line-editor-head"><strong>Zusätzliche Positionen</strong><button type="button" className="text-button" onClick={() => setExtraLines((current) => [...current, { id: `il-extra-${Date.now()}`, description: '', quantity: 1, unit: 'Stk.', unitPrice: 0, vatRate: 8.1, sourceTimeEntryIds: [] }])}><Icon name="plus" size={14}/> Position</button></div>{extraLines.map((line) => <div className="line-editor-row" key={line.id}><label><span>Beschreibung</span><Input value={line.description} onChange={(e) => setExtraLines((current) => current.map((item) => item.id === line.id ? { ...item, description: e.target.value } : item))}/></label><label><span>Menge</span><Input type="number" min="0.01" step="0.25" value={line.quantity} onChange={(e) => setExtraLines((current) => current.map((item) => item.id === line.id ? { ...item, quantity: Number(e.target.value) } : item))}/></label><label><span>Einheit</span><Select value={line.unit} onChange={(e) => setExtraLines((current) => current.map((item) => item.id === line.id ? { ...item, unit: e.target.value as InvoiceLine['unit'] } : item))}><option value="h">h</option><option value="Stk.">Stk.</option><option value="pauschal">pauschal</option></Select></label><label><span>Preis CHF</span><Input type="number" min="0" step="0.05" value={line.unitPrice} onChange={(e) => setExtraLines((current) => current.map((item) => item.id === line.id ? { ...item, unitPrice: Number(e.target.value) } : item))}/></label><label><span>MWST %</span><Input type="number" min="0" step="0.1" value={line.vatRate} onChange={(e) => setExtraLines((current) => current.map((item) => item.id === line.id ? { ...item, vatRate: Number(e.target.value) } : item))}/></label><RemoveButton className="line-remove" ariaLabel="Position entfernen" onClick={() => setExtraLines((current) => current.filter((item) => item.id !== line.id))} /></div>)}</div></div></details>
        </ResponsiveOverlay>
      )}

      <ResponsivePreview
        open={Boolean(preview)}
        title={preview?.number ?? 'Rechnung'}
        subtitle={preview?.customerName}
        onClose={() => setPreview(null)}
        headerActions={preview ? <button className="icon-button" onClick={() => printCurrentDocument()} title="PDF / Drucken"><Icon name="download" size={16}/></button> : null}
        warning={preview && readiness(preview).length > 0 ? <div className="document-warning"><strong>Noch nicht versandbereit</strong><span>Fehlend: {readiness(preview).join(', ')}</span></div> : null}
        actions={preview ? <>
          {previewIsDraft && <button className="button secondary" onClick={() => setEditing(preview)}><Icon name="edit" size={15}/> Bearbeiten</button>}
          {previewCanSend && <button className="button secondary" disabled={readiness(preview).length > 0} onClick={() => setSending({ invoice: preview, mode: 'invoice' })}><Icon name="send" size={15}/> {previewIsDraft ? 'Per E-Mail senden' : 'Erneut per E-Mail senden'}</button>}
          {previewCanRemind && <button className="button secondary" onClick={() => setSending({ invoice: preview, mode: 'reminder' })}><Icon name="warning" size={15}/> Mahnung</button>}
          {previewCanCredit && <button className="button secondary" onClick={() => setCreditInvoice(preview)}>Gutschrift</button>}
          {previewCanCancel && <button className="button secondary" onClick={() => setCancelInvoiceTarget(preview)}>Stornieren</button>}
          {previewCanRecordPayment && <button className="button primary" onClick={() => setPayment(preview)}><Icon name="credit-card" size={15}/> Zahlung erfassen</button>}
        </> : null}
        mobileActions={preview ? <>
          {previewIsDraft && <button className="button secondary" onClick={() => setEditing(preview)}><Icon name="edit" size={15}/> Bearbeiten</button>}
          {previewCanSend && <button className="button primary" disabled={readiness(preview).length > 0} onClick={() => setSending({ invoice: preview, mode: 'invoice' })}><Icon name="send" size={15}/> {previewIsDraft ? 'Per E-Mail senden' : 'Erneut per E-Mail senden'}</button>}
          {previewCanRecordPayment && <button className="button secondary" onClick={() => setPayment(preview)}><Icon name="credit-card" size={15}/> Zahlung</button>}
        </> : null}
        mobileMoreActions={preview && previewHasMoreActions ? <>
          {previewCanRemind && <button className="button secondary" onClick={() => setSending({ invoice: preview, mode: 'reminder' })}><Icon name="warning" size={15}/> Mahnung senden</button>}
          {previewCanCredit && <button className="button secondary" onClick={() => setCreditInvoice(preview)}>Gutschrift erstellen</button>}
          {previewCanCancel && <button className="button secondary" onClick={() => setCancelInvoiceTarget(preview)}>Rechnung stornieren</button>}
        </> : null}
      >
        {preview ? <DocumentPreviewFrame><BusinessDocument type="invoice" company={store.companyProfile} customer={documentCustomer(preview)} invoice={preview}/></DocumentPreviewFrame> : null}
      </ResponsivePreview>

      {editing && <InvoiceEditor invoice={editing} onClose={() => setEditing(null)} onSave={(updated) => { setEditing(null); setPreview(updated) }} />}
      {sending && <SendDialog invoice={sending.invoice} mode={sending.mode} onClose={() => setSending(null)} onSent={(updated) => { setSending(null); setPreview(updated); feedback.success(sending.mode === 'reminder' ? 'Mahnversand wurde eingeplant.' : 'Versandauftrag wurde gespeichert.') }} />}
      {payment && <PaymentDialog invoice={payment} onClose={() => setPayment(null)} />}
      {creditInvoice && <CreditDialog invoice={creditInvoice} onClose={() => setCreditInvoice(null)} />}
      {paymentPicker && <ResponsiveOverlay open={paymentPicker} title="Zahlung erfassen" description="Offene Rechnung auswählen" onClose={() => setPaymentPicker(false)}><div className="compact-list">{store.invoices.filter((item) => ['sent', 'partial', 'overdue'].includes(effectiveInvoiceStatus(item))).map((item) => <button type="button" className="payment-pick-row" key={item.id} onClick={() => { setPaymentPicker(false); setPayment(item) }}><span className="primary-cell"><strong>{item.number} · {item.customerName}</strong><small>{chf(invoiceOpenAmount(item))} offen</small></span><Icon name="chevron" size={15}/></button>)}</div></ResponsiveOverlay>}
      <ConfirmationDialog
        open={Boolean(cancelInvoiceTarget)}
        title="Rechnung stornieren?"
        description="Dieser Vorgang kann nicht rückgängig gemacht werden."
        confirmLabel="Stornieren"
        destructive
        onCancel={() => setCancelInvoiceTarget(null)}
        onConfirm={() => {
          if (!cancelInvoiceTarget) return
          const updated = store.cancelInvoice(cancelInvoiceTarget.id)
          setCancelInvoiceTarget(null)
          if (updated) {
            setPreview(updated)
            feedback.success('Rechnung storniert.')
          } else {
            feedback.error('Rechnung konnte nicht storniert werden.')
          }
        }}
      />
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
    return <StandardFormSheet open title={<>Rechnung bearbeiten</>} description={<>{invoice.number} · nur Entwürfe sind änderbar</>} onClose={onClose} onSubmit={save} formId="invoices-page-sheet-1" footer={<><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button type="submit" form="invoices-page-sheet-1" className="button primary">Speichern</button></>} mode="fullscreen">{error && <div className="field-error">{error}</div>}<details className="edit-step" open><summary><span><strong>1 · Empfänger und Daten</strong><small>Adresse, Datum und Zahlungsziel</small></span><Icon name="chevron" size={15}/></summary><div className="edit-step-body"><div className="form-grid">
      <label><span>Empfänger *</span><Input value={draft.recipientName ?? ''} onChange={(e) => setDraft({ ...draft, recipientName: e.target.value })} required/></label><label><span>E-Mail *</span><Input type="email" value={draft.recipientEmail ?? ''} onChange={(e) => setDraft({ ...draft, recipientEmail: e.target.value })} required/></label><label className="full"><span>Adresse *</span><Input value={draft.recipientAddress ?? ''} onChange={(e) => setDraft({ ...draft, recipientAddress: e.target.value })} required/></label><label><span>PLZ *</span><Input value={draft.recipientZip ?? ''} onChange={(e) => setDraft({ ...draft, recipientZip: e.target.value })} required/></label><label><span>Ort *</span><Input value={draft.recipientCity ?? ''} onChange={(e) => setDraft({ ...draft, recipientCity: e.target.value })} required/></label><label><span>Rechnungsdatum *</span><DatePicker value={draft.issueDate} onChange={(e) => setDraft({ ...draft, issueDate: e.target.value })} required/></label><label><span>Fällig *</span><DatePicker value={draft.due} onChange={(e) => setDraft({ ...draft, due: e.target.value })} required/></label></div></div></details><details className="edit-step"><summary><span><strong>2 · Positionen</strong><small>{draft.lines.length} Positionen</small></span><Icon name="chevron" size={15}/></summary><div className="edit-step-body"><div className="line-editor"><div className="line-editor-head"><strong>Positionen</strong><button type="button" className="text-button" onClick={() => setDraft((cur) => ({ ...cur, lines: [...cur.lines, { id: `il-${Date.now()}`, description: '', quantity: 1, unit: 'Stk.', unitPrice: 0, vatRate: 8.1, sourceTimeEntryIds: [] }] }))}><Icon name="plus" size={14}/> Position</button></div>{draft.lines.map((line) => <div className="line-editor-row" key={line.id}><label><span>Beschreibung *</span><Input value={line.description} onChange={(e) => updateLine(line.id, { description: e.target.value })} required/></label><label><span>Menge</span><Input type="number" min="0.01" step="0.25" value={line.quantity} onChange={(e) => updateLine(line.id, { quantity: Number(e.target.value) })}/></label><label><span>Einheit</span><Select value={line.unit} onChange={(e) => updateLine(line.id, { unit: e.target.value as InvoiceLine['unit'] })}><option value="h">h</option><option value="Stk.">Stk.</option><option value="pauschal">pauschal</option></Select></label><label><span>Preis CHF</span><Input type="number" min="0" step="0.05" value={line.unitPrice} onChange={(e) => updateLine(line.id, { unitPrice: Number(e.target.value) })}/></label><label><span>MWST %</span><Input type="number" min="0" step="0.1" value={line.vatRate} onChange={(e) => updateLine(line.id, { vatRate: Number(e.target.value) })}/></label><RemoveButton className="line-remove" ariaLabel="Position entfernen" disabled={draft.lines.length === 1} onClick={() => setDraft((cur) => ({ ...cur, lines: cur.lines.filter((item) => item.id !== line.id) }))} /></div>)}</div></div></details><details className="edit-step"><summary><span><strong>3 · Texte</strong><small>Einleitung und Schlusstext</small></span><Icon name="chevron" size={15}/></summary><div className="edit-step-body"><label className="block-field"><span>Einleitungstext</span><Textarea rows={4} value={draft.introText ?? store.documentTemplates.invoiceIntro} onChange={(e) => setDraft({ ...draft, introText: e.target.value })}/></label><label className="block-field"><span>Schlusstext</span><Textarea rows={4} value={draft.outroText ?? store.documentTemplates.invoiceOutro} onChange={(e) => setDraft({ ...draft, outroText: e.target.value })}/></label></div></details></StandardFormSheet>
  }

  function SendDialog({ invoice, mode, onClose, onSent }: { invoice: Invoice; mode: 'invoice' | 'reminder'; onClose: () => void; onSent: (invoice: Invoice) => void }) {
    const customer = documentCustomer(invoice)
    const [to, setTo] = useState(invoice.recipientEmail || customer?.email || '')
    const [busy, setBusy] = useState(false)
    const [key] = useState(() => crypto.randomUUID())
    async function save(event: React.FormEvent) {
      event.preventDefault()
      if (busy) return
      setBusy(true)
      try { await store.queueDocumentMail(mode, invoice.id, to, key); onSent(invoice) }
      catch (error) { feedback.error(error instanceof Error ? error.message : 'Versand fehlgeschlagen.') }
      finally { setBusy(false) }
    }
    return <StandardFormSheet open title={<>{mode === 'reminder' ? 'Mahnung per E-Mail senden' : 'Rechnung per E-Mail senden'}</>} description={<>Versand mit druckbarer HTML-Datei über die Warteschlange. Der Status wird nach Annahme durch den Maildienst aktualisiert.</>} onClose={onClose} onSubmit={save} formId="invoices-page-sheet-2" footer={<><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button type="submit" form="invoices-page-sheet-2" className="button primary" disabled={busy}><Icon name="send" size={15}/> Versand einplanen</button></>}><div className="form-grid"><label className="full"><span>Empfänger *</span><Input type="email" value={to} onChange={(e) => setTo(e.target.value)} required/></label></div></StandardFormSheet>
  }

  function CreditDialog({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
    const remaining = Math.max(0, invoice.amount - (invoice.creditedAmount ?? 0))
    const [amount, setAmount] = useState(String(remaining))
    const [reason, setReason] = useState('')
    function save(event: React.FormEvent) {
      event.preventDefault()
      const credit = store.createCreditNote(invoice.id, Number(amount), reason)
      if (!credit) { feedback.error('Gutschrift konnte nicht erstellt werden.'); return }
      const updated = store.invoices.find((item) => item.id === invoice.id)
      if (updated) setPreview(updated)
      feedback.success(`Gutschrift ${credit.number} wurde erstellt.`)
      onClose()
    }
    return <StandardFormSheet open title={<>Gutschrift erstellen</>} description={<>{invoice.number} · maximal {chf(remaining)}</>} onClose={onClose} onSubmit={save} formId="credit-form" footer={<><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button type="submit" form="credit-form" className="button primary">Gutschrift erstellen</button></>}><div className="form-grid"><label><span>Betrag *</span><Input type="number" min="0.01" max={remaining} step="0.05" value={amount} onChange={(e) => setAmount(e.target.value)} required/></label><label className="full"><span>Grund *</span><Textarea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Grund der Korrektur" required/></label></div></StandardFormSheet>
  }

  function PaymentDialog({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
    const openAmount = Math.max(0, invoice.amount - (invoice.creditedAmount ?? 0) - invoice.paidAmount)
    const [amount, setAmount] = useState(String(Math.round(openAmount * 100) / 100))
    const [method, setMethod] = useState<Payment['method']>('Bank')
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
    const [reference, setReference] = useState('')
    function save(e: React.FormEvent) { e.preventDefault(); store.recordPayment(invoice.id, Number(amount), method, date, reference); onClose(); setPreview(null) }
    return <StandardFormSheet open title={<>Zahlung erfassen</>} description={<>{invoice.number} · offen {chf(openAmount)}</>} onClose={onClose} onSubmit={save} formId="invoices-page-sheet-3" footer={<><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button type="submit" form="invoices-page-sheet-3" className="button primary">Zahlung speichern</button></>}><div className="form-grid"><label><span>Betrag *</span><Input type="number" min="0.01" max={openAmount} step="0.05" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} required/></label><label><span>Zahlungsdatum *</span><DatePicker value={date} onChange={(e) => setDate(e.target.value)} required/></label><label><span>Zahlungsart *</span><Select value={method} onChange={(e) => setMethod(e.target.value as Payment['method'])}><option>Bank</option><option>Bar</option><option>Kreditkarte</option><option>Sonstige</option></Select></label><label><span>Referenz</span><Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="z. B. ESR-/Bankreferenz"/></label></div></StandardFormSheet>
  }
}

function fmt(value?: string) { return formatDate(value) }

function invoiceStatusLabel(value: string) { const labels: Record<string, string> = { draft: 'Entwurf', sent: 'Versendet', partial: 'Teilbezahlt', paid: 'Bezahlt', overdue: 'Überfällig', cancelled: 'Storniert' }; return labels[value] ?? value }
