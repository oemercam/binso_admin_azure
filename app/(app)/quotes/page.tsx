'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'
import { BusinessDocument } from '@/components/documents/business-document'
import { useBusinessStore } from '@/components/state/business-store'
import type { Quote, QuoteLine, QuoteStatus } from '@/types/domain'

const chf = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', minimumFractionDigits: 2 })
const labels: Record<QuoteStatus, string> = { draft: 'Entwurf', sent: 'Versendet', accepted: 'Angenommen', declined: 'Abgelehnt', expired: 'Abgelaufen' }

export default function QuotesPage() {
  const store = useBusinessStore()
  const [preview, setPreview] = useState<Quote | null>(null)
  const [editing, setEditing] = useState<Quote | null>(null)
  const [sending, setSending] = useState<Quote | null>(null)
  const [creating, setCreating] = useState(false)
  const [notice, setNotice] = useState('')

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

  function orderFromQuote() {
    if (!preview) return
    const order = store.createOrderFromQuote(preview.id)
    setNotice(order ? `Auftrag «${order.name}» wurde erstellt.` : 'Das Angebot muss zuerst angenommen werden.')
  }

  return <section className="page">
    <PageHeader eyebrow="VERKAUF" title="Angebote" description="Erstellen, bearbeiten, als PDF prüfen, versenden und in Aufträge überführen." action={<button className="button primary" onClick={() => setCreating(true)}><Icon name="plus" size={16}/> Angebot erstellen</button>} />
    {notice && <div className="inline-notice"><Icon name="check" size={15}/><span>{notice}</span></div>}
    <div className="data-list"><div className="data-row quote-grid data-head"><span>Angebot</span><span>Kunde</span><span>Gültig bis</span><span>Betrag</span><span>Status</span><span /></div>{store.quotes.map((quote) => <div className="data-row quote-grid" key={quote.id}><span className="primary-cell"><strong>{quote.number} · {quote.title}</strong><small>Version {quote.version} · {quote.lines.length} Positionen</small></span><span>{quote.customerName}</span><span>{quote.validUntil}</span><span>{chf.format(quote.amount)}</span><span className={`status ${quote.status}`}>{labels[quote.status]}</span><button className="row-link" onClick={() => setPreview(quote)}><Icon name="chevron" size={15}/></button></div>)}</div>

    {preview && <div className="overlay-layer document-overlay" onMouseDown={() => setPreview(null)}><div className="document-preview-shell" onMouseDown={(e) => e.stopPropagation()}><div className="preview-toolbar"><div><strong>{preview.number}</strong><span>{preview.customerName}</span></div><div><button className="icon-button" onClick={() => window.print()}><Icon name="download" size={16}/></button><button className="icon-button" onClick={() => setPreview(null)}><Icon name="close" size={16}/></button></div></div>{missing(preview).length > 0 && <div className="document-warning"><strong>Noch nicht versandbereit</strong><span>Fehlend: {missing(preview).join(', ')}</span></div>}<BusinessDocument type="quote" company={store.companyProfile} customer={customerFor(preview)} quote={preview}/><div className="preview-actions"><button className="button secondary" onClick={() => setEditing(preview)}><Icon name="edit" size={15}/> Bearbeiten</button><button className="button secondary" disabled={missing(preview).length > 0} onClick={() => setSending(preview)}><Icon name="send" size={15}/> {preview.status === 'sent' ? 'Erneut senden' : 'Senden'}</button>{preview.status !== 'accepted' ? <button className="button primary" onClick={() => { store.updateQuote(preview.id, { status: 'accepted' }); setPreview({ ...preview, status: 'accepted' }) }}><Icon name="check" size={15}/> Angenommen</button> : <button className="button primary" onClick={orderFromQuote}><Icon name="orders" size={15}/> Auftrag erstellen</button>}</div></div></div>}

    {creating && <QuoteForm onClose={() => setCreating(false)} onSave={(quote) => { setCreating(false); setPreview(quote) }} />}
    {editing && <QuoteEdit quote={editing} onClose={() => setEditing(null)} onSave={(quote) => { setEditing(null); setPreview(quote) }} />}
    {sending && <QuoteSend quote={sending} onClose={() => setSending(null)} onSent={(quote) => { setSending(null); setPreview(quote); setNotice('Angebot im Demo-Versand als versendet markiert.') }} />}
  </section>

  function QuoteForm({ onClose, onSave }: { onClose: () => void; onSave: (q: Quote) => void }) {
    const [customerId, setCustomerId] = useState(store.customers[0]?.id ?? '')
    const [title, setTitle] = useState('')
    const [validUntil, setValidUntil] = useState('2026-10-31')
    const [line, setLine] = useState<QuoteLine>({ id: `ql-${Date.now()}`, description: '', quantity: 1, unit: 'h', unitPrice: 165, vatRate: 8.1 })
    function save(e: React.FormEvent) { e.preventDefault(); const q = store.createQuote({ customerId, title, validUntil, lines: [line] }); if (q) onSave(q) }
    return <div className="overlay-layer sheet-layer"><form className="form-sheet" onSubmit={save}><div className="sheet-heading"><div><strong>Angebot erstellen</strong><span>Pflichtfelder und Rechnungsadresse werden geprüft.</span></div><button type="button" className="icon-button" onClick={onClose}><Icon name="close" size={17}/></button></div><div className="form-grid"><label className="full"><span>Kunde *</span><select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>{store.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label className="full"><span>Titel *</span><input value={title} onChange={(e) => setTitle(e.target.value)} required/></label><label><span>Gültig bis *</span><input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} required/></label></div><div className="editor-lines"><div className="editor-line"><input placeholder="Beschreibung *" value={line.description} onChange={(e) => setLine({ ...line, description: e.target.value })} required/><input type="number" step="0.25" value={line.quantity} onChange={(e) => setLine({ ...line, quantity: Number(e.target.value) })}/><input type="number" step="0.05" value={line.unitPrice} onChange={(e) => setLine({ ...line, unitPrice: Number(e.target.value) })}/></div></div><div className="sheet-actions"><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button className="button primary">Entwurf erstellen</button></div></form></div>
  }

  function QuoteEdit({ quote, onClose, onSave }: { quote: Quote; onClose: () => void; onSave: (q: Quote) => void }) {
    const customer = customerFor(quote)
    const [draft, setDraft] = useState<Quote>({ ...quote, recipientName: quote.recipientName || customer?.legalName || customer?.name, recipientAddress: quote.recipientAddress || customer?.address, recipientZip: quote.recipientZip || customer?.zip, recipientCity: quote.recipientCity || customer?.city, recipientCountry: quote.recipientCountry || customer?.country, recipientEmail: quote.recipientEmail || customer?.email, introText: quote.introText || store.documentTemplates.quoteIntro, outroText: quote.outroText || store.documentTemplates.quoteOutro })
    function save(e: React.FormEvent) { e.preventDefault(); store.updateQuote(quote.id, draft); onSave(draft) }
    function updateLine(id: string, changes: Partial<QuoteLine>) { setDraft((cur) => ({ ...cur, lines: cur.lines.map((line) => line.id === id ? { ...line, ...changes } : line) })) }
    return <div className="overlay-layer sheet-layer"><form className="form-sheet document-editor" onSubmit={save}><div className="sheet-heading"><div><strong>Angebot bearbeiten</strong><span>{quote.number}</span></div><button type="button" className="icon-button" onClick={onClose}><Icon name="close" size={17}/></button></div><div className="form-grid"><label><span>Empfänger *</span><input value={draft.recipientName ?? ''} onChange={(e) => setDraft({ ...draft, recipientName: e.target.value })} required/></label><label><span>E-Mail *</span><input type="email" value={draft.recipientEmail ?? ''} onChange={(e) => setDraft({ ...draft, recipientEmail: e.target.value })} required/></label><label className="full"><span>Adresse *</span><input value={draft.recipientAddress ?? ''} onChange={(e) => setDraft({ ...draft, recipientAddress: e.target.value })} required/></label><label><span>PLZ *</span><input value={draft.recipientZip ?? ''} onChange={(e) => setDraft({ ...draft, recipientZip: e.target.value })} required/></label><label><span>Ort *</span><input value={draft.recipientCity ?? ''} onChange={(e) => setDraft({ ...draft, recipientCity: e.target.value })} required/></label><label className="full"><span>Einleitungstext</span><textarea rows={4} value={draft.introText ?? ''} onChange={(e) => setDraft({ ...draft, introText: e.target.value })}/></label></div><div className="editor-lines">{draft.lines.map((line) => <div className="editor-line" key={line.id}><input value={line.description} onChange={(e) => updateLine(line.id, { description: e.target.value })}/><input type="number" step="0.25" value={line.quantity} onChange={(e) => updateLine(line.id, { quantity: Number(e.target.value) })}/><input type="number" step="0.05" value={line.unitPrice} onChange={(e) => updateLine(line.id, { unitPrice: Number(e.target.value) })}/></div>)}</div><label className="block-field"><span>Schlusstext</span><textarea rows={4} value={draft.outroText ?? ''} onChange={(e) => setDraft({ ...draft, outroText: e.target.value })}/></label><div className="sheet-actions"><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button className="button primary">Speichern</button></div></form></div>
  }

  function QuoteSend({ quote, onClose, onSent }: { quote: Quote; onClose: () => void; onSent: (q: Quote) => void }) {
    const customer = customerFor(quote)
    const [to, setTo] = useState(quote.recipientEmail || customer?.email || '')
    const [subject, setSubject] = useState(store.documentTemplates.quoteEmailSubject.replaceAll('{{number}}', quote.number))
    const [body, setBody] = useState(store.documentTemplates.quoteEmailBody.replaceAll('{{number}}', quote.number).replaceAll('{{customer}}', quote.customerName))
    function send(e: React.FormEvent) { e.preventDefault(); const q = store.sendQuote(quote.id, to); if (q) onSent(q) }
    return <div className="overlay-layer sheet-layer"><form className="form-sheet compact-sheet" onSubmit={send}><div className="sheet-heading"><div><strong>Angebot versenden</strong><span>PDF-Vorschau entspricht dem Dokument im Anhang.</span></div><button type="button" className="icon-button" onClick={onClose}><Icon name="close" size={17}/></button></div><div className="form-grid"><label className="full"><span>Empfänger *</span><input type="email" value={to} onChange={(e) => setTo(e.target.value)} required/></label><label className="full"><span>Betreff *</span><input value={subject} onChange={(e) => setSubject(e.target.value)} required/></label><label className="full"><span>Nachricht *</span><textarea rows={8} value={body} onChange={(e) => setBody(e.target.value)} required/></label></div><div className="demo-hint">Demo-Versand: Status und Empfänger werden gespeichert. Echter E-Mail-Versand mit PDF-Anhang folgt über Microsoft Graph oder Maildienst.</div><div className="sheet-actions"><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button className="button primary"><Icon name="send" size={15}/> Senden</button></div></form></div>
  }
}
