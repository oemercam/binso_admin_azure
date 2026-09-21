import { PageHeader } from '@/components/ui/page-header'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { invoices, orders } from '@/lib/data/demo'

const chf = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 })

export default function FinancePage() {
  const committedRevenue = orders.reduce((sum, order) => sum + order.usedHours * order.salesRate, 0)
  const open = invoices.filter((invoice) => invoice.status !== 'paid' && invoice.status !== 'cancelled').reduce((sum, invoice) => sum + invoice.amount - invoice.paidAmount, 0)

  return (
    <section className="page">
      <PageHeader eyebrow="CONTROLLING" title="Finanzen" description="Umsatz, Marge, Forderungen und Liquidität." />

      <div className="metric-strip">
        <div className="metric"><span>Geleisteter Umsatz</span><strong>{chf.format(committedRevenue)}</strong><small>aus erfassten Zeiten</small></div>
        <div className="metric"><span>Offene Forderungen</span><strong>{chf.format(open)}</strong><small className="tone-warning">noch nicht bezahlt</small></div>
        <div className="metric"><span>Deckungsbeitrag</span><strong>CHF 6'048</strong><small>Marge 32.4 %</small></div>
        <div className="metric"><span>Cash Forecast</span><strong>+ CHF 9'630</strong><small className="tone-positive">30 Tage</small></div>
      </div>

      <div className="dashboard-layout">
        <section className="surface chart-surface"><div className="section-title"><div><h2>Umsatz und Kosten</h2><p>Letzte sechs Monate</p></div></div><RevenueChart/></section>
        <section className="surface">
          <div className="section-title"><div><h2>Liquidität</h2><p>Nächste 30 Tage</p></div></div>
          <div className="finance-ledger">
            <div><span>Aktueller Bestand</span><strong>CHF 34'200</strong></div>
            <div><span>Erwartete Eingänge</span><strong className="tone-positive">+ CHF 12'400</strong></div>
            <div><span>Erwartete Ausgänge</span><strong>- CHF 8'950</strong></div>
            <div className="total"><span>Prognose</span><strong>CHF 37'650</strong></div>
          </div>
        </section>
      </div>
    </section>
  )
}
