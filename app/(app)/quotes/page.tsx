'use client'

import { useState } from 'react'
import { quotes as initialQuotes } from '@/lib/data/demo'
import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'
import type { QuoteStatus } from '@/types/domain'

const chf = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 })

const labels: Record<QuoteStatus, string> = {
  draft: 'Entwurf',
  sent: 'Versendet',
  accepted: 'Angenommen',
  declined: 'Abgelehnt',
  expired: 'Abgelaufen',
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState(initialQuotes)
  const [preview, setPreview] = useState<(typeof quotes)[number] | null>(null)

  function changeStatus(id: string, status: QuoteStatus) {
    setQuotes((current) => current.map((quote) => quote.id === id ? { ...quote, status } : quote))
  }

  return (
    <section className="page">
      <PageHeader
        eyebrow="VERKAUF"
        title="Angebote"
        description="Von der Offerte bis zum Auftrag ohne Medienbruch."
        action={<button className="button primary"><Icon name="plus" size={16}/> Angebot erstellen</button>}
      />

      <div className="workflow-strip">
        <div><strong>{quotes.filter(q => q.status === 'draft').length}</strong><span>Entwurf</span></div>
        <div><strong>{quotes.filter(q => q.status === 'sent').length}</strong><span>Versendet</span></div>
        <div><strong>{quotes.filter(q => q.status === 'accepted').length}</strong><span>Angenommen</span></div>
        <div><strong>{quotes.filter(q => q.status === 'expired').length}</strong><span>Abgelaufen</span></div>
      </div>

      <div className="data-list">
        <div className="data-row quote-grid data-head"><span>Angebot</span><span>Kunde</span><span>Gültig bis</span><span>Betrag</span><span>Status</span><span /></div>
        {quotes.map((quote) => (
          <div className="data-row quote-grid" key={quote.id}>
            <span className="primary-cell"><strong>{quote.number} · {quote.title}</strong><small>Version {quote.version}</small></span>
            <span>{quote.customerName}</span>
            <span>{quote.validUntil}</span>
            <span>{chf.format(quote.amount)}</span>
            <span className={`status ${quote.status}`}>{labels[quote.status]}</span>
            <button className="row-link" onClick={() => setPreview(quote)} aria-label="Angebot öffnen"><Icon name="chevron" size={15}/></button>
          </div>
        ))}
      </div>

      <div className="mobile-record-list">
        {quotes.map((quote) => (
          <article className="mobile-record" key={quote.id} onClick={() => setPreview(quote)}>
            <div className="record-top"><span><strong>{quote.number}</strong><small>{quote.customerName}</small></span><span className={`status ${quote.status}`}>{labels[quote.status]}</span></div>
            <h3>{quote.title}</h3>
            <div className="record-meta"><span>{chf.format(quote.amount)}</span><span>bis {quote.validUntil}</span></div>
          </article>
        ))}
      </div>

      {preview && (
        <div className="overlay-layer" onMouseDown={() => setPreview(null)}>
          <div className="document-preview-shell" onMouseDown={(event) => event.stopPropagation()}>
            <div className="preview-toolbar">
              <div><strong>{preview.number}</strong><span>{preview.customerName}</span></div>
              <div>
                <button className="icon-button" title="Bearbeiten"><Icon name="edit" size={16}/></button>
                <button className="icon-button" title="Duplizieren"><Icon name="copy" size={16}/></button>
                <button className="icon-button" onClick={() => setPreview(null)}><Icon name="close" size={16}/></button>
              </div>
            </div>

            <div className="document-preview">
              <header><div className="preview-logo">BINSO</div><div><strong>ANGEBOT</strong><span>{preview.number}</span></div></header>
              <section><small>Empfänger</small><strong>{preview.customerName}</strong><p>{preview.title}</p></section>
              <div className="preview-total"><span>Total exkl. MWST</span><strong>{chf.format(preview.amount)}</strong></div>
              <footer>Gültig bis {preview.validUntil} · Version {preview.version}</footer>
            </div>

            <div className="preview-actions">
              <button className="button secondary" onClick={() => changeStatus(preview.id, 'declined')}>Ablehnen</button>
              <button className="button secondary" onClick={() => changeStatus(preview.id, 'sent')}><Icon name="send" size={15}/> Erneut senden</button>
              <button className="button primary" onClick={() => changeStatus(preview.id, 'accepted')}><Icon name="check" size={15}/> Als angenommen markieren</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
