import { getSession } from '@/lib/auth/server'
import { PageHeader } from '@/components/ui/page-header'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { Icon } from '@/components/ui/icon'
import {
  activity,
  invoices,
  orders,
  quotes,
  timeEntries,
} from '@/lib/data/demo'

const chf = new Intl.NumberFormat('de-CH', {
  style: 'currency',
  currency: 'CHF',
  maximumFractionDigits: 0,
})

export default async function DashboardPage() {
  const session = await getSession()
  const role = session?.user.role ?? 'employee'

  if (role === 'employee') {
    return <EmployeeDashboard />
  }

  if (role === 'finance') {
    return <FinanceDashboard />
  }

  return <OwnerDashboard role={role} />
}

function OwnerDashboard({
  role,
}: {
  role: 'owner' | 'admin'
}) {
  const openInvoices = invoices.filter(
    (invoice) =>
      invoice.status !== 'paid' &&
      invoice.status !== 'cancelled',
  )

  const openAmount = openInvoices.reduce(
    (sum, invoice) =>
      sum +
      invoice.amount -
      invoice.paidAmount,
    0,
  )

  const billableEntries = timeEntries.filter(
    (entry) =>
      entry.billable &&
      entry.approved &&
      !entry.invoicedInvoiceId,
  )

  const billableHours = billableEntries.reduce(
    (sum, entry) => sum + entry.hours,
    0,
  )

  const billableValue = billableEntries.reduce(
    (sum, entry) =>
      sum +
      entry.hours *
        entry.salesRate,
    0,
  )

  return (
    <section className="page">
      <PageHeader
        eyebrow={
          role === 'owner'
            ? 'INHABER'
            : 'ADMINISTRATION'
        }
        title="Dashboard"
        description="Geschäft, Aufträge und Liquidität auf einen Blick."
      />

      <div className="metric-strip">
        <Metric
          label="Umsatz September"
          value="CHF 18'660"
          detail="+34.2 % zum Vormonat"
          tone="positive"
        />

        <Metric
          label="Noch nicht verrechnet"
          value={chf.format(billableValue)}
          detail={`${billableHours} h abrechenbar`}
        />

        <Metric
          label="Offene Rechnungen"
          value={chf.format(openAmount)}
          detail={`${openInvoices.length} Positionen`}
          tone="warning"
        />

        <Metric
          label="Deckungsbeitrag"
          value="CHF 6'048"
          detail="Marge 32.4 %"
        />
      </div>

      <div className="dashboard-layout">
        <section className="surface chart-surface">
          <SectionTitle
            title="Geschäftsentwicklung"
            subtitle="Umsatz und interne Kosten · letzte 6 Monate"
          />

          <RevenueChart />
        </section>

        <section className="surface focus-surface">
          <SectionTitle
            title="Heute wichtig"
            subtitle="Priorisierte Aufgaben"
          />

          <div className="focus-list">
            <Focus
              icon="warning"
              label="1 Rechnung überfällig"
              meta="CHF 1'980 · seit 20.09."
              tone="danger"
            />

            <Focus
              icon="quotes"
              label="1 Angebot läuft aus"
              meta="AN-2026-014 · in 9 Tagen"
            />

            <Focus
              icon="time"
              label="43.5 h fehlen im Monat"
              meta="Monatsabschluss September"
            />
          </div>
        </section>
      </div>

      <section className="section-block">
        <SectionTitle
          title="Aktive Aufträge"
          subtitle="Budget, Verbrauch und wirtschaftlicher Stand"
        />

        <div className="data-list desktop-wide">
          <div className="data-row data-head">
            <span>Auftrag</span>
            <span>Budget</span>
            <span>Verbraucht</span>
            <span>Rest</span>
            <span>Auslastung</span>
            <span>Marge</span>
          </div>

          {orders.map((order) => {
            const percentage = Math.round(
              (order.usedHours /
                order.budgetHours) *
                100,
            )

            const margin = Math.round(
              ((order.salesRate -
                order.costRate) /
                order.salesRate) *
                100,
            )

            return (
              <div
                className="data-row"
                key={order.id}
              >
                <span className="primary-cell">
                  <strong>
                    {order.name}
                  </strong>

                  <small>
                    {order.customerName}
                  </small>
                </span>

                <span>
                  {order.budgetHours} h
                </span>

                <span>
                  {order.usedHours} h
                </span>

                <span>
                  <strong>
                    {order.budgetHours -
                      order.usedHours}{' '}
                    h
                  </strong>
                </span>

                <span className="progress-cell">
                  <span className="mini-progress">
                    <i
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </span>

                  <small>
                    {percentage} %
                  </small>
                </span>

                <span>
                  {margin} %
                </span>
              </div>
            )
          })}
        </div>
      </section>

      <div className="dashboard-bottom-grid">
        <section className="section-block">
          <SectionTitle
            title="Sales Pipeline"
            subtitle="Angebote und nächste Schritte"
          />

          <div className="compact-list">
            {quotes.map((quote) => (
              <div key={quote.id}>
                <span className="primary-cell">
                  <strong>
                    {quote.number} ·{' '}
                    {quote.title}
                  </strong>

                  <small>
                    {quote.customerName}
                  </small>
                </span>

                <span>
                  {chf.format(
                    quote.amount,
                  )}
                </span>

                <Status
                  value={quote.status}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="section-block">
          <SectionTitle
            title="Letzte Aktivitäten"
            subtitle="Unternehmensweit"
          />

          <div className="timeline">
            {activity.map((item) => (
              <div
                key={`${item.time}-${item.title}`}
              >
                <i />

                <span>
                  <strong>
                    {item.title}
                  </strong>

                  <small>
                    {item.meta}
                  </small>
                </span>

                <time>
                  {item.time}
                </time>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}

function FinanceDashboard() {
  const open = invoices.filter(
    (invoice) =>
      invoice.status !== 'paid' &&
      invoice.status !== 'cancelled',
  )

  const openAmount = open.reduce(
    (sum, invoice) =>
      sum +
      invoice.amount -
      invoice.paidAmount,
    0,
  )

  const billableEntries = timeEntries.filter(
    (entry) =>
      entry.billable &&
      entry.approved &&
      !entry.invoicedInvoiceId,
  )

  const billableHours = billableEntries.reduce(
    (sum, entry) =>
      sum + entry.hours,
    0,
  )

  const billableAmount =
    billableEntries.reduce(
      (sum, entry) =>
        sum +
        entry.hours *
          entry.salesRate,
      0,
    )

  return (
    <section className="page">
      <PageHeader
        eyebrow="BUCHHALTUNG"
        title="Finanzübersicht"
        description="Forderungen, Zahlungen und anstehende Aufgaben."
      />

      <div className="metric-strip">
        <Metric
          label="Offene Forderungen"
          value={chf.format(openAmount)}
          detail={`${open.length} Rechnungen`}
          tone="warning"
        />

        <Metric
          label="Bezahlt im Monat"
          value="CHF 7'755"
          detail="1 Zahlung"
          tone="positive"
        />

        <Metric
          label="Überfällig"
          value="CHF 1'980"
          detail="1 Rechnung"
          tone="danger"
        />

        <Metric
          label="Noch verrechenbar"
          value={chf.format(
            billableAmount,
          )}
          detail={`${billableHours} h freigegeben`}
        />
      </div>

      <div className="dashboard-layout">
        <section className="surface chart-surface">
          <SectionTitle
            title="Umsatzentwicklung"
            subtitle="Letzte 6 Monate"
          />

          <RevenueChart />
        </section>

        <section className="surface focus-surface">
          <SectionTitle
            title="Buchhaltungsaufgaben"
            subtitle="Heute relevant"
          />

          <div className="focus-list">
            <Focus
              icon="credit-card"
              label="Zahlung verbuchen"
              meta="RE-2026-009 · Muster AG"
            />

            <Focus
              icon="warning"
              label="Mahnung prüfen"
              meta="RE-2026-008 · 1 Tag überfällig"
              tone="danger"
            />

            <Focus
              icon="accounting"
              label="Monatsexport vorbereiten"
              meta="September 2026"
            />
          </div>
        </section>
      </div>
    </section>
  )
}

function EmployeeDashboard() {
  return (
    <section className="page">
      <PageHeader
        eyebrow="MEIN ARBEITSTAG"
        title="Hallo"
        description="Deine Aufträge, Zeiten und heutige Aufgaben."
      />

      <div className="metric-strip employee-metrics">
        <Metric
          label="Heute erfasst"
          value="8.0 h"
          detail="Soll 8.4 h"
          tone="positive"
        />

        <Metric
          label="September"
          value="124.5 h"
          detail="43.5 h offen"
        />

        <Metric
          label="Verrechenbar"
          value="112 h"
          detail="89.9 % deiner Zeiten"
        />
      </div>

      <div className="dashboard-layout">
        <section className="surface">
          <SectionTitle
            title="Meine Aufträge"
            subtitle="Aktuell zugewiesen"
          />

          <div className="compact-list">
            {orders
              .slice(0, 2)
              .map((order) => (
                <div key={order.id}>
                  <span className="primary-cell">
                    <strong>
                      {order.name}
                    </strong>

                    <small>
                      {order.customerName}
                    </small>
                  </span>

                  <span>
                    {order.budgetHours -
                      order.usedHours}{' '}
                    h Rest
                  </span>

                  <span className="status neutral">
                    Aktiv
                  </span>
                </div>
              ))}
          </div>
        </section>

        <section className="surface">
          <SectionTitle
            title="Schnellerfassung"
            subtitle="Heute"
          />

          <a
            href="/time?new=1"
            className="big-action"
          >
            <Icon
              name="time"
              size={20}
            />

            <span>
              <strong>
                Zeit erfassen
              </strong>

              <small>
                Auf Auftrag oder Tätigkeit buchen
              </small>
            </span>

            <Icon
              name="chevron"
              size={16}
            />
          </a>
        </section>
      </div>
    </section>
  )
}

function Metric({
  label,
  value,
  detail,
  tone,
}: {
  label: string
  value: string
  detail: string
  tone?:
    | 'positive'
    | 'warning'
    | 'danger'
}) {
  return (
    <div className="metric">
      <span>{label}</span>

      <strong>{value}</strong>

      <small
        className={
          tone
            ? `tone-${tone}`
            : undefined
        }
      >
        {detail}
      </small>
    </div>
  )
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string
  subtitle: string
}) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </div>
  )
}

function Focus({
  icon,
  label,
  meta,
  tone,
}: {
  icon: any
  label: string
  meta: string
  tone?: 'danger'
}) {
  return (
    <div className="focus-item">
      <span
        className={
          tone
            ? `focus-icon ${tone}`
            : 'focus-icon'
        }
      >
        <Icon
          name={icon}
          size={17}
        />
      </span>

      <span>
        <strong>{label}</strong>
        <small>{meta}</small>
      </span>

      <Icon
        name="chevron"
        size={15}
      />
    </div>
  )
}

function Status({
  value,
}: {
  value: string
}) {
  const map: Record<
    string,
    string
  > = {
    draft: 'Entwurf',
    sent: 'Versendet',
    accepted: 'Angenommen',
    declined: 'Abgelehnt',
    expired: 'Abgelaufen',
  }

  return (
    <span
      className={`status ${value}`}
    >
      {map[value] ?? value}
    </span>
  )
}
