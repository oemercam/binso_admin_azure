import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { Icon } from '@/components/ui/icon'
import { orders, invoices } from '@/lib/data/demo'

const chf = new Intl.NumberFormat('de-CH', {
  style: 'currency',
  currency: 'CHF',
  maximumFractionDigits: 0,
})

export default function DashboardPage() {
  const activeOrders = orders.filter(
    (order) => order.status === 'Aktiv',
  )

  const openInvoices = invoices
    .filter((invoice) => invoice.status !== 'Bezahlt')
    .reduce(
      (sum, invoice) => sum + invoice.amount,
      0,
    )

  return (
    <section className="page">
      <PageHeader
        eyebrow="ÜBERSICHT"
        title="Dashboard"
        description="Aktueller Stand von Aufträgen, Zeiten und Finanzen."
      />

      <div className="kpi-grid">
        <StatCard
          label="Umsatz aus Zeiten"
          value="CHF 12'480"
          helper="September 2026"
          trend="+8.4 %"
          icon="money"
        />

        <StatCard
          label="Erfasste Stunden"
          value="124.5 h"
          helper="von 168 Sollstunden"
          icon="clock"
        />

        <StatCard
          label="Marge"
          value="32.4 %"
          helper="nach internen Kosten"
          trend="+2.1 %"
          icon="chart"
        />

        <StatCard
          label="Offene Rechnungen"
          value={chf.format(openInvoices)}
          helper="2 Positionen"
          icon="receipt"
        />
      </div>

      <div className="dashboard-grid">
        <article className="panel panel-table">
          <div className="panel-head">
            <div>
              <h2>Aktuelle Aufträge</h2>
              <p>Budget und Verbrauch</p>
            </div>

            <Link
              className="text-link"
              href="/orders"
            >
              Alle Aufträge
              <Icon
                name="chevron"
                size={14}
              />
            </Link>
          </div>

          <div className="project-list">
            {activeOrders.map((order) => {
              const percentage = Math.round(
                (order.used / order.budget) * 100,
              )

              return (
                <div
                  className="project-row"
                  key={order.name}
                >
                  <div className="project-main">
                    <div>
                      <strong>{order.name}</strong>
                      <span>{order.customer}</span>
                    </div>

                    <div className="project-numbers">
                      <strong>
                        {order.budget - order.used} h
                      </strong>
                      <span>verfügbar</span>
                    </div>
                  </div>

                  <div className="progress">
                    <i
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>

                  <div className="project-foot">
                    <span>
                      {order.used} von {order.budget} h
                    </span>

                    <span>
                      {percentage} % genutzt
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </article>

        <article className="panel month-panel">
          <div className="panel-head">
            <div>
              <h2>Monatsabschluss</h2>
              <p>September 2026</p>
            </div>

            <span className="status status-good">
              Bereit
            </span>
          </div>

          <dl className="summary compact">
            <div>
              <dt>Erfasste Zeiten</dt>
              <dd>124.5 h</dd>
            </div>

            <div>
              <dt>Fehlende Einträge</dt>
              <dd>0</dd>
            </div>

            <div>
              <dt>Bereite Rechnungen</dt>
              <dd>2</dd>
            </div>

            <div>
              <dt>Offene Freigaben</dt>
              <dd>0</dd>
            </div>
          </dl>

          <button
            type="button"
            className="button primary full"
          >
            Monat prüfen
          </button>
        </article>
      </div>

      <div className="dashboard-grid secondary-grid">
        <article className="panel">
          <div className="panel-head">
            <div>
              <h2>Finanzübersicht</h2>
              <p>Laufender Monat</p>
            </div>

            <Link
              className="text-link"
              href="/finance"
            >
              Details
              <Icon
                name="chevron"
                size={14}
              />
            </Link>
          </div>

          <div className="finance-summary">
            <div>
              <span>Umsatz</span>
              <strong>CHF 18'660</strong>
            </div>

            <div>
              <span>Interne Kosten</span>
              <strong>CHF 12'612</strong>
            </div>

            <div>
              <span>Deckungsbeitrag</span>
              <strong>CHF 6'048</strong>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="panel-head">
            <div>
              <h2>Fälligkeiten</h2>
              <p>Nächste Termine</p>
            </div>
          </div>

          <div className="deadline-list">
            <div>
              <span className="deadline-date">
                30 Sep
              </span>

              <span>
                <strong>RE-2026-009</strong>
                <small>
                  Muster AG · CHF 4'200
                </small>
              </span>
            </div>

            <div>
              <span className="deadline-date">
                30 Sep
              </span>

              <span>
                <strong>
                  Monatsabschluss
                </strong>

                <small>
                  Zeiterfassung September
                </small>
              </span>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}
