import { invoices } from '@/lib/data/demo'
import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'

const chf = new Intl.NumberFormat('de-CH', {
  style: 'currency',
  currency: 'CHF',
  maximumFractionDigits: 0,
})

function statusClass(status: string) {
  if (status === 'Bezahlt') {
    return 'status status-good'
  }

  if (status === 'Überfällig') {
    return 'status status-danger'
  }

  return 'status status-neutral'
}

export default function InvoicesPage() {
  const openAmount = invoices
    .filter((invoice) => invoice.status !== 'Bezahlt')
    .reduce(
      (sum, invoice) => sum + invoice.amount,
      0,
    )

  const paidAmount = invoices
    .filter((invoice) => invoice.status === 'Bezahlt')
    .reduce(
      (sum, invoice) => sum + invoice.amount,
      0,
    )

  return (
    <section className="page">
      <PageHeader
        eyebrow="FAKTURIERUNG"
        title="Rechnungen"
        description="Rechnungen vorbereiten, verfolgen und abschliessen."
        action={
          <button
            type="button"
            className="button primary"
          >
            <Icon
              name="plus"
              size={16}
            />
            Rechnung erstellen
          </button>
        }
      />

      <div className="invoice-summary">
        <div>
          <span>Offen</span>
          <strong>{chf.format(openAmount)}</strong>
        </div>

        <div>
          <span>Bezahlt</span>
          <strong>{chf.format(paidAmount)}</strong>
        </div>

        <div>
          <span>Überfällig</span>
          <strong>1</strong>
        </div>
      </div>

      <div className="toolbar-card">
        <div className="inline-search">
          <Icon
            name="search"
            size={16}
          />

          <input
            type="search"
            placeholder="Rechnungen durchsuchen"
            aria-label="Rechnungen durchsuchen"
          />
        </div>

        <button
          type="button"
          className="button secondary compact-button"
        >
          Alle Status
        </button>
      </div>

      <div className="table-shell">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nummer</th>
              <th>Kunde</th>
              <th>Periode</th>
              <th>Fällig</th>
              <th className="numeric">Betrag</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>

          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.number}>
                <td>
                  <strong>{invoice.number}</strong>
                </td>

                <td>{invoice.customer}</td>

                <td>{invoice.period}</td>

                <td>{invoice.due}</td>

                <td className="numeric">
                  {chf.format(invoice.amount)}
                </td>

                <td>
                  <span className={statusClass(invoice.status)}>
                    {invoice.status}
                  </span>
                </td>

                <td className="row-action">
                  <button
                    type="button"
                    aria-label={`${invoice.number} öffnen`}
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
        {invoices.map((invoice) => (
          <article
            className="mobile-record"
            key={invoice.number}
          >
            <div className="record-head">
              <span>
                <strong>{invoice.number}</strong>
                <small>{invoice.customer}</small>
              </span>

              <span className={statusClass(invoice.status)}>
                {invoice.status}
              </span>
            </div>

            <div className="record-grid">
              <div>
                <span>Betrag</span>
                <strong>
                  {chf.format(invoice.amount)}
                </strong>
              </div>

              <div>
                <span>Fällig</span>
                <strong>{invoice.due}</strong>
              </div>
            </div>

            <p className="record-note">
              {invoice.period}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}
