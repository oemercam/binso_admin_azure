'use client'

import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { ThemeControl } from '@/components/settings/theme-control'
import { PushSettings } from '@/components/pwa/push-settings'
import { Toggle } from '@/components/ui/toggle'
import { useBusinessStore } from '@/components/state/business-store'

type Tab = 'general' | 'mail' | 'automation' | 'documents' | 'appearance'

export default function SettingsPage() {
  const store = useBusinessStore()
  const [tab, setTab] = useState<Tab>('general')
  const [company, setCompany] = useState(store.companyProfile)
  const [templates, setTemplates] = useState(store.documentTemplates)
  const [saved, setSaved] = useState('')
  const [mobileDetail, setMobileDetail] = useState(false)

  const mailReady = useMemo(
    () =>
      Boolean(
        store.appSettings.mail.invoiceSender &&
          store.appSettings.mail.quoteSender &&
          store.appSettings.mail.reminderSender &&
          store.appSettings.mail.replyTo,
      ),
    [store.appSettings.mail],
  )

  function flash(message: string) {
    setSaved(message)
    window.setTimeout(() => setSaved(''), 2600)
  }

  function saveCompany(event: FormEvent) {
    event.preventDefault()
    store.updateCompanyProfile(company)
    flash('Unternehmensdaten gespeichert.')
  }

  function saveTemplates(event: FormEvent) {
    event.preventDefault()
    store.updateDocumentTemplates(templates)
    flash('Dokumentvorlagen gespeichert.')
  }

  return (
    <section className="page settings-page">
      <PageHeader
        eyebrow="EINSTELLUNGEN"
        title="Einstellungen"
        description="Unternehmen, Versand, Automationen und Benutzererlebnis zentral steuern."
      />

      {saved && (
        <div className="inline-notice">
          <span>{saved}</span>
        </div>
      )}

      <div className="settings-toolbar desktop-settings-tabs" role="tablist" aria-label="Einstellungen">
        <TabButton active={tab === 'general'} onClick={() => setTab('general')}>Allgemein</TabButton>
        <TabButton active={tab === 'mail'} onClick={() => setTab('mail')}>E-Mail und Versand</TabButton>
        <TabButton active={tab === 'automation'} onClick={() => setTab('automation')}>Automationen</TabButton>
        <TabButton active={tab === 'documents'} onClick={() => setTab('documents')}>Dokumente</TabButton>
        <TabButton active={tab === 'appearance'} onClick={() => setTab('appearance')}>Darstellung</TabButton>
      </div>

      <nav className={mobileDetail ? 'settings-mobile-hub detail-open' : 'settings-mobile-hub'} aria-label="Einstellungsbereiche">
        <SettingsHubRow title="Allgemein" meta="Unternehmensdaten und Workflow" onClick={() => { setTab('general'); setMobileDetail(true) }} />
        <SettingsHubRow title="E-Mail und Versand" meta={mailReady ? 'Absender vollständig' : 'Konfiguration unvollständig'} onClick={() => { setTab('mail'); setMobileDetail(true) }} />
        <SettingsHubRow title="Automationen" meta="Mahnungen, Lohn und Benachrichtigungen" onClick={() => { setTab('automation'); setMobileDetail(true) }} />
        <SettingsHubRow title="Dokumente" meta="Rechnung, Angebot und Mahnung" onClick={() => { setTab('documents'); setMobileDetail(true) }} />
        <SettingsHubRow title="Darstellung" meta="Theme und Push" onClick={() => { setTab('appearance'); setMobileDetail(true) }} />
      </nav>

      <div className={mobileDetail ? 'settings-content mobile-detail-open' : 'settings-content'}>
        <button type="button" className="settings-mobile-back" onClick={() => setMobileDetail(false)}>← Einstellungen</button>

      {tab === 'general' && (
        <>
          <section className="settings-group">
            <div className="settings-group-head">
              <div className="settings-group-copy">
                <h2>Unternehmensdaten</h2>
                <p>Diese Angaben erscheinen auf Angeboten, Rechnungen, Mahnungen und später auf Lohnabrechnungen.</p>
              </div>

              <form className="settings-inline-fields" onSubmit={saveCompany}>
                <Field label="Firma *"><input value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} required /></Field>
                <Field label="UID / MWST *"><input value={company.uid} onChange={(e) => setCompany({ ...company, uid: e.target.value })} required /></Field>
                <Field label="Adresse *" full><input value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} required /></Field>
                <Field label="PLZ *"><input value={company.zip} onChange={(e) => setCompany({ ...company, zip: e.target.value })} required /></Field>
                <Field label="Ort *"><input value={company.city} onChange={(e) => setCompany({ ...company, city: e.target.value })} required /></Field>
                <Field label="Land *"><input value={company.country} onChange={(e) => setCompany({ ...company, country: e.target.value })} required /></Field>
                <Field label="E-Mail *"><input type="email" value={company.email} onChange={(e) => setCompany({ ...company, email: e.target.value })} required /></Field>
                <Field label="Telefon"><input value={company.phone} onChange={(e) => setCompany({ ...company, phone: e.target.value })} /></Field>
                <Field label="IBAN *"><input value={company.iban} onChange={(e) => setCompany({ ...company, iban: e.target.value })} required /></Field>
                <Field label="Bank"><input value={company.bankName} onChange={(e) => setCompany({ ...company, bankName: e.target.value })} /></Field>
                <Field label="Standard-Zahlungsziel"><input type="number" min="1" max="120" value={company.defaultPaymentDays} onChange={(e) => setCompany({ ...company, defaultPaymentDays: Number(e.target.value) })} /></Field>
                <div className="full"><button className="button primary">Speichern</button></div>
              </form>
            </div>
          </section>

          <section className="settings-group">
            <div className="settings-group-head">
              <div className="settings-group-copy">
                <h2>Workflow-Regeln</h2>
                <p>Kontrollen, die Fehlbuchungen und versehentliche Änderungen verhindern.</p>
              </div>

              <div className="settings-stack">
                <SettingToggle label="Zeiten müssen freigegeben werden" description="Nur freigegebene Zeiten dürfen fakturiert oder für Stundenlohn verwendet werden." checked={store.appSettings.workflow.requireTimeApproval} onChange={(value) => store.updateAppSettings({ workflow: { ...store.appSettings.workflow, requireTimeApproval: value } })} />
                <SettingToggle label="Eigene Zeiten selbst freigeben" description="Für Enterprise-Betrieb standardmässig deaktiviert; Freigabe erfolgt durch berechtigte Rolle." checked={store.appSettings.workflow.allowSelfApproval} onChange={(value) => store.updateAppSettings({ workflow: { ...store.appSettings.workflow, allowSelfApproval: value } })} />
                <SettingToggle label="Verrechnete Zeiten sperren" description="Zeiten können nach Übernahme in eine Rechnung nicht mehr verändert werden." checked={store.appSettings.workflow.lockInvoicedTimes} onChange={(value) => store.updateAppSettings({ workflow: { ...store.appSettings.workflow, lockInvoicedTimes: value } })} />
                <SettingToggle label="Auftrag erst nach Angebotsannahme" description="Verhindert, dass aus offenen oder abgelehnten Angeboten versehentlich Aufträge entstehen." checked={store.appSettings.workflow.requireQuoteAcceptanceBeforeOrder} onChange={(value) => store.updateAppSettings({ workflow: { ...store.appSettings.workflow, requireQuoteAcceptanceBeforeOrder: value } })} />
              </div>
            </div>
          </section>
        </>
      )}

      {tab === 'mail' && (
        <>
          <section className="settings-group">
            <div className="settings-group-head">
              <div className="settings-group-copy">
                <h2>Microsoft 365 Versand</h2>
                <p>Absenderadressen je Dokumenttyp. Für den produktiven Versand wird später Microsoft Graph mit serverseitiger Berechtigung verbunden.</p>
                <div className="integration-status"><i /><span>{mailReady ? 'Adressen vollständig · Verbindung noch nicht aktiviert' : 'Versandkonfiguration unvollständig'}</span></div>
              </div>

              <div className="settings-inline-fields">
                <Field label="Absendername"><input value={store.appSettings.mail.senderName} onChange={(e) => store.updateAppSettings({ mail: { ...store.appSettings.mail, senderName: e.target.value } })} /></Field>
                <Field label="Antwortadresse"><input type="email" value={store.appSettings.mail.replyTo} onChange={(e) => store.updateAppSettings({ mail: { ...store.appSettings.mail, replyTo: e.target.value } })} /></Field>
                <Field label="Rechnungen"><input type="email" value={store.appSettings.mail.invoiceSender} onChange={(e) => store.updateAppSettings({ mail: { ...store.appSettings.mail, invoiceSender: e.target.value } })} /></Field>
                <Field label="Angebote"><input type="email" value={store.appSettings.mail.quoteSender} onChange={(e) => store.updateAppSettings({ mail: { ...store.appSettings.mail, quoteSender: e.target.value } })} /></Field>
                <Field label="Mahnungen"><input type="email" value={store.appSettings.mail.reminderSender} onChange={(e) => store.updateAppSettings({ mail: { ...store.appSettings.mail, reminderSender: e.target.value } })} /></Field>
                <Field label="Lohnabrechnungen"><input type="email" value={store.appSettings.mail.payrollSender} onChange={(e) => store.updateAppSettings({ mail: { ...store.appSettings.mail, payrollSender: e.target.value } })} /></Field>
                <Field label="CC Buchhaltung"><input type="email" placeholder="optional" value={store.appSettings.mail.financeCc} onChange={(e) => store.updateAppSettings({ mail: { ...store.appSettings.mail, financeCc: e.target.value } })} /></Field>
              </div>
            </div>
          </section>

          <section className="settings-group">
            <div className="settings-group-head">
              <div className="settings-group-copy"><h2>Versandoptionen</h2><p>Standardverhalten für alle geschäftlichen E-Mails.</p></div>
              <div className="settings-stack">
                <SettingToggle label="PDF automatisch anhängen" description="Angebote, Rechnungen, Mahnungen und Lohnabrechnungen werden als PDF angehängt." checked={store.appSettings.mail.attachPdf} onChange={(value) => store.updateAppSettings({ mail: { ...store.appSettings.mail, attachPdf: value } })} />
                <SettingToggle label="Versand protokollieren" description="Speichert die gewünschte Protokollierungsregel. Das revisionssichere serverseitige Audit-Log wird mit der Datenbank angebunden." checked={store.appSettings.mail.deliveryTracking} onChange={(value) => store.updateAppSettings({ mail: { ...store.appSettings.mail, deliveryTracking: value } })} />
                <SettingToggle label="Kopie an Absender" description="Optional eine Kopie jeder versendeten Nachricht im Absenderpostfach zustellen." checked={store.appSettings.mail.copySender} onChange={(value) => store.updateAppSettings({ mail: { ...store.appSettings.mail, copySender: value } })} />
              </div>
            </div>
          </section>
        </>
      )}

      {tab === 'automation' && (
        <>
          <div className="integration-banner"><strong>Automationen sind konfiguriert, aber noch nicht serverseitig aktiv.</strong><span>Die Regeln werden gespeichert. Ausführung benötigt Azure-Datenbank, Microsoft Graph und einen Scheduler/Worker.</span></div>
          <section className="settings-group">
            <div className="settings-group-head">
              <div className="settings-group-copy">
                <h2>Mahnwesen</h2>
                <p>Automatisierbare Mahnstufen. Automatischer Versand bleibt getrennt aktivierbar, damit die Buchhaltung die Kontrolle behält.</p>
              </div>

              <div className="settings-stack">
                <SettingToggle label="Mahnwesen aktiv" description="Überfällige Rechnungen werden für den Mahnprozess berücksichtigt." checked={store.appSettings.reminders.enabled} onChange={(value) => store.updateAppSettings({ reminders: { ...store.appSettings.reminders, enabled: value } })} />
                <SettingToggle label="Mahnungen automatisch senden" description="Regel für den späteren Scheduler. Ohne Microsoft Graph und Worker wird noch keine Mahnung automatisch verschickt." checked={store.appSettings.reminders.automaticSend} onChange={(value) => store.updateAppSettings({ reminders: { ...store.appSettings.reminders, automaticSend: value } })} disabled={!store.appSettings.reminders.enabled} />
                <NumberLine label="1. Erinnerung" description="Tage nach Fälligkeit" value={store.appSettings.reminders.firstAfterDays} onChange={(value) => store.updateAppSettings({ reminders: { ...store.appSettings.reminders, firstAfterDays: value } })} />
                <NumberLine label="2. Mahnung" description="Tage nach Fälligkeit" value={store.appSettings.reminders.secondAfterDays} onChange={(value) => store.updateAppSettings({ reminders: { ...store.appSettings.reminders, secondAfterDays: value } })} />
                <NumberLine label="3. Mahnung" description="Tage nach Fälligkeit" value={store.appSettings.reminders.thirdAfterDays} onChange={(value) => store.updateAppSettings({ reminders: { ...store.appSettings.reminders, thirdAfterDays: value } })} />
                <SettingToggle label="Nur Werktage" description="Automatische Mahnungen nicht an Wochenenden auslösen." checked={store.appSettings.reminders.onlyBusinessDays} onChange={(value) => store.updateAppSettings({ reminders: { ...store.appSettings.reminders, onlyBusinessDays: value } })} />
                <SettingToggle label="Nach Zahlung sofort stoppen" description="Keine weitere Mahnung, sobald die Rechnung vollständig bezahlt ist." checked={store.appSettings.reminders.stopWhenPaid} onChange={(value) => store.updateAppSettings({ reminders: { ...store.appSettings.reminders, stopWhenPaid: value } })} />
              </div>
            </div>
          </section>

          <section className="settings-group">
            <div className="settings-group-head">
              <div className="settings-group-copy">
                <h2>Stundenlohn und Lohnabrechnung</h2>
                <p>Der Trigger bezieht sich auf die Freigabe des abgeschlossenen Monats, nicht auf einzelne Zeiteinträge. So wird verhindert, dass unvollständige Lohnabrechnungen versendet werden.</p>
              </div>

              <div className="settings-stack">
                <SettingToggle label="Lohnprozess aktiv" description="Freigegebene Monatszeiten können für die Lohnvorbereitung verwendet werden." checked={store.appSettings.payroll.enabled} onChange={(value) => store.updateAppSettings({ payroll: { ...store.appSettings.payroll, enabled: value } })} />
                <SettingToggle label="Lohnabrechnung nach Freigabe vorbereiten" description="Regel für den späteren Lohn-Worker: Nach Monatsfreigabe einen Abrechnungsentwurf für Stundenlohn-Mitarbeitende erzeugen." checked={store.appSettings.payroll.generateAfterApprovedTimesheet} onChange={(value) => store.updateAppSettings({ payroll: { ...store.appSettings.payroll, generateAfterApprovedTimesheet: value } })} disabled={!store.appSettings.payroll.enabled} />
                <SettingToggle label="Nur Stundenlohn-Mitarbeitende" description="Festlohn-Mitarbeitende werden nicht aus Zeiterfassungen automatisch abgerechnet." checked={store.appSettings.payroll.hourlyEmployeesOnly} onChange={(value) => store.updateAppSettings({ payroll: { ...store.appSettings.payroll, hourlyEmployeesOnly: value } })} disabled={!store.appSettings.payroll.enabled} />
                <SettingToggle label="Freigabe durch Buchhaltung erforderlich" description="Empfohlene Enterprise-Einstellung: Entwurf automatisch erzeugen, Versand erst nach Finanzfreigabe." checked={store.appSettings.payroll.requireFinanceApproval} onChange={(value) => store.updateAppSettings({ payroll: { ...store.appSettings.payroll, requireFinanceApproval: value } })} disabled={!store.appSettings.payroll.enabled} />
                <SettingToggle label="Nach Freigabe automatisch versenden" description="Versendet die freigegebene PDF-Lohnabrechnung automatisch über die konfigurierte Absenderadresse." checked={store.appSettings.payroll.autoSend} onChange={(value) => store.updateAppSettings({ payroll: { ...store.appSettings.payroll, autoSend: value } })} disabled={!store.appSettings.payroll.enabled} />

                <div className="setting-line">
                  <span className="setting-line-copy"><strong>E-Mail-Betreff</strong><small>Platzhalter: {'{{period}}'}, {'{{name}}'}</small></span>
                  <input type="text" value={store.appSettings.payroll.subject} onChange={(e) => store.updateAppSettings({ payroll: { ...store.appSettings.payroll, subject: e.target.value } })} />
                </div>

                <div className="setting-line" style={{ gridTemplateColumns: '1fr' }}>
                  <span className="setting-line-copy"><strong>E-Mail-Text</strong><small>Wird zusammen mit der PDF-Lohnabrechnung verwendet.</small></span>
                  <textarea className="automation-textarea" value={store.appSettings.payroll.emailBody} onChange={(e) => store.updateAppSettings({ payroll: { ...store.appSettings.payroll, emailBody: e.target.value } })} />
                </div>
              </div>
            </div>
          </section>

          <section className="settings-group">
            <div className="settings-group-head">
              <div className="settings-group-copy"><h2>Benachrichtigungen</h2><p>Welche Ereignisse im Admin-Portal und später per Push erscheinen.</p></div>
              <div className="settings-stack">
                <SettingToggle label="Rechnung überfällig" description="Fälligkeit überschritten und noch nicht vollständig bezahlt." checked={store.appSettings.notifications.overdueInvoice} onChange={(value) => store.updateAppSettings({ notifications: { ...store.appSettings.notifications, overdueInvoice: value } })} />
                <SettingToggle label="Auftragsbudget ab 80 %" description="Frühwarnung bevor das Stundenbudget ausgeschöpft ist." checked={store.appSettings.notifications.budgetWarning} onChange={(value) => store.updateAppSettings({ notifications: { ...store.appSettings.notifications, budgetWarning: value } })} />
                <SettingToggle label="Angebot läuft aus" description="Erinnerung vor dem Gültigkeitsende eines offenen Angebots." checked={store.appSettings.notifications.expiringQuote} onChange={(value) => store.updateAppSettings({ notifications: { ...store.appSettings.notifications, expiringQuote: value } })} />
                <SettingToggle label="Zahlung eingegangen" description="Information bei verbuchter Teil- oder Vollzahlung." checked={store.appSettings.notifications.paymentReceived} onChange={(value) => store.updateAppSettings({ notifications: { ...store.appSettings.notifications, paymentReceived: value } })} />
                <SettingToggle label="Monatszeiten bereit zur Freigabe" description="Hinweis an Admin/Buchhaltung, sobald die Zeiterfassung vollständig ist." checked={store.appSettings.notifications.timesheetReady} onChange={(value) => store.updateAppSettings({ notifications: { ...store.appSettings.notifications, timesheetReady: value } })} />
              </div>
            </div>
          </section>
        </>
      )}

      {tab === 'documents' && (
        <section className="settings-group">
          <div className="settings-group-head">
            <div className="settings-group-copy">
              <h2>Dokumentvorlagen</h2>
              <p>Einleitungs-, Schluss- und E-Mail-Texte. Neue Dokumente übernehmen die Vorlage; danach bleibt die jeweilige Dokumentversion unabhängig bearbeitbar.</p>
            </div>

            <form className="settings-stack" onSubmit={saveTemplates}>
              <TemplateSection title="Rechnung" intro={templates.invoiceIntro} outro={templates.invoiceOutro} subject={templates.invoiceEmailSubject} body={templates.invoiceEmailBody} onIntro={(value) => setTemplates({ ...templates, invoiceIntro: value })} onOutro={(value) => setTemplates({ ...templates, invoiceOutro: value })} onSubject={(value) => setTemplates({ ...templates, invoiceEmailSubject: value })} onBody={(value) => setTemplates({ ...templates, invoiceEmailBody: value })} />
              <TemplateSection title="Angebot" intro={templates.quoteIntro} outro={templates.quoteOutro} subject={templates.quoteEmailSubject} body={templates.quoteEmailBody} onIntro={(value) => setTemplates({ ...templates, quoteIntro: value })} onOutro={(value) => setTemplates({ ...templates, quoteOutro: value })} onSubject={(value) => setTemplates({ ...templates, quoteEmailSubject: value })} onBody={(value) => setTemplates({ ...templates, quoteEmailBody: value })} />
              <TemplateSection title="Mahnung" intro={templates.reminderIntro} outro={templates.reminderOutro} subject={templates.reminderEmailSubject} body={templates.reminderEmailBody} onIntro={(value) => setTemplates({ ...templates, reminderIntro: value })} onOutro={(value) => setTemplates({ ...templates, reminderOutro: value })} onSubject={(value) => setTemplates({ ...templates, reminderEmailSubject: value })} onBody={(value) => setTemplates({ ...templates, reminderEmailBody: value })} />
              <div className="settings-note">Verfügbare Platzhalter: <code>{'{{number}}'}</code>, <code>{'{{amount}}'}</code>, <code>{'{{customer}}'}</code>, <code>{'{{period}}'}</code>, <code>{'{{name}}'}</code>.</div>
              <div><button className="button primary">Vorlagen speichern</button></div>
            </form>
          </div>
        </section>
      )}

      {tab === 'appearance' && (
        <>
          <section className="settings-group">
            <div className="settings-group-head">
              <div className="settings-group-copy"><h2>Darstellung</h2><p>Systemdarstellung übernehmen oder Hell-/Dunkelmodus manuell festlegen.</p></div>
              <ThemeControl />
            </div>
          </section>
          <section className="settings-group">
            <div className="settings-group-head">
              <div className="settings-group-copy"><h2>Push-Benachrichtigungen</h2><p>PWA-Benachrichtigungen für Fälligkeiten, Budgetwarnungen und Freigaben.</p></div>
              <PushSettings />
            </div>
          </section>
        </>
      )}
      </div>
    </section>
  )
}

function SettingsHubRow({ title, meta, onClick }: { title:string; meta:string; onClick:()=>void }) {
  return <button type="button" className="hub-row settings-hub-row" onClick={onClick}><span><strong>{title}</strong><small>{meta}</small></span><span aria-hidden="true">›</span></button>
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" role="tab" aria-selected={active} className={active ? 'active' : undefined} onClick={onClick}>{children}</button>
}

function Field({ label, full = false, children }: { label: string; full?: boolean; children: ReactNode }) {
  return <label className={`settings-field${full ? ' full' : ''}`}><span>{label}</span>{children}</label>
}

function SettingToggle({ label, description, checked, onChange, disabled = false }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
  return (
    <div className="setting-line">
      <span className="setting-line-copy"><strong>{label}</strong><small>{description}</small></span>
      <Toggle label={label} checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  )
}

function NumberLine({ label, description, value, onChange }: { label: string; description: string; value: number; onChange: (value: number) => void }) {
  return (
    <div className="setting-line">
      <span className="setting-line-copy"><strong>{label}</strong><small>{description}</small></span>
      <input type="number" min="0" max="90" value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  )
}

function TemplateSection({ title, intro, outro, subject, body, onIntro, onOutro, onSubject, onBody }: { title: string; intro: string; outro: string; subject: string; body: string; onIntro: (value: string) => void; onOutro: (value: string) => void; onSubject: (value: string) => void; onBody: (value: string) => void }) {
  return (
    <details className="template-editor" open={title === 'Rechnung'}>
      <summary><strong>{title}</strong><span>Texte und E-Mail-Vorlage</span></summary>
      <div className="template-editor-fields">
        <label><span>Einleitungstext</span><textarea rows={4} value={intro} onChange={(e) => onIntro(e.target.value)} /></label>
        <label><span>Schlusstext</span><textarea rows={4} value={outro} onChange={(e) => onOutro(e.target.value)} /></label>
        <label><span>E-Mail-Betreff</span><input value={subject} onChange={(e) => onSubject(e.target.value)} /></label>
        <label><span>E-Mail-Text</span><textarea rows={5} value={body} onChange={(e) => onBody(e.target.value)} /></label>
      </div>
    </details>
  )
}
