import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'

export default function AccountingPage() {
  return (
    <section className="page">
      <PageHeader eyebrow="BUCHHALTUNG" title="Buchhaltung" description="Zahlungen, Belege und Übergabe an die Finanzbuchhaltung." action={<button className="button primary"><Icon name="download" size={16}/> Export vorbereiten</button>} />

      <div className="metric-strip">
        <div className="metric"><span>Ungeprüfte Belege</span><strong>4</strong><small>CHF 1'282</small></div>
        <div className="metric"><span>Offene Zahlungen</span><strong>2</strong><small>CHF 6'180</small></div>
        <div className="metric"><span>Zu exportieren</span><strong>9</strong><small>September 2026</small></div>
        <div className="metric"><span>MWST</span><strong>CHF 1'436</strong><small>provisorisch</small></div>
      </div>

      <div className="dashboard-bottom-grid">
        <section className="section-block">
          <div className="section-title"><div><h2>Letzte Zahlungen</h2><p>Manuell oder via Bankabgleich</p></div></div>
          <div className="compact-list">
            <div><span className="primary-cell"><strong>RE-2026-007</strong><small>Tech Partner Schweiz AG</small></span><span>18.09.2026</span><strong>CHF 7'755</strong></div>
            <div><span className="primary-cell"><strong>Hosting September</strong><small>Microsoft Azure</small></span><span>16.09.2026</span><strong>- CHF 286</strong></div>
          </div>
        </section>

        <section className="section-block">
          <div className="section-title"><div><h2>Monatsabschluss</h2><p>September 2026</p></div></div>
          <div className="check-list">
            <div><Icon name="check" size={16}/><span>Rechnungen geprüft</span></div>
            <div><Icon name="check" size={16}/><span>Zahlungen abgeglichen</span></div>
            <div><Icon name="warning" size={16}/><span>4 Belege prüfen</span></div>
            <div><span className="empty-check"/><span>Export erstellen</span></div>
          </div>
        </section>
      </div>
    </section>
  )
}
