'use client'

import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { Icon, type IconName } from '@/components/ui/icon'
import { useBusinessStore } from '@/components/state/business-store'
import { useCurrentUser } from '@/components/state/current-user'
import { effectiveInvoiceStatus, invoiceOpenAmount } from '@/modules/invoices/status'
import { getTimeEntryBillingEligibility } from '@/modules/time/eligibility'
import { formatChf } from '@/lib/format/locale'
const chf = (value: number) => formatChf(value, { maximumFractionDigits: 0 })

export default function DashboardPage() {
  const user = useCurrentUser()
  if (user.role === 'employee') return <EmployeeDashboard />
  if (user.role === 'finance') return <FinanceDashboard />
  return <OwnerDashboard />
}

function OwnerDashboard() {
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
  const features = new Set(store.entitlements.find((item) => item.organizationId === store.currentOrganizationId)?.features ?? [])
  const hasTime = features.has('time')
  const hasFinance = features.has('finance')
  const hasMargin = features.has('margin')
  const openQuotes = store.quotes.filter((quote) => ['draft','sent'].includes(quote.status)).length
  const activeOrders = store.orders.filter((order) => order.status === 'active').length

  return (
    <section className="page apple-page">
      <PageHeader title="Übersicht" description="Die wichtigsten Aufgaben direkt erledigen – ohne Umwege." />
      <nav className="dashboard-quick-start" aria-label="Schnell starten">
        <Link href="/customers?new=1"><Icon name="customers" size={18}/><span><strong>Kunde</strong><small>in Sekunden erfassen</small></span></Link>
        <Link href="/quotes?new=1"><Icon name="quotes" size={18}/><span><strong>Angebot</strong><small>erstellen und senden</small></span></Link>
        <Link href="/invoices?new=1"><Icon name="invoices" size={18}/><span><strong>Rechnung</strong><small>direkt erstellen</small></span></Link>
        {store.entitlements.find((item) => item.organizationId === store.currentOrganizationId)?.features.includes('time') ? <Link href="/time?new=1"><Icon name="time" size={18}/><span><strong>Zeit</strong><small>schnell erfassen</small></span></Link> : null}
      </nav>
      <div id="owner-dashboard-kpis" className="metric-strip owner-metrics mobile-kpi-3">
        {hasTime ? <Metric label="Nicht verrechnet" value={chf(billableValue)} detail={`${billableHours} h abrechenbar`} /> : <Metric label="Offene Angebote" value={String(openQuotes)} detail="Entwürfe und versendet" />}
        <Metric label="Aktive Aufträge" value={String(activeOrders)} detail="laufende Arbeiten" />
        <Metric label="Offene Rechnungen" value={chf(openAmount)} detail={`${openInvoices.length} Rechnungen`} tone="warning" />
        {hasMargin ? <Metric label="Deckungsbeitrag" value={chf(contribution)} detail={`Marge ${margin} %`} /> : null}
      </div>

      <div className="dashboard-layout">
        <section className="surface chart-surface"><SectionTitle title="Geschäftsentwicklung" subtitle="Entwicklung und aktuelle Kennzahlen"/><RevenueChart /></section>
        <section className="surface focus-surface">
          <SectionTitle title="Heute wichtig" subtitle="Priorisierte Aufgaben" />
          <div className="focus-list">
            {openInvoices.some((invoice) => effectiveInvoiceStatus(invoice) === 'overdue') && <Focus href="/invoices" icon="warning" label="Rechnung überfällig" meta="Mahnung oder Zahlung prüfen" tone="danger" />}
            {store.quotes.some((quote) => quote.status === 'sent') && <Focus href="/quotes" icon="quotes" label="Offene Angebote" meta="Nachfassen oder Status aktualisieren" />}
            {hasTime ? <Focus href="/time" icon="time" label={`${billableHours} h abrechenbar`} meta="Zeiten prüfen und fakturieren" /> : <Focus href="/quotes?new=1" icon="quotes" label="Neues Angebot" meta="Direkt beim Kunden starten" />}
          </div>
        </section>
      </div>

      <nav className="mobile-dashboard-summary" aria-label="Dashboard Bereiche">
        <Link href="/orders" className="hub-row"><span><strong>Aufträge</strong><small>{store.orders.filter((order) => order.status === 'active').length} aktive Mandate</small></span><Icon name="chevron" size={15}/></Link>
        <Link href="/quotes" className="hub-row"><span><strong>Pipeline</strong><small>{store.quotes.filter((quote) => ['draft','sent'].includes(quote.status)).length} offene Angebote</small></span><Icon name="chevron" size={15}/></Link>
        <Link href="/invoices" className="hub-row"><span><strong>Abrechnung</strong><small>{chf(openAmount)} offene Forderungen</small></span><Icon name="chevron" size={15}/></Link>
        {hasFinance ? <Link href="/finance" className="hub-row"><span><strong>Finanzen</strong><small>Forderungen und Zahlungen</small></span><Icon name="chevron" size={15}/></Link> : null}
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
        <section className="section-block"><SectionTitle title="Sales Pipeline" subtitle="Angebote und nächste Schritte"/><div className="compact-list">{store.quotes.map((quote) => <Link href={`/quotes?view=${quote.id}`} key={quote.id}><span className="primary-cell"><strong>{quote.number} · {quote.title}</strong><small>{quote.customerName}</small></span><span>{chf(quote.amount)}</span><Status value={quote.status}/></Link>)}</div></section>
        <section className="section-block"><SectionTitle title="Zahlungen" subtitle="Zuletzt verbucht"/><div className="compact-list">{store.payments.slice(0, 5).map((payment) => { const invoice = store.invoices.find((item) => item.id === payment.invoiceId); return <Link href={`/invoices?view=${payment.invoiceId}`} key={payment.id}><span className="primary-cell"><strong>{invoice?.number ?? payment.invoiceId}</strong><small>{payment.date} · {payment.method}</small></span><strong>{chf(payment.amount)}</strong></Link> })}</div></section>
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
    <section className="page apple-page">
      <PageHeader title="Finanzübersicht" description="Forderungen, Zahlungen und anstehende Aufgaben." />
      <div className="metric-strip mobile-kpi-4"><Metric label="Offene Forderungen" value={chf(openAmount)} detail={`${open.length} Rechnungen`} tone="warning"/><Metric label="Verbuchte Zahlungen" value={chf(paid)} detail={`${store.payments.length} Zahlungen`} tone="positive"/><Metric label="Überfällig" value={chf(overdue.reduce((sum, invoice) => sum + invoiceOpenAmount(invoice), 0))} detail={`${overdue.length} Rechnungen`} tone="danger"/><Metric label="Noch verrechenbar" value={chf(billableAmount)} detail={`${billableEntries.reduce((sum, entry) => sum + entry.hours, 0)} h freigegeben`}/></div>
      <div className="dashboard-layout"><section className="surface chart-surface"><SectionTitle title="Umsatzentwicklung" subtitle="Entwicklung der letzten Perioden"/><RevenueChart/></section><section className="surface focus-surface"><SectionTitle title="Offene Aufgaben" subtitle="Heute relevant"/><div className="focus-list"><Focus href="/invoices?payment=1" icon="credit-card" label="Zahlung verbuchen" meta="Offene Rechnung auswählen"/><Focus href="/invoices" icon="warning" label="Mahnungen prüfen" meta="Überfällige Rechnungen" tone="danger"/><Focus href="/accounting" icon="accounting" label="Offene Posten prüfen" meta="Debitoren und Lieferantenrechnungen"/></div></section></div>
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
    <section className="page apple-page">
      <PageHeader title={`Hallo ${user.name.split(' ')[0]}`} description="Deine Aufträge, Zeiten und heutige Aufgaben." />
      <div className="metric-strip employee-metrics mobile-kpi-3"><Metric label="September" value={`${total} h`} detail={employee ? `${Math.max(0, employee.targetHours - total)} h offen` : 'Zeitübersicht'} /><Metric label="Verrechenbar" value={`${billable} h`} detail={total ? `${Math.round((billable / total) * 100)} % deiner Zeiten` : 'Noch keine Zeiten'} /><Metric label="Offene Nachweise" value={String(ownTimes.filter((entry) => store.orderPolicies.find((policy) => policy.orderId === entry.orderId)?.timeTracking.evidence.required && !store.timeEvidence.some((evidence) => evidence.timeEntryId === entry.id)).length)} detail="Zeitnachweise" /></div>
      <div className="dashboard-layout"><section className="surface"><SectionTitle title="Meine Aufträge" subtitle="Aktuell zugewiesen"/><div className="compact-list">{assignedOrders.length ? assignedOrders.map((order) => <Link href={`/orders/${order.id}`} key={order.id}><span className="primary-cell"><strong>{order.name}</strong><small>{order.customerName}</small></span><span>{Math.max(0, order.budgetHours - store.timeEntries.filter((entry) => entry.orderId === order.id).reduce((sum, entry) => sum + entry.hours, 0))} h Rest</span><span className="status neutral">Aktiv</span></Link>) : <p className="muted">Keine Aufträge zugewiesen.</p>}</div></section><section className="surface"><SectionTitle title="Schnellerfassung" subtitle="Heute"/><Link href="/time?new=1" className="big-action"><Icon name="time" size={20}/><span><strong>Zeit erfassen</strong><small>Auf Auftrag oder Tätigkeit buchen</small></span><Icon name="chevron" size={16}/></Link></section></div>
    </section>
  )
}

function Metric({ label, value, detail, tone }: { label: string; value: string; detail: string; tone?: 'positive' | 'warning' | 'danger' }) { return <div className="metric"><span>{label}</span><strong>{value}</strong><small className={tone ? `tone-${tone}` : undefined}>{detail}</small></div> }
function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) { return <div className="section-title"><div><h2>{title}</h2><p>{subtitle}</p></div></div> }
function Focus({ href, icon, label, meta, tone }: { href: string; icon: IconName; label: string; meta: string; tone?: 'danger' }) { return <Link className="focus-item" href={href}><span className={tone ? `focus-icon ${tone}` : 'focus-icon'}><Icon name={icon} size={17}/></span><span><strong>{label}</strong><small>{meta}</small></span><Icon name="chevron" size={15}/></Link> }
function Status({ value }: { value: string }) { return <StatusBadge status={value} /> }
