'use client'

import { Textarea, Input } from '@/components/ui/form-controls'

import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { ThemeControl } from '@/components/settings/theme-control'
import { PushSettings } from '@/components/pwa/push-settings'
import { StandardFormSheet } from '@/components/ui/sheet-system'
import { ResponsiveOverlay } from '@/components/ui/responsive-overlay'
import { SettingsSection, SettingsToggleRow, SettingsValueRow } from '@/components/settings/settings-row'
import { useFeedback } from '@/components/ui/feedback'
import { useBusinessStore } from '@/components/state/business-store'
import { useCurrentUser } from '@/components/state/current-user'
import { canManageSettings as roleCanManageSettings } from '@/lib/auth/capabilities'
import type { DocumentTemplates } from '@/types/domain'
import { appIdentity } from '@/lib/config/app-identity'

type Tab = 'general' | 'mail' | 'automation' | 'documents' | 'appearance'
type CompanyEditor = 'company' | 'address' | 'contact' | 'bank'
type MailKey = 'senderName' | 'replyTo' | 'invoiceSender' | 'quoteSender' | 'reminderSender' | 'financeCc'
type TemplateKind = 'invoice' | 'quote' | 'reminder'
type Editor =
  | { kind: 'company'; section: CompanyEditor }
  | { kind: 'mail'; key: MailKey; title: string; inputType?: string }
  | { kind: 'template'; template: TemplateKind; title: string }
  | { kind: 'theme' }
  | { kind: 'push' }
  | null

export default function SettingsPage() {
  const store = useBusinessStore()
  const user = useCurrentUser()
  const canManageSettings = roleCanManageSettings(user.role)
  const [tab, setTab] = useState<Tab>(canManageSettings ? 'general' : 'appearance')
  const [company, setCompany] = useState(store.companyProfile)
  const [templates, setTemplates] = useState(store.documentTemplates)
  const feedback = useFeedback()
  const [mobileDetail, setMobileDetail] = useState(false)
  const [editor, setEditor] = useState<Editor>(null)
  const [editValue, setEditValue] = useState('')

  const mailReady = useMemo(
    () => Boolean(
      store.appSettings.mail.invoiceSender &&
      store.appSettings.mail.quoteSender &&
      store.appSettings.mail.reminderSender &&
      store.appSettings.mail.replyTo,
    ),
    [store.appSettings.mail],
  )

  function flash(message: string) {
    feedback.success(message)
  }

  function openMail(key: MailKey, title: string, inputType = 'text') {
    setEditValue(String(store.appSettings.mail[key] ?? ''))
    setEditor({ kind: 'mail', key, title, inputType })
  }



  function openCompany(section: CompanyEditor) {
    setCompany(store.companyProfile)
    setEditor({ kind: 'company', section })
  }

  function openTemplate(template: TemplateKind, title: string) {
    setTemplates(store.documentTemplates)
    setEditor({ kind: 'template', template, title })
  }

  function closeEditor() {
    setEditor(null)
    setEditValue('')
  }

  function saveScalar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editor) return
    if (editor.kind === 'mail') {
      store.updateAppSettings({ mail: { ...store.appSettings.mail, [editor.key]: editValue } })
      flash(`${editor.title} gespeichert.`)
    }
    closeEditor()
  }

  function saveCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    store.updateCompanyProfile(company)
    flash('Unternehmensdaten gespeichert.')
    closeEditor()
  }

  function saveTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    store.updateDocumentTemplates(templates)
    flash('Dokumentvorlage gespeichert.')
    closeEditor()
  }

  return (
    <section className="page settings-page">
      <PageHeader eyebrow="EINSTELLUNGEN" title="Einstellungen" description={canManageSettings ? 'Unternehmen, Versand, Benachrichtigungen und Darstellung verwalten.' : 'Darstellung und Benachrichtigungen verwalten.'} />


      <div className="settings-toolbar desktop-settings-tabs" role="tablist" aria-label="Einstellungen">
        {canManageSettings && <><TabButton active={tab === 'general'} onClick={() => setTab('general')}>Allgemein</TabButton><TabButton active={tab === 'mail'} onClick={() => setTab('mail')}>E-Mail und Versand</TabButton><TabButton active={tab === 'automation'} onClick={() => setTab('automation')}>Benachrichtigungen</TabButton><TabButton active={tab === 'documents'} onClick={() => setTab('documents')}>Dokumente</TabButton></>}
        <TabButton active={tab === 'appearance'} onClick={() => setTab('appearance')}>Darstellung</TabButton>
      </div>

      <nav className={mobileDetail ? 'settings-mobile-hub detail-open' : 'settings-mobile-hub'} aria-label="Einstellungsbereiche">
        {canManageSettings && <><SettingsHubRow title="Allgemein" meta="Unternehmensdaten und Workflow" onClick={() => { setTab('general'); setMobileDetail(true) }} /><SettingsHubRow title="E-Mail und Versand" meta={mailReady ? 'Absender vollständig' : 'Konfiguration unvollständig'} onClick={() => { setTab('mail'); setMobileDetail(true) }} /><SettingsHubRow title="Benachrichtigungen" meta="Rechnungen und Angebote" onClick={() => { setTab('automation'); setMobileDetail(true) }} /><SettingsHubRow title="Dokumente" meta="Rechnung, Angebot und Mahnung" onClick={() => { setTab('documents'); setMobileDetail(true) }} /></>}
        <SettingsHubRow title="Darstellung" meta="Theme und Push" onClick={() => { setTab('appearance'); setMobileDetail(true) }} />
      </nav>

      <div className={mobileDetail ? 'settings-content mobile-detail-open' : 'settings-content'}>
        <button type="button" className="settings-mobile-back" onClick={() => setMobileDetail(false)}>← Einstellungen</button>

        {canManageSettings && tab === 'general' && (
          <>
            <SettingsSection title="Unternehmensdaten" description="Aktueller Stand. Zum Bearbeiten einen Bereich öffnen.">
              <SettingsValueRow title="Unternehmen" value={store.companyProfile.name} description={store.companyProfile.uid || 'UID / MWST nicht gesetzt'} onClick={() => openCompany('company')} />
              <SettingsValueRow title="Adresse" value={`${store.companyProfile.zip} ${store.companyProfile.city}`} description={store.companyProfile.address} onClick={() => openCompany('address')} />
              <SettingsValueRow title="Kontakt" value={store.companyProfile.email} description={store.companyProfile.phone || 'Telefon nicht gesetzt'} onClick={() => openCompany('contact')} />
              <SettingsValueRow title="Bank und Zahlungsziel" value={`${store.companyProfile.defaultPaymentDays} Tage`} description={store.companyProfile.iban || 'IBAN nicht gesetzt'} onClick={() => openCompany('bank')} />
            </SettingsSection>



            <SettingsSection title="App-Informationen" description="Produkt- und Buildinformationen für Support und Betrieb.">
              <SettingsValueRow title="Anwendung" value={appIdentity.name} description={appIdentity.company} />
              <SettingsValueRow title="Version" value={appIdentity.version} description={`Build ${appIdentity.build}`} />
              <SettingsValueRow title="Umgebung" value={appIdentity.environment} description={appIdentity.buildDate ? `Stand ${appIdentity.buildDate}` : 'Lokaler/ungekennzeichneter Build'} />
              <SettingsValueRow title="Support" value={appIdentity.supportEmail} description={appIdentity.website} />
            </SettingsSection>

            <SettingsSection title="Workflow-Regeln" description="Binäre Regeln können direkt ein- oder ausgeschaltet werden.">
              <SettingsToggleRow title="Zeiten müssen freigegeben werden" description="Nur freigegebene Zeiten dürfen fakturiert oder für Stundenlohn verwendet werden." checked={store.appSettings.workflow.requireTimeApproval} onChange={(value) => store.updateAppSettings({ workflow: { ...store.appSettings.workflow, requireTimeApproval: value } })} />
              <SettingsToggleRow title="Eigene Zeiten selbst freigeben" description="Freigabe durch die erfassende Person erlauben." checked={store.appSettings.workflow.allowSelfApproval} onChange={(value) => store.updateAppSettings({ workflow: { ...store.appSettings.workflow, allowSelfApproval: value } })} />
              <SettingsToggleRow title="Verrechnete Zeiten sperren" description="Nach Übernahme in eine Rechnung nicht mehr verändern." checked={store.appSettings.workflow.lockInvoicedTimes} onChange={(value) => store.updateAppSettings({ workflow: { ...store.appSettings.workflow, lockInvoicedTimes: value } })} />
              <SettingsToggleRow title="Auftrag erst nach Angebotsannahme" description="Verhindert Aufträge aus offenen oder abgelehnten Angeboten." checked={store.appSettings.workflow.requireQuoteAcceptanceBeforeOrder} onChange={(value) => store.updateAppSettings({ workflow: { ...store.appSettings.workflow, requireQuoteAcceptanceBeforeOrder: value } })} />
            </SettingsSection>
          </>
        )}

        {canManageSettings && tab === 'mail' && (
          <>
            <SettingsSection title="Microsoft 365 Versand" description={mailReady ? 'Absender vollständig · Verbindung noch nicht aktiviert' : 'Versandkonfiguration unvollständig'}>
              <SettingsValueRow title="Absendername" value={store.appSettings.mail.senderName || 'Nicht gesetzt'} onClick={() => openMail('senderName', 'Absendername')} />
              <SettingsValueRow title="Antwortadresse" value={store.appSettings.mail.replyTo || 'Nicht gesetzt'} onClick={() => openMail('replyTo', 'Antwortadresse', 'email')} />
              <SettingsValueRow title="Rechnungen" value={store.appSettings.mail.invoiceSender || 'Nicht gesetzt'} onClick={() => openMail('invoiceSender', 'Rechnungsabsender', 'email')} />
              <SettingsValueRow title="Angebote" value={store.appSettings.mail.quoteSender || 'Nicht gesetzt'} onClick={() => openMail('quoteSender', 'Angebotsabsender', 'email')} />
              <SettingsValueRow title="Mahnungen" value={store.appSettings.mail.reminderSender || 'Nicht gesetzt'} onClick={() => openMail('reminderSender', 'Mahnungsabsender', 'email')} />
              <SettingsValueRow title="CC Buchhaltung" value={store.appSettings.mail.financeCc || 'Nicht gesetzt'} onClick={() => openMail('financeCc', 'CC Buchhaltung', 'email')} />
            </SettingsSection>

          </>
        )}

        {canManageSettings && tab === 'automation' && (
          <>

            <SettingsSection title="Benachrichtigungen" description="Ereignisse, die im Portal und später per Push erscheinen.">
              <SettingsToggleRow title="Rechnung überfällig" checked={store.appSettings.notifications.overdueInvoice} onChange={(value) => store.updateAppSettings({ notifications: { ...store.appSettings.notifications, overdueInvoice: value } })} />
              <SettingsToggleRow title="Angebot läuft aus" checked={store.appSettings.notifications.expiringQuote} onChange={(value) => store.updateAppSettings({ notifications: { ...store.appSettings.notifications, expiringQuote: value } })} />
            </SettingsSection>
          </>
        )}

        {canManageSettings && tab === 'documents' && (
          <SettingsSection title="Dokumentvorlagen" description="Vorlage auswählen. Die Texte werden erst im Editor angezeigt.">
            <SettingsValueRow title="Rechnung" value="Texte und E-Mail-Vorlage" onClick={() => openTemplate('invoice', 'Rechnung')} />
            <SettingsValueRow title="Angebot" value="Texte und E-Mail-Vorlage" onClick={() => openTemplate('quote', 'Angebot')} />
            <SettingsValueRow title="Mahnung" value="Texte und E-Mail-Vorlage" onClick={() => openTemplate('reminder', 'Mahnung')} />
          </SettingsSection>
        )}

        {tab === 'appearance' && (
          <SettingsSection title="Darstellung und Gerät" description="Gerätespezifische Einstellungen gezielt öffnen.">
            <SettingsValueRow title="Darstellung" value="System, Hell oder Dunkel" onClick={() => setEditor({ kind: 'theme' })} />
            <SettingsValueRow title="Push-Benachrichtigungen" value="Geräteeinstellung" onClick={() => setEditor({ kind: 'push' })} />
          </SettingsSection>
        )}
      </div>

      <EditorSheets
        editor={editor}
        editValue={editValue}
        setEditValue={setEditValue}
        company={company}
        setCompany={setCompany}
        templates={templates}
        setTemplates={setTemplates}
        onClose={closeEditor}
        onSaveScalar={saveScalar}
        onSaveCompany={saveCompany}
        onSaveTemplate={saveTemplate}
      />
    </section>
  )
}

function EditorSheets({
  editor,
  editValue,
  setEditValue,
  company,
  setCompany,
  templates,
  setTemplates,
  onClose,
  onSaveScalar,
  onSaveCompany,
  onSaveTemplate,
}: {
  editor: Editor
  editValue: string
  setEditValue: (value: string) => void
  company: ReturnType<typeof useBusinessStore>['companyProfile']
  setCompany: (value: ReturnType<typeof useBusinessStore>['companyProfile']) => void
  templates: DocumentTemplates
  setTemplates: (value: DocumentTemplates) => void
  onClose: () => void
  onSaveScalar: (event: FormEvent<HTMLFormElement>) => void
  onSaveCompany: (event: FormEvent<HTMLFormElement>) => void
  onSaveTemplate: (event: FormEvent<HTMLFormElement>) => void
}) {
  if (!editor) return null

  if (editor.kind === 'theme') {
    return <ResponsiveOverlay open title="Darstellung" description="Systemdarstellung oder manuell wählen." onClose={onClose}><ThemeControl /></ResponsiveOverlay>
  }
  if (editor.kind === 'push') {
    return <ResponsiveOverlay open title="Push-Benachrichtigungen" description="Einstellung für dieses Gerät." onClose={onClose}><PushSettings /></ResponsiveOverlay>
  }
  if (editor.kind === 'mail') {
    const multiline = false
    const inputType = editor.inputType ?? 'text'
    return (
      <StandardFormSheet
        open
        mode={multiline ? 'fullscreen' : 'auto'}
        title={editor.title}
        description="Aktuellen Wert bearbeiten."
        onClose={onClose}
        onSubmit={onSaveScalar}
        formId="settings-scalar-form"
        footer={<><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button type="submit" form="settings-scalar-form" className="button primary">Speichern</button></>}
      >
        <label className="settings-edit-field">
          <span>{editor.title}</span>
          {multiline ? <Textarea rows={10} value={editValue} onChange={(e) => setEditValue(e.target.value)} autoFocus /> : <Input type={inputType} min={inputType === 'number' ? 0 : undefined} max={inputType === 'number' ? 90 : undefined} value={editValue} onChange={(e) => setEditValue(e.target.value)} autoFocus />}
        </label>
      </StandardFormSheet>
    )
  }
  if (editor.kind === 'company') {
    return (
      <StandardFormSheet
        open
        mode="fullscreen"
        title={companyTitle(editor.section)}
        description="Unternehmensdaten bearbeiten."
        onClose={onClose}
        onSubmit={onSaveCompany}
        formId="settings-company-form"
        footer={<><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button type="submit" form="settings-company-form" className="button primary">Speichern</button></>}
      >
        <div className="form-grid settings-editor-grid">
          {editor.section === 'company' && <><Field label="Firma *"><Input value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} required /></Field><Field label="UID / MWST *"><Input value={company.uid} onChange={(e) => setCompany({ ...company, uid: e.target.value })} required /></Field></>}
          {editor.section === 'address' && <><Field label="Adresse *" full><Input value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} required /></Field><Field label="PLZ *"><Input value={company.zip} onChange={(e) => setCompany({ ...company, zip: e.target.value })} required /></Field><Field label="Ort *"><Input value={company.city} onChange={(e) => setCompany({ ...company, city: e.target.value })} required /></Field><Field label="Land *"><Input value={company.country} onChange={(e) => setCompany({ ...company, country: e.target.value })} required /></Field></>}
          {editor.section === 'contact' && <><Field label="E-Mail *"><Input type="email" value={company.email} onChange={(e) => setCompany({ ...company, email: e.target.value })} required /></Field><Field label="Telefon"><Input value={company.phone} onChange={(e) => setCompany({ ...company, phone: e.target.value })} /></Field><Field label="Website" full><Input value={company.website} onChange={(e) => setCompany({ ...company, website: e.target.value })} /></Field></>}
          {editor.section === 'bank' && <><Field label="IBAN *" full><Input value={company.iban} onChange={(e) => setCompany({ ...company, iban: e.target.value })} required /></Field><Field label="Bank"><Input value={company.bankName} onChange={(e) => setCompany({ ...company, bankName: e.target.value })} /></Field><Field label="Standard-Zahlungsziel"><Input type="number" min="1" max="120" value={company.defaultPaymentDays} onChange={(e) => setCompany({ ...company, defaultPaymentDays: Number(e.target.value) })} /></Field></>}
        </div>
      </StandardFormSheet>
    )
  }

  const fields = templateFields(editor.template, templates)
  return (
    <StandardFormSheet
      open
      mode="fullscreen"
      title={`${editor.title} · Vorlage`}
      description="Texte und E-Mail-Vorlage bearbeiten."
      onClose={onClose}
      onSubmit={onSaveTemplate}
      formId="settings-template-form"
      footer={<><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button type="submit" form="settings-template-form" className="button primary">Speichern</button></>}
    >
      <div className="settings-template-fields">
        <label><span>Einleitungstext</span><Textarea rows={5} value={fields.intro} onChange={(e) => setTemplates({ ...templates, [fields.introKey]: e.target.value })} /></label>
        <label><span>Schlusstext</span><Textarea rows={5} value={fields.outro} onChange={(e) => setTemplates({ ...templates, [fields.outroKey]: e.target.value })} /></label>
        <label><span>E-Mail-Betreff</span><Input value={fields.subject} onChange={(e) => setTemplates({ ...templates, [fields.subjectKey]: e.target.value })} /></label>
        <label><span>E-Mail-Text</span><Textarea rows={8} value={fields.body} onChange={(e) => setTemplates({ ...templates, [fields.bodyKey]: e.target.value })} /></label>
        <div className="settings-note">Platzhalter: <code>{'{{number}}'}</code>, <code>{'{{amount}}'}</code>, <code>{'{{customer}}'}</code>, <code>{'{{period}}'}</code>, <code>{'{{name}}'}</code>.</div>
      </div>
    </StandardFormSheet>
  )
}

function templateFields(kind: TemplateKind, templates: DocumentTemplates) {
  if (kind === 'quote') return { introKey: 'quoteIntro' as const, outroKey: 'quoteOutro' as const, subjectKey: 'quoteEmailSubject' as const, bodyKey: 'quoteEmailBody' as const, intro: templates.quoteIntro, outro: templates.quoteOutro, subject: templates.quoteEmailSubject, body: templates.quoteEmailBody }
  if (kind === 'reminder') return { introKey: 'reminderIntro' as const, outroKey: 'reminderOutro' as const, subjectKey: 'reminderEmailSubject' as const, bodyKey: 'reminderEmailBody' as const, intro: templates.reminderIntro, outro: templates.reminderOutro, subject: templates.reminderEmailSubject, body: templates.reminderEmailBody }
  return { introKey: 'invoiceIntro' as const, outroKey: 'invoiceOutro' as const, subjectKey: 'invoiceEmailSubject' as const, bodyKey: 'invoiceEmailBody' as const, intro: templates.invoiceIntro, outro: templates.invoiceOutro, subject: templates.invoiceEmailSubject, body: templates.invoiceEmailBody }
}

function companyTitle(section: CompanyEditor) {
  if (section === 'address') return 'Adresse'
  if (section === 'contact') return 'Kontakt'
  if (section === 'bank') return 'Bank und Zahlungsziel'
  return 'Unternehmen'
}

function SettingsHubRow({ title, meta, onClick }: { title: string; meta: string; onClick: () => void }) {
  return <button type="button" className="hub-row settings-hub-row" onClick={onClick}><span><strong>{title}</strong><small>{meta}</small></span><span aria-hidden="true">›</span></button>
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" role="tab" aria-selected={active} className={active ? 'active' : undefined} onClick={onClick}>{children}</button>
}

function Field({ label, full = false, children }: { label: string; full?: boolean; children: ReactNode }) {
  return <label className={`settings-field${full ? ' full' : ''}`}><span>{label}</span>{children}</label>
}
