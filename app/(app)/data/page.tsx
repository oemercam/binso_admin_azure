'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Input, Select } from '@/components/ui/form-controls'
import { StandardFormSheet } from '@/components/ui/sheet-system'
import { SettingsSection, SettingsValueRow } from '@/components/settings/settings-row'
import { useBusinessStore } from '@/components/state/business-store'
import { useCurrentUser } from '@/components/state/current-user'
import { useFeedback } from '@/components/ui/feedback'
import type { DataExportJob, ImportJob } from '@/types/domain'

export default function DataPage() {
  const store = useBusinessStore()
  const user = useCurrentUser()
  const feedback = useFeedback()
  const [importOpen, setImportOpen] = useState(false)
  const [fileName, setFileName] = useState('')
  const [entityType, setEntityType] = useState<ImportJob['entityType']>('customers')
  const [scope, setScope] = useState<DataExportJob['scope']>('all')

  function queueImport(event: React.FormEvent) {
    event.preventDefault()
    if (!fileName.trim()) return
    store.createImportJob({ requestedBy: user.id, entityType, fileName: fileName.trim() })
    store.appendAuditEvent({ actorUserId: user.id, actorName: user.name, action: 'import.created', entityType: 'import_job', detail: fileName.trim() })
    setImportOpen(false)
    setFileName('')
    feedback.success('Import wurde vorbereitet.')
  }

  function queueExport() {
    if (!store.can('exports.create')) return
    store.createExportJob({ requestedBy: user.id, format: 'zip', scope })
    store.appendAuditEvent({ actorUserId: user.id, actorName: user.name, action: 'export.created', entityType: 'export_job', detail: scope })
    feedback.success('Export wurde vorbereitet.')
  }

  return (
    <section className="page apple-page settings-page">
      <PageHeader title="Daten" description="Daten importieren oder vollständig aus der Organisation exportieren." />

      <SettingsSection title="Import" description="CSV/XLSX-Importgrundlage mit späterer Feldzuordnung und Validierung.">
        <SettingsValueRow title="Neuen Import vorbereiten" value="Firmen, Kontakte, Mitarbeitende, Rechnungen" onClick={() => setImportOpen(true)} />
        {store.importJobs.slice(0, 5).map((job) => <SettingsValueRow key={job.id} title={job.fileName} value={job.status} description={job.entityType} />)}
      </SettingsSection>

      <SettingsSection title="Export" description="Die Organisation behält die Kontrolle über ihre Daten.">
        <div className="form-grid">
          <label><span>Umfang</span><Select value={scope} onChange={(event) => setScope(event.target.value as DataExportJob['scope'])}><option value="all">Alle Daten</option><option value="customers">Firmen</option><option value="contacts">Kontakte</option><option value="invoices">Rechnungen</option><option value="time">Zeiten</option></Select></label>
          <div className="full"><button className="button secondary" onClick={queueExport}>Export vorbereiten</button></div>
        </div>
        {store.exportJobs.slice(0, 5).map((job) => <SettingsValueRow key={job.id} title={`${job.scope} · ${job.format}`} value={job.status} description={job.createdAt} />)}
      </SettingsSection>

      {importOpen && <StandardFormSheet open title={<>Import vorbereiten</>} description={<>Datei wird in diesem Demo-Stand noch nicht verarbeitet.</>} onClose={() => setImportOpen(false)} onSubmit={queueImport} formId="data-import" footer={<><button type="button" className="button secondary" onClick={() => setImportOpen(false)}>Abbrechen</button><button type="submit" form="data-import" className="button primary">Vorbereiten</button></>}>
        <div className="form-grid">
          <label className="full"><span>Dateiname *</span><Input value={fileName} onChange={(event) => setFileName(event.target.value)} placeholder="kunden.xlsx" required /></label>
          <label className="full"><span>Datentyp</span><Select value={entityType} onChange={(event) => setEntityType(event.target.value as ImportJob['entityType'])}><option value="customers">Firmen</option><option value="contacts">Kontakte</option><option value="employees">Mitarbeitende</option><option value="invoices">Rechnungen</option></Select></label>
        </div>
      </StandardFormSheet>}
    </section>
  )
}
