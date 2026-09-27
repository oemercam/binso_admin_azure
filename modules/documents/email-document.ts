import type { CompanyProfile, Invoice, Quote } from '@/types/domain'
import { addMinor, fromMinorUnits, lineTotalMinor, toMinorUnits } from '@/modules/shared/money'

const escape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!))

/** Printable attachment. Deliberately HTML, not a falsely labelled PDF. */
export function renderEmailDocument(kind: 'quote' | 'invoice' | 'reminder', document: Invoice | Quote, company: CompanyProfile) {
  const title = kind === 'quote' ? 'Angebot' : kind === 'reminder' ? 'Zahlungserinnerung' : 'Rechnung'
  if (!company.name || !company.address || !company.zip || !company.city || !document.recipientName || !document.recipientAddress || !document.recipientZip || !document.recipientCity || !document.lines?.length) throw new Error('Absender, Empfänger oder Positionen sind unvollständig.')
  if (!document.lines.every(line => Number.isFinite(line.quantity) && line.quantity > 0 && Number.isFinite(line.unitPrice) && line.unitPrice >= 0)) throw new Error('Ungültige Dokumentpositionen.')
  const totals = document.lines.map(line => lineTotalMinor({ quantity: line.quantity, unitPrice: line.unitPrice, vatRate: line.vatRate ?? 8.1 }))
  const subtotalMinor = addMinor(...totals.map(item => item.netMinor))
  const taxMinor = addMinor(...totals.map(item => item.vatMinor))
  const grossMinor = addMinor(subtotalMinor, taxMinor)
  const tax = fromMinorUnits(taxMinor)
  if (tax > 0 && !/^CHE-\d{3}\.\d{3}\.\d{3}/.test(company.uid ?? '')) throw new Error('MWST-Nummer fehlt oder ist ungültig.')
  const gross = fromMinorUnits(grossMinor)
  if ('due' in document && toMinorUnits(document.amount) !== grossMinor) throw new Error('Rechnungsbetrag stimmt nicht mit den Positionen überein.')
  const lines = document.lines.map((line, index) => `<tr><td>${escape(line.description)} (MWST ${escape(line.vatRate ?? 8.1)}%)</td><td>${escape(line.quantity)}</td><td>${escape(line.unit)}</td><td>${line.unitPrice.toFixed(2)}</td><td>${fromMinorUnits(totals[index].netMinor).toFixed(2)}</td></tr>`).join('')
  return `<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title} ${escape(document.number)}</title><style>body{font:16px system-ui;max-width:800px;margin:40px auto;padding:24px;color:#17202a}table{width:100%;border-collapse:collapse}td,th{padding:10px;text-align:left;border-bottom:1px solid #ddd}p{white-space:pre-line}@media print{body{margin:0}}</style><h1>${title} ${escape(document.number)}</h1><p>${escape(company.name)}\n${escape(company.address)}\n${escape(company.zip)} ${escape(company.city)}\n${escape(company.uid)}</p><p>${escape(document.recipientName)}\n${escape(document.recipientAddress)}\n${escape(document.recipientZip)} ${escape(document.recipientCity)}</p><p>Datum: ${escape(document.issueDate)}${'due' in document ? ` · Zahlbar bis: ${escape(document.due)}` : ` · Gültig bis: ${escape(document.validUntil)}`}</p><p>${escape(document.introText)}</p><p>${'period' in document ? escape(document.period) : ''}</p><table><thead><tr><th>Leistung</th><th>Menge</th><th>Einheit</th><th>CHF</th><th>Total CHF</th></tr></thead><tbody>${lines}</tbody></table><p>Total CHF ${gross.toFixed(2)}${'vatAmount' in document ? `\nEnthaltene MWST CHF ${document.vatAmount.toFixed(2)}\nOffen CHF ${fromMinorUnits(Math.max(0, addMinor(toMinorUnits(document.amount), -toMinorUnits(document.paidAmount), -toMinorUnits(document.creditedAmount ?? 0)))).toFixed(2)}` : ''}</p><p>${escape(document.outroText)}</p><p>IBAN: ${escape(company.iban)}\nReferenz: ${escape(document.number)}\n${escape(company.email)}</p></html>`
}
