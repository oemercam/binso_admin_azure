'use client'

import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'
import { useBusinessStore } from '@/components/state/business-store'

const chf = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function AccountingPage() {
  const store = useBusinessStore()
  const openSupplier = store.supplierInvoices.filter((invoice) => invoice.status !== 'paid').reduce((sum, invoice) => sum + invoice.amount, 0)
  const openCustomer = store.invoices.filter((invoice) => invoice.status !== 'paid').reduce((sum, invoice) => sum + invoice.amount - invoice.paidAmount, 0)

  return (
    <section className="page">
      <PageHeader eyebrow="BUCHHALTUNG" title="Buchhaltung" description="Debitoren, Kreditoren, Zahlungen und externe Leistungskosten pro Auftrag." action={<button className="button primary"><Icon name="download" size={16}/> Export vorbereiten</button>} />

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
            {store.supplierInvoices.map((invoice) => <div key={invoice.id}><span className="primary-cell"><strong>{invoice.number} · {invoice.supplierName}</strong><small>{invoice.orderName || 'Ohne Auftrag'} · {invoice.note}</small></span><span>{invoice.due}</span><strong>{chf.format(invoice.amount)}</strong></div>)}
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
    </section>
  )
}
