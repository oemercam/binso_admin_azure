'use client'

import { PageHeader } from '@/components/ui/page-header'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { useBusinessStore } from '@/components/state/business-store'
import { effectiveInvoiceStatus, invoiceOpenAmount } from '@/modules/invoices/status'
import { formatChf } from '@/lib/format/locale'

const chf = (value: number) => formatChf(value, { maximumFractionDigits: 0 })

export default function FinancePage() {
  const store = useBusinessStore()
  const deliveredRevenue = store.timeEntries.reduce((sum, entry) => sum + entry.hours * entry.salesRate, 0)
  const internalCost = store.timeEntries.reduce((sum, entry) => sum + entry.hours * entry.internalCostRate, 0)
  const supplierCost = store.supplierInvoices.reduce((sum, invoice) => sum + invoice.netAmount, 0)
  const totalCost = internalCost + supplierCost
  const contribution = deliveredRevenue - totalCost
  const margin = deliveredRevenue ? Math.round((contribution / deliveredRevenue) * 100) : 0
  const open = store.invoices.filter((invoice) => !['paid', 'cancelled'].includes(effectiveInvoiceStatus(invoice))).reduce((sum, invoice) => sum + invoiceOpenAmount(invoice), 0)
  const openSupplier = store.supplierInvoices.filter((invoice) => invoice.status !== 'paid').reduce((sum, invoice) => sum + invoice.amount, 0)
  const paidIn = store.payments.reduce((sum, payment) => sum + payment.amount, 0)

  return (
    <section className="page apple-page">
      <PageHeader title="Finanzen" description="Umsatz, Kosten, Marge und offene Positionen auswerten." />
      <div className="metric-strip mobile-kpi-4">
        <div className="metric"><span>Geleisteter Umsatz</span><strong>{chf(deliveredRevenue)}</strong><small>aus erfassten Zeiten</small></div>
        <div className="metric"><span>Offene Forderungen</span><strong>{chf(open)}</strong><small className="tone-warning">noch nicht bezahlt</small></div>
        <div className="metric"><span>Deckungsbeitrag</span><strong>{chf(contribution)}</strong><small>Marge {margin} %</small></div>
        <div className="metric"><span>Offene Kreditoren</span><strong>{chf(openSupplier)}</strong><small>Lieferantenrechnungen</small></div>
      </div>
      <div className="dashboard-layout">
        <section className="surface chart-surface"><div className="section-title"><div><h2>Umsatz und Kosten</h2><p>Entwicklung und aktuelle Kennzahlen</p></div></div><RevenueChart/></section>
        <section className="surface"><div className="section-title"><div><h2>Cash-Bewegung</h2><p>Aus erfassten Zahlungen und offenen Positionen</p></div></div><div className="finance-ledger"><div><span>Zahlungseingänge</span><strong className="tone-positive">+ {chf(paidIn)}</strong></div><div><span>Offene Debitoren</span><strong>{chf(open)}</strong></div><div><span>Offene Kreditoren</span><strong>- {chf(openSupplier)}</strong></div><div className="total"><span>Netto offene Positionen</span><strong>{chf(open - openSupplier)}</strong></div></div></section>
      </div>
    </section>
  )
}
