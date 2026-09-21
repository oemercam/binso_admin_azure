import { timeEntries } from '@/lib/data/demo'
import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'

export default function TimePage() {
  const totalHours = timeEntries.reduce(
    (sum, entry) => sum + entry.hours,
    0,
  )

  return (
    <section className="page">
      <PageHeader
        eyebrow="ARBEITSZEIT"
        title="Zeiterfassung"
        description="Arbeitszeiten erfassen und Monatsabschluss vorbereiten."
        action={
          <button
            type="button"
            className="button primary"
          >
            <Icon
              name="plus"
              size={16}
            />
            Zeit erfassen
          </button>
        }
      />

      <div className="time-summary">
        <article>
          <span>Erfasst</span>
          <strong>{totalHours} h</strong>
          <small>aktuelle Einträge</small>
        </article>

        <article>
          <span>Soll September</span>
          <strong>168 h</strong>
          <small>100 % Pensum</small>
        </article>

        <article>
          <span>Noch offen</span>
          <strong>43.5 h</strong>
          <small>bis Monatsabschluss</small>
        </article>
      </div>

      <div className="toolbar-card">
        <div className="inline-search">
          <Icon
            name="search"
            size={16}
          />

          <input
            type="search"
            placeholder="Zeiteinträge durchsuchen"
            aria-label="Zeiteinträge durchsuchen"
          />
        </div>

        <button
          type="button"
          className="button secondary compact-button"
        >
          September 2026
        </button>
      </div>

      <div className="table-shell">
        <table className="data-table">
          <thead>
            <tr>
              <th>Datum</th>
              <th>Auftrag</th>
              <th>Kunde</th>
              <th>Tätigkeit</th>
              <th className="numeric">Stunden</th>
              <th />
            </tr>
          </thead>

          <tbody>
            {timeEntries.map((entry) => (
              <tr
                key={`${entry.date}-${entry.project}-${entry.activity}`}
              >
                <td>
                  <strong>{entry.date}</strong>
                </td>

                <td>
                  <strong>{entry.project}</strong>
                </td>

                <td>{entry.customer}</td>

                <td>{entry.activity}</td>

                <td className="numeric">
                  {entry.hours} h
                </td>

                <td className="row-action">
                  <button
                    type="button"
                    aria-label="Zeiteintrag öffnen"
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
        {timeEntries.map((entry) => (
          <article
            className="mobile-record"
            key={`${entry.date}-${entry.project}-${entry.activity}`}
          >
            <div className="record-head">
              <span>
                <strong>{entry.activity}</strong>
                <small>
                  {entry.date} · {entry.customer}
                </small>
              </span>

              <strong>{entry.hours} h</strong>
            </div>

            <p className="record-note">
              {entry.project}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}
