import { customers } from '@/lib/data/demo'
import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'

const chf = new Intl.NumberFormat('de-CH', {
  style: 'currency',
  currency: 'CHF',
  maximumFractionDigits: 0,
})

export default function CustomersPage() {
  return (
    <section className="page">
      <PageHeader
        eyebrow="STAMMDATEN"
        title="Kunden"
        description="Kunden, Kontakte und offene Positionen."
        action={
          <button
            type="button"
            className="button primary"
          >
            <Icon
              name="plus"
              size={16}
            />
            Kunde erfassen
          </button>
        }
      />

      <div className="toolbar-card">
        <div className="inline-search">
          <Icon
            name="search"
            size={16}
          />

          <input
            type="search"
            placeholder="Kunden durchsuchen"
            aria-label="Kunden durchsuchen"
          />
        </div>

        <button
          type="button"
          className="button secondary compact-button"
        >
          Alle Kunden
        </button>
      </div>

      <div className="table-shell">
        <table className="data-table">
          <thead>
            <tr>
              <th>Kunde</th>
              <th>Ansprechperson</th>
              <th>Aufträge</th>
              <th>Offen</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>

          <tbody>
            {customers.map((customer) => (
              <tr key={customer.name}>
                <td>
                  <div className="entity">
                    <span className="entity-avatar">
                      <Icon
                        name="building"
                        size={16}
                      />
                    </span>

                    <span>
                      <strong>
                        {customer.name}
                      </strong>

                      <small>
                        {customer.email}
                      </small>
                    </span>
                  </div>
                </td>

                <td>
                  {customer.contact}
                </td>

                <td>
                  {customer.orders}
                </td>

                <td className="numeric">
                  {chf.format(customer.open)}
                </td>

                <td>
                  <span className="status status-good">
                    {customer.status}
                  </span>
                </td>

                <td className="row-action">
                  <button
                    type="button"
                    aria-label={`${customer.name} öffnen`}
                  >
                    <Icon
                      name="chevron"
                      size={15}
                    />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mobile-card-list">
        {customers.map((customer) => (
          <article
            className="mobile-record"
            key={customer.name}
          >
            <div className="record-head">
              <div className="entity">
                <span className="entity-avatar">
                  <Icon
                    name="building"
                    size={16}
                  />
                </span>

                <span>
                  <strong>
                    {customer.name}
                  </strong>

                  <small>
                    {customer.contact}
                  </small>
                </span>
              </div>

              <Icon
                name="chevron"
                size={16}
              />
            </div>

            <div className="record-grid">
              <div>
                <span>Aufträge</span>
                <strong>
                  {customer.orders}
                </strong>
              </div>

              <div>
                <span>Offen</span>
                <strong>
                  {chf.format(
                    customer.open,
                  )}
                </strong>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
