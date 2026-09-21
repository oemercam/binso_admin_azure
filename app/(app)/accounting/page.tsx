'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'
import { useBusinessStore } from '@/components/state/business-store'

const chf = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function AccountingPage() {
  const store = useBusinessStore()
  const [supplierOpen, setSupplierOpen] = useState(false)
  const openSupplier = store.supplierInvoices.filter((invoice) => invoice.status !== 'paid').reduce((sum, invoice) => sum + invoice.amount, 0)
  const openCustomer = store.invoices.filter((invoice) => invoice.status !== 'paid' && invoice.status !== 'cancelled').reduce((sum, invoice) => sum + invoice.amount - invoice.paidAmount, 0)

  function exportCsv() {
    const rows = [
      ['Typ', 'Nummer', 'Partner', 'Datum', 'Fällig', 'Betrag', 'Status'],
      ...store.invoices.map((invoice) => ['Debitor', invoice.number, invoice.customerName, invoice.issueDate, invoice.due, invoice.amount.toFixed(2), invoice.status]),
      ...store.supplierInvoices.map((invoice) => ['Kreditor', invoice.number, invoice.supplierName, invoice.invoiceDate, invoice.due, invoice.amount.toFixed(2), invoice.status]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(';')).join('\n')
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `binso-buchhaltung-${new Date().toISOString().slice(0, 10)}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="page">
      <PageHeader eyebrow="BUCHHALTUNG" title="Buchhaltung" description="Debitoren, Kreditoren, Zahlungen und externe Leistungskosten pro Auftrag." action={<div className="page-action-group"><button className="button secondary" onClick={exportCsv}><Icon name="download" size={16}/> Export</button><button className="button primary" onClick={() => setSupplierOpen(true)}><Icon name="plus" size={16}/> Lieferantenrechnung</button></div>} />

      <div className="metric-strip">
        <div className="metric"><span>Offene Debitoren</span><strong>{chf.format(openCustomer)}</strong><small>Kundenrechnungen</small></div>
        <div className="metric"><span>Offene Kreditoren</span><strong>{chf.format(openSupplier)}</strong><small>Lieferantenrechnungen</small></div>
        <div className="metric"><span>Zahlungen</span><strong>{store.payments.length}</strong><small>verbucht</small></div>
        <div className="metric"><span>Externe Firmen</span><strong>{store.suppliers.length}</strong><small>aktive Lieferanten</small></div>
      </div>

      <div className="dashboard-bottom-grid">
        <section className="section-block">
          <div className="section-title"><div><h2>Lieferantenrechnungen</h2><p>Externe Leistungen und Fremdkosten</p></div></div>
          <div className="compact-list">
            {store.supplierInvoices.map((invoice) => <div key={invoice.id}><span className="primary-cell"><strong>{invoice.number} · {invoice.supplierName}</strong><small>{invoice.orderName || 'Ohne Auftrag'} · {invoice.note || 'Keine Beschreibung'}</small></span><span>{invoice.due}</span><strong>{chf.format(invoice.amount)}</strong><span className={`status ${invoice.status === 'paid' ? 'paid' : invoice.status === 'review' ? 'neutral' : 'active'}`}>{invoice.status === 'paid' ? 'Bezahlt' : invoice.status === 'review' ? 'In Prüfung' : 'Freigegeben'}</span><span className="row-actions">{invoice.status === 'review' && <button className="row-link text-row-action" onClick={() => store.updateSupplierInvoice(invoice.id, { status: 'open' })}>Freigeben</button>}{invoice.status === 'open' && <button className="row-link text-row-action" onClick={() => store.updateSupplierInvoice(invoice.id, { status: 'paid' })}>Bezahlt</button>}</span></div>)}
          </div>
        </section>

        <section className="section-block">
          <div className="section-title"><div><h2>Mandatskosten</h2><p>Beispiel WTO Digital Workplace</p></div></div>
          <div className="compact-list">
            <div><span className="primary-cell"><strong>Nina Keller</strong><small>Mitarbeiterin im Stundenlohn · interne Kosten</small></span><span>15.5 h</span><strong>{chf.format(15.5 * 72)}</strong></div>
            <div><span className="primary-cell"><strong>Meier Cloud Consulting GmbH</strong><small>Externe Firma · Eingangsrechnung MCC-2026-091</small></span><span>14 h</span><strong>{chf.format(1750)}</strong></div>
            <div><span className="primary-cell"><strong>Ömer Cam</strong><small>Interne Leistung · kalkulatorische Kosten</small></span><span>16 h</span><strong>{chf.format(16 * 105)}</strong></div>
          </div>
        </section>
      </div>

      {supplierOpen && <SupplierInvoiceForm onClose={() => setSupplierOpen(false)} />}
    </section>
  )

  function SupplierInvoiceForm({ onClose }: { onClose: () => void }) {
    const [supplierId, setSupplierId] = useState(store.suppliers[0]?.id ?? '')
    const [orderId, setOrderId] = useState(store.orders[0]?.id ?? '')
    const [number, setNumber] = useState('')
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10))
    const [due, setDue] = useState(new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10))
    const [netAmount, setNetAmount] = useState('')
    const [vatRate, setVatRate] = useState('8.1')
    const [note, setNote] = useState('')

    function save(event: React.FormEvent) {
      event.preventDefault()
      const supplier = store.suppliers.find((item) => item.id === supplierId)
      const order = store.orders.find((item) => item.id === orderId)
      if (!supplier) return
      const net = Number(netAmount)
      const vat = Math.round(net * (Number(vatRate) / 100) * 100) / 100
      store.addSupplierInvoice({
        id: `sinv-${Date.now()}`, number: number.trim(), supplierId: supplier.id, supplierName: supplier.name,
        orderId: order?.id, orderName: order?.name, invoiceDate, due, netAmount: net, vatAmount: vat, amount: Math.round((net + vat) * 100) / 100,
        status: 'review', note: note.trim(),
      })
      onClose()
    }

    return <div className="overlay-layer sheet-layer" onMouseDown={onClose}><form className="form-sheet mobile-fullscreen-sheet" onSubmit={save} onMouseDown={(e) => e.stopPropagation()}><div className="sheet-grabber"/><div className="sheet-heading"><div><strong>Lieferantenrechnung erfassen</strong><span>Externe Leistung einem Auftrag zuordnen.</span></div><button type="button" className="icon-button" onClick={onClose}><Icon name="close" size={17}/></button></div><div className="form-grid"><label><span>Lieferant *</span><select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} required>{store.suppliers.map((supplier) => <option value={supplier.id} key={supplier.id}>{supplier.name}</option>)}</select></label><label><span>Auftrag</span><select value={orderId} onChange={(e) => setOrderId(e.target.value)}><option value="">Ohne Auftrag</option>{store.orders.map((order) => <option value={order.id} key={order.id}>{order.name}</option>)}</select></label><label><span>Rechnungsnummer *</span><input value={number} onChange={(e) => setNumber(e.target.value)} required/></label><label><span>Rechnungsdatum *</span><input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} required/></label><label><span>Fällig *</span><input type="date" value={due} onChange={(e) => setDue(e.target.value)} required/></label><label><span>Netto CHF *</span><input inputMode="decimal" value={netAmount} onChange={(e) => setNetAmount(e.target.value)} required/></label><label><span>MWST %</span><input inputMode="decimal" value={vatRate} onChange={(e) => setVatRate(e.target.value)}/></label><label className="full"><span>Beschreibung</span><textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)}/></label></div><div className="sheet-actions"><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button className="button primary">Speichern</button></div></form></div>
  }
}
