'use client'

import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { Icon, type IconName } from '@/components/ui/icon'
import { useBusinessStore } from '@/components/state/business-store'
import { useCurrentUser } from '@/components/state/current-user'
import { effectiveInvoiceStatus, invoiceOpenAmount } from '@/modules/invoices/status'
import { getTimeEntryBillingEligibility } from '@/modules/time/eligibility'
import { StatusBadge } from '@/components/ui/status-badge'

const chf = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 })

export default function DashboardPage() {
  const user = useCurrentUser()
  if (user.role === 'employee') return <EmployeeDashboard />
  if (user.role === 'finance') return <FinanceDashboard />
  return <OwnerDashboard role={user.role} />
}

function OwnerDashboard({ role }: { role: 'owner' | 'admin' }) {
  const store = useBusinessStore()
  const openInvoices = store.invoices.filter((invoice) => effectiveInvoiceStatus(invoice) !== 'paid' && effectiveInvoiceStatus(invoice) !== 'cancelled')
  const openAmount = openInvoices.reduce((sum, invoice) => sum + invoiceOpenAmount(invoice), 0)
  const billableEntries = store.timeEntries.filter((entry) => getTimeEntryBillingEligibility(entry, store.timeEvidence, store.orderPolicies, store.orderAssignmentRules).eligible)
  const billableHours = billableEntries.reduce((sum, entry) => sum + entry.hours, 0)
  const billableValue = billableEntries.reduce((sum, entry) => sum + entry.hours * entry.salesRate, 0)
  const deliveredRevenue = store.timeEntries.reduce((sum, entry) => sum + entry.hours * entry.salesRate, 0)
  const deliveredCost = store.timeEntries.reduce((sum, entry) => sum + entry.hours * entry.internalCostRate, 0) + store.supplierInvoices.reduce((sum, invoice) => sum + invoice.netAmount, 0)
  const contribution = deliveredRevenue - deliveredCost
  const margin = deliveredRevenue ? Math.round((contribution / deliveredRevenue) * 100) : 0

  return (
    <section className="page">
      <PageHeader eyebrow={role === 'owner' ? 'INHABER' : 'ADMINISTRATION'} title="Dashboard" description="Geschäft, Aufträge und Liquidität auf einen Blick." />
      <div className="metric-strip owner-metrics">
        <Metric label="Geleisteter Umsatz" value={chf.format(deliveredRevenue)} detail="aus erfassten Zeiten" />
        <Metric label="Noch nicht verrechnet" value={chf.format(billableValue)} detail={`${billableHours} h abrechenbar`} />
        <Metric label="Offene Rechnungen" value={chf.format(openAmount)} detail={`${openInvoices.length} Positionen`} tone="warning" />
        <Metric label="Deckungsbeitrag" value={chf.format(contribution)} detail={`Marge ${margin} %`} />
      </div>

      <nav className="dashboard-quick-actions" aria-label="Schnellaktionen">
        <Link href="/quotes?new=1"><Icon name="quotes" size={16}/><span>Angebot</span></Link>
        <Link href="/orders?new=1"><Icon name="orders" size={16}/><span>Auftrag</span></Link>
        <Link href="/invoices?new=1"><Icon name="invoices" size={16}/><span>Rechnung</span></Link>
        <Link href="/time?new=1"><Icon name="time" size={16}/><span>Zeit</span></Link>
      </nav>
      <div className="mobile-trend-summary" aria-label="Geschäftsentwicklung">
        <span><small>Geleisteter Umsatz</small><strong>{chf.format(deliveredRevenue)}</strong></span>
        <span><small>Offene Forderungen</small><strong>{chf.format(openAmount)}</strong></span>
      </div>

      <div className="dashboard-layout">
        <section className="surface chart-surface"><SectionTitle title="Geschäftsentwicklung" subtitle="Entwicklung der wichtigsten Kennzahlen"/><RevenueChart /></section>
        <section className="surface focus-surface">
          <SectionTitle title="Heute wichtig" subtitle="Priorisierte Aufgaben" />
          <div className="focus-list">
            {openInvoices.some((invoice) => effectiveInvoiceStatus(invoice) === 'overdue') && <Focus href="/invoices" icon="warning" label="Rechnung überfällig" meta="Mahnung oder Zahlung prüfen" tone="danger" />}
            {store.quotes.some((quote) => quote.status === 'sent') && <Focus href="/quotes" icon="quotes" label="Offene Angebote" meta="Nachfassen oder Status aktualisieren" />}
            <Focus href="/time" icon="time" label={`${billableHours} h abrechenbar`} meta="Zeiten prüfen und fakturieren" />
          </div>
        </section>
      </div>

      <nav className="mobile-dashboard-summary" aria-label="Dashboard Bereiche">
        <Link href="/orders" className="hub-row"><span><strong>Aufträge</strong><small>{store.orders.filter((order) => order.status === 'active').length} aktive Aufträge</small></span><Icon name="chevron" size={15}/></Link>
        <Link href="/quotes" className="hub-row"><span><strong>Pipeline</strong><small>{store.quotes.filter((quote) => ['draft','sent'].includes(quote.status)).length} offene Angebote</small></span><Icon name="chevron" size={15}/></Link>
        <Link href="/invoices" className="hub-row"><span><strong>Abrechnung</strong><small>{chf.format(openAmount)} offene Forderungen</small></span><Icon name="chevron" size={15}/></Link>
        <Link href="/finance" className="hub-row"><span><strong>Finanzen</strong><small>Marge, Kosten und Liquidität</small></span><Icon name="chevron" size={15}/></Link>
      </nav>

      <div className="desktop-dashboard-rich">
      <section className="section-block">
        <SectionTitle title="Aktive Aufträge" subtitle="Budget, Verbrauch und wirtschaftlicher Stand" />
        <div className="data-list desktop-wide">
          <div className="data-row data-head"><span>Auftrag</span><span>Budget</span><span>Verbraucht</span><span>Rest</span><span>Auslastung</span><span>Marge</span></div>
          {store.orders.filter((order) => order.status === 'active').map((order) => {
            const times = store.timeEntries.filter((entry) => entry.orderId === order.id)
            const used = times.reduce((sum, entry) => sum + entry.hours, 0) || order.usedHours
            const revenue = times.reduce((sum, entry) => sum + entry.hours * entry.salesRate, 0) || used * order.salesRate
            const cost = times.reduce((sum, entry) => sum + entry.hours * entry.internalCostRate, 0) || used * order.costRate
            const percentage = order.budgetHours ? Math.round((used / order.budgetHours) * 100) : 0
            const orderMargin = revenue ? Math.round(((revenue - cost) / revenue) * 100) : 0
            return (
              <Link className="data-row linked-row" href={`/orders/${order.id}`} key={order.id}>
                <span className="primary-cell"><strong>{order.name}</strong><small>{order.customerName}</small></span><span>{order.budgetHours} h</span><span>{used} h</span><span><strong>{Math.max(0, order.budgetHours - used)} h</strong></span><span className="progress-cell"><span className="mini-progress"><i style={{ width: `${Math.min(100, percentage)}%` }}/></span><small>{percentage} %</small></span><span>{orderMargin} %</span>
              </Link>
            )
          })}
        </div>
      </section>

      <div className="dashboard-bottom-grid">
        <section className="section-block"><SectionTitle title="Sales Pipeline" subtitle="Angebote und nächste Schritte"/><div className="compact-list">{store.quotes.map((quote) => <Link href={`/quotes?view=${quote.id}`} key={quote.id}><span className="primary-cell"><strong>{quote.number} · {quote.title}</strong><small>{quote.customerName}</small></span><span>{chf.format(quote.amount)}</span><StatusBadge status={quote.status} /></Link>)}</div></section>
        <section className="section-block"><SectionTitle title="Zahlungen" subtitle="Zuletzt verbucht"/><div className="compact-list">{store.payments.slice(0, 5).map((payment) => { const invoice = store.invoices.find((item) => item.id === payment.invoiceId); return <Link href={`/invoices?view=${payment.invoiceId}`} key={payment.id}><span className="primary-cell"><strong>{invoice?.number ?? payment.invoiceId}</strong><small>{payment.date} · {payment.method}</small></span><strong>{chf.format(payment.amount)}</strong></Link> })}</div></section>
      </div>
      </div>
    </section>
  )
}

function FinanceDashboard() {
  const store = useBusinessStore()
  const open = store.invoices.filter((invoice) => !['paid', 'cancelled'].includes(effectiveInvoiceStatus(invoice)))
  const openAmount = open.reduce((sum, invoice) => sum + invoiceOpenAmount(invoice), 0)
  const overdue = open.filter((invoice) => effectiveInvoiceStatus(invoice) === 'overdue')
  const paid = store.payments.reduce((sum, payment) => sum + payment.amount, 0)
  const billableEntries = store.timeEntries.filter((entry) => getTimeEntryBillingEligibility(entry, store.timeEvidence, store.orderPolicies, store.orderAssignmentRules).eligible)
  const billableAmount = billableEntries.reduce((sum, entry) => sum + entry.hours * entry.salesRate, 0)

  return (
    <section className="page">
      <PageHeader eyebrow="BUCHHALTUNG" title="Finanzübersicht" description="Forderungen, Zahlungen und anstehende Aufgaben." />
      <div className="metric-strip"><Metric label="Offene Forderungen" value={chf.format(openAmount)} detail={`${open.length} Rechnungen`} tone="warning"/><Metric label="Verbuchte Zahlungen" value={chf.format(paid)} detail={`${store.payments.length} Zahlungen`} tone="positive"/><Metric label="Überfällig" value={chf.format(overdue.reduce((sum, invoice) => sum + invoiceOpenAmount(invoice), 0))} detail={`${overdue.length} Rechnungen`} tone="danger"/><Metric label="Noch verrechenbar" value={chf.format(billableAmount)} detail={`${billableEntries.reduce((sum, entry) => sum + entry.hours, 0)} h freigegeben`}/></div>
      <div className="dashboard-layout"><section className="surface chart-surface"><SectionTitle title="Umsatzentwicklung" subtitle="Entwicklung der wichtigsten Kennzahlen"/><RevenueChart/></section><section className="surface focus-surface"><SectionTitle title="Buchhaltungsaufgaben" subtitle="Heute relevant"/><div className="focus-list"><Focus href="/invoices?payment=1" icon="credit-card" label="Zahlung verbuchen" meta="Offene Rechnung auswählen"/><Focus href="/invoices" icon="warning" label="Mahnungen prüfen" meta="Überfällige Rechnungen" tone="danger"/><Focus href="/accounting" icon="accounting" label="Export vorbereiten" meta="Debitoren und Kreditoren"/></div></section></div>
    </section>
  )
}

function EmployeeDashboard() {
  const store = useBusinessStore()
  const user = useCurrentUser()
  const employee = store.employees.find((item) => item.email.toLowerCase() === user.email.toLowerCase())
  const ownTimes = employee ? store.timeEntries.filter((entry) => entry.personId === employee.id) : []
  const total = ownTimes.reduce((sum, entry) => sum + entry.hours, 0)
  const billable = ownTimes.filter((entry) => entry.billable).reduce((sum, entry) => sum + entry.hours, 0)
  const assignedOrderIds = new Set(store.orderAssignmentRules.filter((item) => item.personId === employee?.id && item.active).map((item) => item.orderId))
  const assignedOrders = store.orders.filter((order) => assignedOrderIds.has(order.id))

  return (
    <section className="page">
      <PageHeader eyebrow="MEIN ARBEITSTAG" title={`Hallo ${user.name.split(' ')[0]}`} description="Deine Aufträge, Zeiten und heutige Aufgaben." />
      <div className="metric-strip employee-metrics"><Metric label="September" value={`${total} h`} detail={employee ? `${Math.max(0, employee.targetHours - total)} h offen` : 'Zeitübersicht'} /><Metric label="Verrechenbar" value={`${billable} h`} detail={total ? `${Math.round((billable / total) * 100)} % deiner Zeiten` : 'Noch keine Zeiten'} /><Metric label="Offene Nachweise" value={String(ownTimes.filter((entry) => store.orderPolicies.find((policy) => policy.orderId === entry.orderId)?.timeTracking.evidence.required && !store.timeEvidence.some((evidence) => evidence.timeEntryId === entry.id)).length)} detail="Zeitnachweise" /></div>
      <div className="dashboard-layout"><section className="surface"><SectionTitle title="Meine Aufträge" subtitle="Aktuell zugewiesen"/><div className="compact-list">{assignedOrders.length ? assignedOrders.map((order) => <Link href={`/orders/${order.id}`} key={order.id}><span className="primary-cell"><strong>{order.name}</strong><small>{order.customerName}</small></span><span>{Math.max(0, order.budgetHours - store.timeEntries.filter((entry) => entry.orderId === order.id).reduce((sum, entry) => sum + entry.hours, 0))} h Rest</span><StatusBadge status="active" /></Link>) : <p className="muted">Keine Aufträge zugewiesen.</p>}</div></section><section className="surface"><SectionTitle title="Schnellerfassung" subtitle="Heute"/><Link href="/time?new=1" className="big-action"><Icon name="time" size={20}/><span><strong>Zeit erfassen</strong><small>Auf Auftrag oder Tätigkeit buchen</small></span><Icon name="chevron" size={16}/></Link></section></div>
    </section>
  )
}

function Metric({ label, value, detail, tone }: { label: string; value: string; detail: string; tone?: 'positive' | 'warning' | 'danger' }) { return <div className="metric"><span>{label}</span><strong>{value}</strong><small className={tone ? `tone-${tone}` : undefined}>{detail}</small></div> }
function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) { return <div className="section-title"><div><h2>{title}</h2><p>{subtitle}</p></div></div> }
function Focus({ href, icon, label, meta, tone }: { href: string; icon: IconName; label: string; meta: string; tone?: 'danger' }) { return <Link className="focus-item" href={href}><span className={tone ? `focus-icon ${tone}` : 'focus-icon'}><Icon name={icon} size={17}/></span><span><strong>{label}</strong><small>{meta}</small></span><Icon name="chevron" size={15}/></Link> }
