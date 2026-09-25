'use client'

import type { CompanyProfile, Customer, Invoice, Quote } from '@/types/domain'

type Props = {
  type: 'invoice' | 'quote' | 'reminder'
  company: CompanyProfile
  customer?: Customer
  invoice?: Invoice
  quote?: Quote
}

const chf = new Intl.NumberFormat('de-CH', {
  style: 'currency',
  currency: 'CHF',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function BusinessDocument({ type, company, customer, invoice, quote }: Props) {
  const isQuote = type === 'quote'
  const number = isQuote ? quote?.number : invoice?.number
  const recipientName = isQuote
    ? quote?.recipientName || customer?.legalName || customer?.name
    : invoice?.recipientName || customer?.legalName || customer?.name
  const address = isQuote ? quote?.recipientAddress || customer?.address : invoice?.recipientAddress || customer?.address
  const zip = isQuote ? quote?.recipientZip || customer?.zip : invoice?.recipientZip || customer?.zip
  const city = isQuote ? quote?.recipientCity || customer?.city : invoice?.recipientCity || customer?.city
  const country = isQuote ? quote?.recipientCountry || customer?.country : invoice?.recipientCountry || customer?.country
  const intro = isQuote ? quote?.introText : invoice?.introText
  const outro = isQuote ? quote?.outroText : invoice?.outroText
  const lines = isQuote ? quote?.lines ?? [] : invoice?.lines ?? []
  const subtotal = isQuote ? quote?.amount ?? 0 : invoice?.subtotal ?? 0
  const vat = isQuote
    ? lines.reduce((sum, line) => sum + line.quantity * line.unitPrice * ((line.vatRate ?? 8.1) / 100), 0)
    : invoice?.vatAmount ?? 0
  const total = subtotal + vat

  return (
    <article className="document-a4" data-document-print>
      <header className="document-head">
        <div className="document-brand">
          <strong>{company.name}</strong>
        </div>
        <div className="document-title">
          <strong>{type === 'invoice' ? 'RECHNUNG' : type === 'quote' ? 'ANGEBOT' : 'ZAHLUNGSERINNERUNG'}</strong>
          <span>{number}</span>
        </div>
      </header>

      <div className="document-address-row">
        <address>
          <small>Empfänger</small>
          <strong>{recipientName}</strong>
          {address && <span>{address}</span>}
          {(zip || city) && <span>{zip} {city}</span>}
          {country && <span>{country}</span>}
        </address>

        <dl className="document-meta">
          <div><dt>Nummer</dt><dd>{number}</dd></div>
          {!isQuote && <div><dt>Rechnungsdatum</dt><dd>{fmt(invoice?.issueDate)}</dd></div>}
          {!isQuote && <div><dt>Fällig</dt><dd>{fmt(invoice?.due)}</dd></div>}
          {!isQuote && <div><dt>Leistungszeitraum</dt><dd>{invoice?.period}</dd></div>}
          {isQuote && <div><dt>Angebotsdatum</dt><dd>{fmt(quote?.issueDate)}</dd></div>}
          {isQuote && <div><dt>Gültig bis</dt><dd>{fmt(quote?.validUntil)}</dd></div>}
          {(isQuote ? quote?.reference : invoice?.reference) && (
            <div><dt>Referenz</dt><dd>{isQuote ? quote?.reference : invoice?.reference}</dd></div>
          )}
        </dl>
      </div>

      <div className="document-copy">
        {isQuote && quote?.title && <h2>{quote.title}</h2>}
        {!isQuote && invoice?.orderName && <h2>{invoice.orderName}</h2>}
        {intro && <p>{intro}</p>}
      </div>

      <div className="document-lines">
        <div className="document-line document-line-head">
          <span>Pos.</span><span>Beschreibung</span><span>Menge</span><span>Preis</span><span>Betrag</span>
        </div>
        {lines.map((line, index) => (
          <div className="document-line" key={line.id}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <span>{line.description}<small> · MWST {line.vatRate ?? 8.1}%</small></span>
            <span>{line.quantity} {line.unit}</span>
            <span>{chf.format(line.unitPrice)}</span>
            <strong>{chf.format(line.quantity * line.unitPrice)}</strong>
          </div>
        ))}
      </div>

      <div className="document-total-block">
        <div><span>Zwischentotal</span><strong>{chf.format(subtotal)}</strong></div>
        <div><span>MWST</span><strong>{chf.format(vat)}</strong></div>
        <div className="document-grand-total"><span>Total</span><strong>{chf.format(total)}</strong></div>
      </div>

      {outro && <p className="document-outro">{outro}</p>}

      {!isQuote && (
        <div className="document-payment">
          <strong>Zahlungsinformationen</strong>
          <span>{company.bankName}</span>
          <span>IBAN {company.iban}</span>
          <span>Bitte Rechnungsnummer {invoice?.number} als Referenz verwenden.</span>
        </div>
      )}

      <footer className="document-footer">
        <div><strong>{company.name}</strong><span>{company.address}, {company.zip} {company.city}</span></div>
        <div><span>{company.phone}</span><span>{company.email}</span></div>
        <div><span>{company.website}</span><span>{company.uid}</span></div>
      </footer>
    </article>
  )
}

function fmt(value?: string) {
  if (!value) return '–'
  return new Intl.DateTimeFormat('de-CH').format(new Date(`${value}T12:00:00`))
}
