'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Input, Select } from '@/components/ui/form-controls'
import { StandardFormSheet } from '@/components/ui/sheet-system'
import { SettingsSection, SettingsValueRow } from '@/components/settings/settings-row'
import { useBusinessStore } from '@/components/state/business-store'
import { useCurrentUser } from '@/components/state/current-user'
import { useFeedback } from '@/components/ui/feedback'
import type { Customer, CustomerContact, DataExportJob, Employee, ImportJob } from '@/types/domain'
import { csv, parseCsv, importNumber } from '@/lib/format/csv'
import { DataLifecycleCard } from '@/components/data-lifecycle-card'
import { PRODUCT_LIMITS } from '@/lib/config/product'


function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}


export default function DataPage() {
  const store = useBusinessStore()
  const user = useCurrentUser()
  const feedback = useFeedback()
  const [importOpen, setImportOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [entityType, setEntityType] = useState<ImportJob['entityType']>('customers')
  const [scope, setScope] = useState<DataExportJob['scope']>('all')

  async function runImport(event: React.FormEvent) {
    event.preventDefault()
    if (!file || entityType === 'invoices') return
    if (!store.can(entityType === 'employees' ? 'employees.write' : 'customers.write')) { feedback.error('Keine Importberechtigung.'); return }
    if (file.size > PRODUCT_LIMITS.csvUploadBytes) { feedback.error('Maximale Dateigrösse: 2 MB.'); return }
    const job = store.createImportJob({ requestedBy: user.id, entityType, fileName: file.name })
    store.updateImportJob(job.id, { status: 'importing' })
    try {
      const rows = parseCsv(await file.text())
      let imported = 0; let errors = 0
      for (const row of rows) {
        try {
          if (entityType === 'customers') {
            if (!row.name) throw new Error('name')
            const customer: Customer = { organizationId: store.currentOrganizationId, id: crypto.randomUUID(), name: row.name, legalName: row.legalname || undefined, customerNo: row.customerno || `IMP-${Date.now()}-${imported + 1}`, contact: row.contact || undefined, email: row.email || undefined, phone: row.phone || undefined, address: row.address || undefined, zip: row.zip || undefined, city: row.city || undefined, country: row.country || 'CH', uid: row.uid || undefined, paymentDays: importNumber(row.paymentdays, 30), status: row.status === 'inactive' ? 'inactive' : 'active', notes: row.notes || undefined }
            store.addCustomer(customer)
          } else if (entityType === 'contacts') {
            const customer = store.customers.find((item) => item.customerNo === row.customerno || item.name.toLowerCase() === row.customer?.toLowerCase())
            if (!customer || !row.name) throw new Error('customer/name')
            const contact: CustomerContact = { organizationId: store.currentOrganizationId, id: crypto.randomUUID(), customerId: customer.id, name: row.name, email: row.email || undefined, phone: row.phone || undefined, role: row.role || undefined, primary: ['1','true','ja','yes'].includes((row.primary || '').toLowerCase()) }
            store.addCustomerContact(contact)
          } else if (entityType === 'employees') {
            if (!row.name || !row.email) throw new Error('name/email')
            const employee: Employee = { organizationId: store.currentOrganizationId, id: crypto.randomUUID(), name: row.name, email: row.email, role: ['owner','admin','finance','employee'].includes(row.role) ? row.role as Employee['role'] : 'employee', employmentType: row.employmenttype === 'hourly' ? 'hourly' : 'salary', status: row.status === 'inactive' ? 'inactive' : 'active', targetHours: importNumber(row.targethours), bookedHours: importNumber(row.bookedhours), billableHours: importNumber(row.billablehours), utilisation: importNumber(row.utilisation), internalCostRate: importNumber(row.internalcostrate) }
            store.addEmployee(employee)
          }
          imported += 1
        } catch { errors += 1 }
      }
      store.updateImportJob(job.id, { status: errors ? 'validated' : 'completed', errorCount: errors, completedAt: errors ? undefined : new Date().toISOString() })
      store.appendAuditEvent({ actorUserId: user.id, actorName: user.name, action: 'import.processed', entityType: 'import_job', entityId: job.id, detail: `${file.name} · ${imported} importiert · ${errors} Fehler` })
      if (errors) feedback.warning(`${imported} Datensätze importiert, ${errors} Zeilen konnten nicht übernommen werden.`)
      else feedback.success(`${imported} Datensätze wurden importiert.`)
      setImportOpen(false); setFile(null)
    } catch {
      store.updateImportJob(job.id, { status: 'failed', errorCount: 1 })
      feedback.error('CSV-Datei konnte nicht verarbeitet werden.')
    }
  }

  function runExport() {
    if (!store.can('exports.create')) return
    const stamp = new Date().toISOString().slice(0, 10)
    const payloads: Record<Exclude<DataExportJob['scope'], 'all'>, unknown[]> = { customers: store.customers, contacts: store.customerContacts, invoices: store.invoices, time: store.timeEntries }
    const format: DataExportJob['format'] = scope === 'all' ? 'json' : 'csv'
    const job = store.createExportJob({ requestedBy: user.id, format, scope })
    try {
      if (scope === 'all') {
        const data = { organization: store.currentOrganization, companyProfile: store.companyProfile, customers: store.customers, contacts: store.customerContacts, suppliers: store.suppliers, quotes: store.quotes, contracts: store.contracts, orders: store.orders, timeEntries: store.timeEntries, invoices: store.invoices, payments: store.payments, expenses: store.expenses, creditNotes: store.creditNotes, supplierInvoices: store.supplierInvoices, employees: store.employees, settings: store.appSettings, exportedAt: new Date().toISOString() }
        download(`binso-one-${stamp}.json`, JSON.stringify(data, null, 2), 'application/json;charset=utf-8')
      } else {
        download(`binso-one-${scope}-${stamp}.csv`, `\uFEFF${csv(payloads[scope] as Record<string, unknown>[])}`, 'text/csv;charset=utf-8')
      }
      store.updateExportJob(job.id, { status: 'ready', completedAt: new Date().toISOString() })
      store.appendAuditEvent({ actorUserId: user.id, actorName: user.name, action: 'export.completed', entityType: 'export_job', entityId: job.id, detail: `${scope} · ${format}` })
      feedback.success('Export wurde erstellt und heruntergeladen.')
    } catch {
      store.updateExportJob(job.id, { status: 'failed' })
      feedback.error('Export konnte nicht erstellt werden.')
    }
  }

  return (
    <section className="page apple-page settings-page">
      <PageHeader title="Daten" description="Stammdaten per CSV importieren oder Organisationsdaten exportieren." />
      <SettingsSection title="Import" description="CSV-Import für Firmen, Kontakte und Mitarbeitende mit Zeilenvalidierung.">
        <SettingsValueRow title="Neuen CSV-Import" value="Firmen, Kontakte, Mitarbeitende" onClick={() => setImportOpen(true)} />
        {store.importJobs.slice(0, 5).map((job) => <SettingsValueRow key={job.id} title={job.fileName} value={`${job.status}${job.errorCount ? ` · ${job.errorCount} Fehler` : ''}`} description={job.entityType} />)}
      </SettingsSection>
      <SettingsSection title="Export" description="Gesamtexport als JSON oder tabellarische Bereiche als CSV.">
        <div className="form-grid">
          <label><span>Umfang</span><Select value={scope} onChange={(event) => setScope(event.target.value as DataExportJob['scope'])}><option value="all">Alle Daten</option><option value="customers">Firmen</option><option value="contacts">Kontakte</option><option value="invoices">Rechnungen</option><option value="time">Zeiten</option></Select></label>
          <div className="full"><button className="button secondary" onClick={runExport}>Export herunterladen</button></div>
        </div>
        {store.exportJobs.slice(0, 5).map((job) => <SettingsValueRow key={job.id} title={`${job.scope} · ${job.format}`} value={job.status} description={job.createdAt} />)}
      </SettingsSection>
      <DataLifecycleCard />
      {importOpen && <StandardFormSheet open title={<>CSV importieren</>} description={<>Kopfzeilen werden über Feldnamen zugeordnet. Ungültige Zeilen werden gezählt und übersprungen.</>} onClose={() => setImportOpen(false)} onSubmit={runImport} formId="data-import" footer={<><button type="button" className="button secondary" onClick={() => setImportOpen(false)}>Abbrechen</button><button type="submit" form="data-import" className="button primary" disabled={!file || entityType === 'invoices'}>Importieren</button></>}>
        <div className="form-grid">
          <label className="full"><span>CSV-Datei *</span><Input type="file" accept=".csv,text/csv" onChange={(event) => setFile(event.target.files?.[0] ?? null)} required /></label>
          <label className="full"><span>Datentyp</span><Select value={entityType} onChange={(event) => setEntityType(event.target.value as ImportJob['entityType'])}><option value="customers">Firmen</option><option value="contacts">Kontakte</option><option value="employees">Mitarbeitende</option></Select></label>
        </div>
      </StandardFormSheet>}
    </section>
  )
}
