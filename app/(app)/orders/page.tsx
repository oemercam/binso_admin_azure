import { orders } from '@/lib/data/demo'
import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'

const chf = new Intl.NumberFormat('de-CH', {
  style: 'currency',
  currency: 'CHF',
  maximumFractionDigits: 0,
})

export default function OrdersPage() {
  return (
    <section className="page">
      <PageHeader
        eyebrow="LEISTUNGEN"
        title="Aufträge"
        description="Budgets, Stundenverbrauch und Marge im Blick behalten."
        action={
          <button
            type="button"
            className="button primary"
          >
            <Icon
              name="plus"
              size={16}
            />
            Auftrag erfassen
          </button>
        }
      />

      <div className="order-cards">
        {orders.map((order) => {
          const remaining =
            order.budget - order.used

          const percentage = Math.round(
            (order.used / order.budget) * 100,
          )

          const revenue =
            order.used * order.salesRate

          const margin =
            order.used *
            (order.salesRate -
              order.costRate)

          const marginPercentage =
            Math.round(
              ((order.salesRate -
                order.costRate) /
                order.salesRate) *
                100,
            )

          return (
            <article
              className="order-card"
              key={order.name}
            >
              <div className="order-card-head">
                <div>
                  <span className="status status-good">
                    {order.status}
                  </span>

                  <h2>{order.name}</h2>

                  <p>{order.customer}</p>
                </div>

                <button
                  type="button"
                  className="icon-button"
                  aria-label={`${order.name} öffnen`}
                >
                  <Icon
                    name="chevron"
                    size={16}
                  />
                </button>
              </div>

              <div className="order-metrics">
                <div>
                  <span>Budget</span>
                  <strong>
                    {order.budget} h
                  </strong>
                </div>

                <div>
                  <span>Verbraucht</span>
                  <strong>
                    {order.used} h
                  </strong>
                </div>

                <div>
                  <span>Verfügbar</span>
                  <strong>
                    {remaining} h
                  </strong>
                </div>

                <div>
                  <span>Marge</span>
                  <strong>
                    {marginPercentage} %
                  </strong>
                </div>
              </div>

              <div className="progress">
                <i
                  style={{
                    width: `${percentage}%`,
                  }}
                />
              </div>

              <div className="order-finance">
                <span>
                  Umsatz bisher{' '}
                  <strong>
                    {chf.format(revenue)}
                  </strong>
                </span>

                <span>
                  Deckungsbeitrag{' '}
                  <strong>
                    {chf.format(margin)}
                  </strong>
                </span>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
