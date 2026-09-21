import { PageHeader } from '@/components/ui/page-header'
import { ThemeControl } from '@/components/settings/theme-control'
import { PushSettings } from '@/components/pwa/push-settings'

export default function SettingsPage() {
  return (
    <section className="page settings-page">
      <PageHeader eyebrow="EINSTELLUNGEN" title="Einstellungen" description="Persönliche Darstellung, Benachrichtigungen und Administration." />

      <div className="settings-sections">
        <section className="settings-row">
          <div><h2>Darstellung</h2><p>Systemdarstellung automatisch übernehmen oder manuell wählen.</p></div>
          <ThemeControl />
        </section>

        <section className="settings-row">
          <div><h2>Push-Benachrichtigungen</h2><p>Fälligkeiten, Budgetwarnungen und wichtige Aufgaben auf Mobilgeräten.</p></div>
          <PushSettings />
        </section>

        <section className="settings-row">
          <div><h2>Benachrichtigungsregeln</h2><p>Welche Ereignisse eine Meldung auslösen.</p></div>
          <div className="switch-list">
            <label><span>Rechnung überfällig</span><input type="checkbox" defaultChecked /></label>
            <label><span>Auftragsbudget über 80 %</span><input type="checkbox" defaultChecked /></label>
            <label><span>Angebot läuft aus</span><input type="checkbox" defaultChecked /></label>
          </div>
        </section>

        <section className="settings-row">
          <div><h2>Unternehmen</h2><p>Stammdaten und Standardwerte.</p></div>
          <dl className="settings-values">
            <div><dt>Firma</dt><dd>Binso GmbH</dd></div>
            <div><dt>Währung</dt><dd>CHF</dd></div>
            <div><dt>Zahlungsziel</dt><dd>30 Tage</dd></div>
          </dl>
        </section>
      </div>
    </section>
  )
}
