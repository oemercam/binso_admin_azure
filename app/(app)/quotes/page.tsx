'use client'

import { DatePicker, Select, Textarea, Input } from '@/components/ui/form-controls'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'
import { RemoveButton } from '@/components/ui/close-button'
import { StandardFormSheet } from '@/components/ui/sheet-system'
import { InteractiveRow } from '@/components/ui/interactive-row'
import { BusinessDocument } from '@/components/documents/business-document'
import { DocumentPreviewFrame } from '@/components/documents/document-preview-frame'
import { ResponsivePreview } from '@/components/documents/responsive-preview'
import { useBusinessStore } from '@/components/state/business-store'
import type { Quote, QuoteLine, QuoteStatus } from '@/types/domain'
import { printCurrentDocument } from '@/lib/browser/actions'
import { useFeedback } from '@/components/ui/feedback'
import { formatChf } from '@/lib/format/locale'
const chf = (value: number) => formatChf(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const labels: Record<QuoteStatus, string> = { draft: 'Entwurf', sent: 'Versendet', accepted: 'Angenommen', declined: 'Abgelehnt', expired: 'Abgelaufen', revised: 'Ersetzt' }
const newLine = (): QuoteLine => ({ id: `ql-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, description: '', quantity: 1, unit: 'h', unitPrice: 165, vatRate: 8.1 })

export default function QuotesPage() {
  const store = useBusinessStore()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [preview, setPreview] = useState<Quote | null>(null)
  const [editing, setEditing] = useState<Quote | null>(null)
  const [sending, setSending] = useState<Quote | null>(null)
  const [creating, setCreating] = useState(false)
  const feedback = useFeedback()

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const createRequested = params.get('new') === '1'
    const viewId = params.get('view')
    const viewQuote = viewId ? store.quotes.find((item) => item.id === viewId) : undefined
    if (!createRequested && !viewQuote) return
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      if (createRequested) setCreating(true)
      if (viewQuote) setPreview(viewQuote)
    })
    if (createRequested) params.delete('new')
    if (viewQuote) params.delete('view')
    const suffix = params.toString() ? `?${params.toString()}` : ''
    router.replace(`${pathname}${suffix}`, { scroll: false })
    return () => { cancelled = true }
  }, [pathname, router, searchParams, store.quotes])

  function customerFor(quote: Quote) { return store.customers.find((customer) => customer.id === quote.customerId) }
  function missing(quote: Quote) {
    const customer = customerFor(quote)
    return [
      !quote.recipientName && !customer?.name ? 'Empfänger' : '',
      !quote.recipientAddress && !customer?.address ? 'Adresse' : '',
      !quote.recipientZip && !customer?.zip ? 'PLZ' : '',
      !quote.recipientCity && !customer?.city ? 'Ort' : '',
      !quote.recipientEmail && !customer?.email ? 'E-Mail' : '',
      !quote.validUntil ? 'Gültigkeit' : '',
      !quote.lines.length ? 'Positionen' : '',
    ].filter(Boolean)
  }

  function setStatus(status: QuoteStatus) {
    if (!preview) return
    store.updateQuote(preview.id, { status })
    setPreview({ ...preview, status })
    if (status === 'accepted') feedback.success('Angebot als angenommen markiert.')
    if (status === 'declined') feedback.info('Angebot als abgelehnt markiert.')
  }

  function orderFromQuote() {
    if (!preview) return
    const existing = store.orders.find((order) => order.sourceQuoteId === preview.id || (order.customerId === preview.customerId && order.name === preview.title))
    if (existing) {
      setPreview(null)
      router.push(`/orders/${existing.id}`)
      return
    }
    const order = store.createOrderFromQuote(preview.id)
    if (order) {
      feedback.success(`Auftrag «${order.name}» wurde erstellt.`)
      setPreview(null)
      router.push(`/orders/${order.id}`)
      return
    }
    feedback.warning('Das Angebot muss zuerst angenommen werden.')
  }

  function invoiceFromQuote() {
    if (!preview) return
    const existing = store.invoices.find((invoice) => invoice.customerId === preview.customerId && invoice.reference === preview.number && invoice.status !== 'cancelled')
    if (existing) {
      setPreview(null)
      router.push(`/invoices?view=${existing.id}`)
      return
    }
    const invoice = store.createInvoiceFromQuote(preview.id)
    if (!invoice) { feedback.warning('Das Angebot muss zuerst angenommen werden.'); return }
    feedback.success(`Rechnung ${invoice.number} wurde als Entwurf erstellt.`)
    setPreview(null)
    router.push(`/invoices?view=${invoice.id}`)
  }

  function createRevision() {
    if (!preview) return
    const revision = store.createQuoteRevision(preview.id)
    if (!revision) return
    setPreview(revision)
    setEditing(revision)
    feedback.success(`Neue Version ${revision.version} als Entwurf erstellt.`)
  }

  const previewIsDraft = preview?.status === 'draft'
  const previewIsSent = preview?.status === 'sent'
  const previewIsAccepted = preview?.status === 'accepted'
  const previewCanRecordDispatch = Boolean(preview && ['draft', 'sent'].includes(preview.status))
  const previewCanDecide = previewIsSent
  const previewCanRevise = Boolean(preview && ['sent', 'declined', 'expired'].includes(preview.status))
  const previewExistingOrder = preview ? store.orders.find((order) => order.sourceQuoteId === preview.id || order.mandateRef === preview.number) : undefined
  const previewExistingInvoice = preview ? store.invoices.find((invoice) => invoice.status !== 'cancelled' && (invoice.sourceQuoteId === preview.id || invoice.reference === preview.number)) : undefined
  const previewHasMoreActions = Boolean(preview && (previewCanDecide || previewCanRevise || previewIsAccepted))

  return <section className="page apple-page mobile-standard-page">
    <PageHeader title="Angebote" description="Angebote erstellen, bearbeiten, prüfen und weiterverarbeiten." action={<button className="button primary page-primary-action" onClick={() => setCreating(true)} aria-label="Angebot erstellen" title="Angebot erstellen"><Icon name="plus" size={16}/><span>Angebot erstellen</span></button>} />

    <div className="data-list compact-overview-list">
      <div className="data-row quote-grid data-head"><span>Angebot</span><span>Kunde</span><span>Gültig bis</span><span>Betrag</span><span>Status</span><span /></div>
      {store.quotes.map((quote) => <InteractiveRow className="data-row quote-grid compact-overview-row" key={quote.id} onActivate={() => setPreview(quote)} ariaLabel={`${quote.number} öffnen`}><span className="primary-cell"><strong>{quote.number} · {quote.title}</strong><small className="desktop-row-detail">Version {quote.version} · {quote.lines.length} Positionen</small><small className="mobile-row-summary">{quote.customerName}</small></span><span className="overview-desktop-cell">{quote.customerName}</span><span className="overview-desktop-cell">{quote.validUntil}</span><span className="overview-desktop-cell">{chf(quote.amount)}</span><span className={`status ${quote.status} overview-desktop-cell`}>{labels[quote.status]}</span><span className="row-disclosure" aria-hidden="true"><Icon name="chevron" size={15}/></span></InteractiveRow>)}
    </div>

    <ResponsivePreview
      open={Boolean(preview)}
      title={preview ? `${preview.number} · Version ${preview.version}` : 'Angebot'}
      subtitle={preview?.customerName}
      onClose={() => setPreview(null)}
      headerActions={preview ? <button className="icon-button" onClick={() => printCurrentDocument()} title="PDF / Drucken"><Icon name="download" size={16}/></button> : null}
      warning={preview && missing(preview).length > 0 ? <div className="document-warning"><strong>Noch nicht versandbereit</strong><span>Fehlend: {missing(preview).join(', ')}</span></div> : null}
      actions={preview ? <>
        {previewIsDraft && <button className="button secondary" onClick={() => setEditing(preview)}><Icon name="edit" size={15}/> Bearbeiten</button>}
        {previewCanRecordDispatch && <button className="button secondary" disabled={missing(preview).length > 0} onClick={() => setSending(preview)}><Icon name="send" size={15}/> {previewIsSent ? 'Versand erneut erfassen' : 'Als versendet markieren'}</button>}
        {previewCanDecide && <button className="button secondary" onClick={() => setStatus('accepted')}><Icon name="check" size={15}/> Als angenommen markieren</button>}
        {previewCanDecide && <button className="button secondary" onClick={() => setStatus('declined')}>Als abgelehnt markieren</button>}
        {previewIsAccepted && <button className="button primary" onClick={orderFromQuote}><Icon name="orders" size={15}/> {previewExistingOrder ? 'Auftrag öffnen' : 'Auftrag erstellen'}</button>}
        {previewIsAccepted && <button className="button secondary" onClick={invoiceFromQuote}><Icon name="invoices" size={15}/> {previewExistingInvoice ? 'Direktrechnung öffnen' : 'Direktrechnung erstellen'}</button>}
        {previewCanRevise && <button className="button secondary" onClick={createRevision}>Neue Version erstellen</button>}
      </> : null}
      mobileActions={preview ? <>
        {previewIsDraft && <button className="button secondary" onClick={() => setEditing(preview)}><Icon name="edit" size={15}/> Bearbeiten</button>}
        {previewCanRecordDispatch && <button className="button primary" disabled={missing(preview).length > 0} onClick={() => setSending(preview)}><Icon name="send" size={15}/> {previewIsSent ? 'Versand erfassen' : 'Als versendet markieren'}</button>}
        {previewIsAccepted && <button className="button primary" onClick={orderFromQuote}><Icon name="orders" size={15}/> {previewExistingOrder ? 'Auftrag öffnen' : 'Auftrag erstellen'}</button>}
      </> : null}
      mobileMoreActions={preview && previewHasMoreActions ? <>
        {previewCanDecide && <button className="button secondary" onClick={() => setStatus('accepted')}><Icon name="check" size={15}/> Als angenommen markieren</button>}
        {previewCanDecide && <button className="button secondary" onClick={() => setStatus('declined')}>Als abgelehnt markieren</button>}
        {previewIsAccepted && <button className="button secondary" onClick={invoiceFromQuote}><Icon name="invoices" size={15}/> {previewExistingInvoice ? 'Direktrechnung öffnen' : 'Direktrechnung erstellen'}</button>}
        {previewCanRevise && <button className="button secondary" onClick={createRevision}>Neue Version erstellen</button>}
      </> : null}
    >
      {preview ? <DocumentPreviewFrame><BusinessDocument type="quote" company={store.companyProfile} customer={customerFor(preview)} quote={preview}/></DocumentPreviewFrame> : null}
    </ResponsivePreview>

    {creating && <QuoteForm onClose={() => setCreating(false)} onSave={(quote) => { setCreating(false); setPreview(quote) }} />}
    {editing && <QuoteEdit quote={editing} onClose={() => setEditing(null)} onSave={(quote) => { setEditing(null); setPreview(quote) }} />}
    {sending && <QuoteSend quote={sending} onClose={() => setSending(null)} onSent={(quote) => { setSending(null); setPreview(quote); feedback.success('Versandstatus des Angebots wurde gespeichert.') }} />}
  </section>

  function QuoteForm({ onClose, onSave }: { onClose: () => void; onSave: (q: Quote) => void }) {
    const requestedCustomer = searchParams.get('customer')
    const [customerId, setCustomerId] = useState(requestedCustomer && store.customers.some((item) => item.id === requestedCustomer) ? requestedCustomer : store.customers.find((item) => item.status === 'active')?.id ?? '')
    const [title, setTitle] = useState('')
    const [validUntil, setValidUntil] = useState(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10))
    const [reference, setReference] = useState('')
    const [lines, setLines] = useState<QuoteLine[]>([newLine()])

    function save(e: React.FormEvent) {
      e.preventDefault()
      const validLines = lines.filter((line) => line.description.trim() && line.quantity > 0)
      const q = store.createQuote({ customerId, title, validUntil, reference, lines: validLines })
      if (q) onSave(q)
    }
    function updateLine(id: string, changes: Partial<QuoteLine>) { setLines((current) => current.map((line) => line.id === id ? { ...line, ...changes } : line)) }

    return <StandardFormSheet open title={<>Angebot erstellen</>} description={<>Pflichtfelder und Rechnungsadresse werden geprüft.</>} onClose={onClose} onSubmit={save} formId="quotes-page-sheet-1" panelClassName="quote-editor-sheet" footer={<><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button type="submit" form="quotes-page-sheet-1" className="button primary">Entwurf erstellen</button></>} mode="fullscreen"><details className="edit-step" open><summary><span><strong>1 · Stammdaten</strong><small>Kunde, Titel und Gültigkeit</small></span><Icon name="chevron" size={15}/></summary><div className="edit-step-body"><div className="form-grid"><label className="full"><span>Kunde *</span><Select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>{store.customers.filter((c) => c.status === 'active').map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></label><label className="full"><span>Titel *</span><Input value={title} onChange={(e) => setTitle(e.target.value)} required/></label><label><span>Gültig bis *</span><DatePicker value={validUntil} onChange={(e) => setValidUntil(e.target.value)} required/></label><label><span>Referenz / PO</span><Input value={reference} onChange={(e) => setReference(e.target.value)}/></label></div></div></details><details className="edit-step"><summary><span><strong>2 · Positionen</strong><small>{lines.length} Positionen</small></span><Icon name="chevron" size={15}/></summary><div className="edit-step-body"><div className="line-editor"><div className="line-editor-head"><strong>Positionen</strong><button type="button" className="text-button" onClick={() => setLines((current) => [...current, newLine()])}><Icon name="plus" size={14}/> Position</button></div>{lines.map((line) => <div className="line-editor-row quote-line-editor" key={line.id}><label><span>Beschreibung</span><Input value={line.description} onChange={(e) => updateLine(line.id, { description: e.target.value })} required/></label><label><span>Menge</span><Input type="number" min="0.01" step="0.25" value={line.quantity} onChange={(e) => updateLine(line.id, { quantity: Number(e.target.value) })}/></label><label><span>Einheit</span><Select value={line.unit} onChange={(e) => updateLine(line.id, { unit: e.target.value as QuoteLine['unit'] })}><option value="h">h</option><option value="Tag">Tag</option><option value="pauschal">pauschal</option></Select></label><label><span>Preis CHF</span><Input type="number" min="0" step="0.05" value={line.unitPrice} onChange={(e) => updateLine(line.id, { unitPrice: Number(e.target.value) })}/></label><RemoveButton className="line-remove" ariaLabel="Position entfernen" disabled={lines.length === 1} onClick={() => setLines((current) => current.filter((item) => item.id !== line.id))} /></div>)}</div></div></details></StandardFormSheet>
  }

  function QuoteEdit({ quote, onClose, onSave }: { quote: Quote; onClose: () => void; onSave: (q: Quote) => void }) {
    const customer = customerFor(quote)
    const [draft, setDraft] = useState<Quote>({ ...quote, recipientName: quote.recipientName || customer?.legalName || customer?.name, recipientAddress: quote.recipientAddress || customer?.address, recipientZip: quote.recipientZip || customer?.zip, recipientCity: quote.recipientCity || customer?.city, recipientCountry: quote.recipientCountry || customer?.country, recipientEmail: quote.recipientEmail || customer?.email, introText: quote.introText || store.documentTemplates.quoteIntro, outroText: quote.outroText || store.documentTemplates.quoteOutro })
    function save(e: React.FormEvent) { e.preventDefault(); store.updateQuote(quote.id, draft); const amount = draft.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0); onSave({ ...draft, amount }) }
    function updateLine(id: string, changes: Partial<QuoteLine>) { setDraft((cur) => ({ ...cur, lines: cur.lines.map((line) => line.id === id ? { ...line, ...changes } : line) })) }
    return <StandardFormSheet open title={<>Angebot bearbeiten</>} description={<>{quote.number} · Version {quote.version}</>} onClose={onClose} onSubmit={save} formId="quotes-page-sheet-2" panelClassName="quote-editor-sheet" footer={<><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button type="submit" form="quotes-page-sheet-2" className="button primary">Speichern</button></>} mode="fullscreen"><details className="edit-step" open><summary><span><strong>1 · Empfänger</strong><small>Adresse, E-Mail und Gültigkeit</small></span><Icon name="chevron" size={15}/></summary><div className="edit-step-body"><div className="form-grid"><label><span>Empfänger *</span><Input value={draft.recipientName ?? ''} onChange={(e) => setDraft({ ...draft, recipientName: e.target.value })} required/></label><label><span>E-Mail *</span><Input type="email" value={draft.recipientEmail ?? ''} onChange={(e) => setDraft({ ...draft, recipientEmail: e.target.value })} required/></label><label className="full"><span>Adresse *</span><Input value={draft.recipientAddress ?? ''} onChange={(e) => setDraft({ ...draft, recipientAddress: e.target.value })} required/></label><label><span>PLZ *</span><Input value={draft.recipientZip ?? ''} onChange={(e) => setDraft({ ...draft, recipientZip: e.target.value })} required/></label><label><span>Ort *</span><Input value={draft.recipientCity ?? ''} onChange={(e) => setDraft({ ...draft, recipientCity: e.target.value })} required/></label><label><span>Gültig bis *</span><DatePicker value={draft.validUntil} onChange={(e) => setDraft({ ...draft, validUntil: e.target.value })} required/></label><label><span>Referenz / PO</span><Input value={draft.reference ?? ''} onChange={(e) => setDraft({ ...draft, reference: e.target.value })}/></label><label className="full"><span>Einleitungstext</span><Textarea rows={4} value={draft.introText ?? ''} onChange={(e) => setDraft({ ...draft, introText: e.target.value })}/></label></div></div></details><details className="edit-step"><summary><span><strong>2 · Positionen</strong><small>{draft.lines.length} Positionen</small></span><Icon name="chevron" size={15}/></summary><div className="edit-step-body"><div className="line-editor"><div className="line-editor-head"><strong>Positionen</strong><button type="button" className="text-button" onClick={() => setDraft((cur) => ({ ...cur, lines: [...cur.lines, newLine()] }))}><Icon name="plus" size={14}/> Position</button></div>{draft.lines.map((line) => <div className="line-editor-row quote-line-editor" key={line.id}><label><span>Beschreibung</span><Input value={line.description} onChange={(e) => updateLine(line.id, { description: e.target.value })} required/></label><label><span>Menge</span><Input type="number" step="0.25" value={line.quantity} onChange={(e) => updateLine(line.id, { quantity: Number(e.target.value) })}/></label><label><span>Einheit</span><Select value={line.unit} onChange={(e) => updateLine(line.id, { unit: e.target.value as QuoteLine['unit'] })}><option value="h">h</option><option value="Tag">Tag</option><option value="pauschal">pauschal</option></Select></label><label><span>Preis CHF</span><Input type="number" step="0.05" value={line.unitPrice} onChange={(e) => updateLine(line.id, { unitPrice: Number(e.target.value) })}/></label><RemoveButton className="line-remove" ariaLabel="Position entfernen" disabled={draft.lines.length === 1} onClick={() => setDraft((cur) => ({ ...cur, lines: cur.lines.filter((item) => item.id !== line.id) }))} /></div>)}</div></div></details><details className="edit-step"><summary><span><strong>3 · Schlusstext</strong><small>Individueller Abschluss</small></span><Icon name="chevron" size={15}/></summary><div className="edit-step-body"><label className="block-field"><span>Schlusstext</span><Textarea rows={4} value={draft.outroText ?? ''} onChange={(e) => setDraft({ ...draft, outroText: e.target.value })}/></label></div></details></StandardFormSheet>
  }

  function QuoteSend({ quote, onClose, onSent }: { quote: Quote; onClose: () => void; onSent: (q: Quote) => void }) {
    const customer = customerFor(quote)
    const [to, setTo] = useState(quote.recipientEmail || customer?.email || '')
    function save(event: React.FormEvent) {
      event.preventDefault()
      const updated = store.sendQuote(quote.id, to)
      if (updated) onSent(updated)
    }
    return <StandardFormSheet open title={<>Versand erfassen</>} description={<>Speichert Empfänger, Versandzeitpunkt und Status. Es wird aktuell keine E-Mail verschickt.</>} onClose={onClose} onSubmit={save} formId="quotes-page-sheet-3" footer={<><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button type="submit" form="quotes-page-sheet-3" className="button primary"><Icon name="check" size={15}/> Als versendet markieren</button></>}><div className="form-grid"><label className="full"><span>Empfänger *</span><Input type="email" value={to} onChange={(e) => setTo(e.target.value)} required/></label></div></StandardFormSheet>
  }
}
