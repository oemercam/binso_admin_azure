'use client'

import { Input, Select } from '@/components/ui/form-controls'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'
import { StandardFormSheet } from '@/components/ui/sheet-system'
import { Toggle } from '@/components/ui/toggle'
import { InteractiveRow } from '@/components/ui/interactive-row'
import { useBusinessStore } from '@/components/state/business-store'
import type { Customer } from '@/types/domain'

const emptyCustomer = {
  name: '', contact: '', email: '', phone: '', address: '', zip: '', city: '', country: 'Schweiz', uid: '', paymentDays: 30,
}

export default function CustomersPage() {
  const store = useBusinessStore()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(emptyCustomer)

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const createRequested = params.get('new') === '1'
    const editId = params.get('edit')
    const editCustomer = editId ? store.customers.find((item) => item.id === editId) : undefined
    if (!createRequested && !editCustomer) return
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      if (createRequested) { setForm(emptyCustomer); setOpen(true) }
      if (editCustomer) setEditing(editCustomer)
    })
    if (createRequested) params.delete('new')
    if (editCustomer) params.delete('edit')
    const suffix = params.toString() ? `?${params.toString()}` : ''
    router.replace(`${pathname}${suffix}`, { scroll: false })
    return () => { cancelled = true }
  }, [pathname, router, searchParams, store.customers])

  const filtered = useMemo(
    () => store.customers.filter((customer) => `${customer.name} ${customer.customerNo} ${customer.contact} ${customer.email}`.toLowerCase().includes(query.toLowerCase())),
    [store.customers, query],
  )

  function createCustomer(event: React.FormEvent) {
    event.preventDefault()
    const customer: Customer = {
      id: `cus-${Date.now()}`,
      customerNo: `K-${1000 + store.customers.length + 1}`,
      name: form.name.trim(),
      legalName: form.name.trim(),
      contact: form.contact.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      zip: form.zip.trim(),
      city: form.city.trim(),
      country: form.country.trim(),
      uid: form.uid.trim(),
      paymentDays: form.paymentDays,
      status: 'active',
    }
    store.addCustomer(customer)
    setOpen(false)
    setForm(emptyCustomer)
    router.push(`/customers/${customer.id}`)
  }

  return (
    <section className="page apple-page mobile-standard-page">
      <PageHeader
        title="Kunden"
        description="Kunden erfassen und zugehörige Angebote, Aufträge, Verträge und Rechnungen verwalten."
        action={<button className="button primary page-primary-action" onClick={() => { setForm(emptyCustomer); setOpen(true) }}><Icon name="plus" size={16}/><span>Kunde erfassen</span></button>}
      />

      <div className="module-toolbar">
        <label className="search-field"><Icon name="search" size={16}/><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Kunden durchsuchen" /></label>
        <span className="toolbar-meta">{filtered.length} Kunden</span>
      </div>

      <div className="data-list compact-overview-list">
        <div className="data-row customer-grid data-head"><span>Kunde</span><span>Kontakt</span><span /></div>
        {filtered.map((customer) => (
          <InteractiveRow className="data-row customer-grid compact-overview-row" key={customer.id} href={`/customers/${customer.id}`} ariaLabel={`${customer.name} öffnen`}>
            <span className="primary-cell"><strong><span className="desktop-only-inline">{customer.customerNo} · </span>{customer.name}</strong><small className="desktop-row-detail">{customer.address || 'Adresse fehlt'}, {customer.zip} {customer.city}</small><small className="mobile-row-summary">{customer.contact || 'Keine Ansprechperson'}</small></span>
            <span className="primary-cell overview-desktop-cell"><strong>{customer.contact || '–'}</strong><small>{customer.email || 'E-Mail fehlt'}</small></span>
            <span className="row-disclosure" aria-hidden="true"><Icon name="chevron" size={15}/></span>
          </InteractiveRow>
        ))}
      </div>

      {open && (
        <StandardFormSheet open title={<>Kunde erfassen</>} description={<>Für den Start genügt der Firmenname. Kontakt- und Rechnungsdaten können später ergänzt werden.</>} onClose={() => setOpen(false)} onSubmit={createCustomer} formId="customers-page-sheet-1" footer={<><button type="button" className="button secondary" onClick={() => setOpen(false)}>Abbrechen</button><button type="submit" form="customers-page-sheet-1" className="button primary">Kunde speichern</button></>}><CustomerFields form={form} setForm={setForm}/></StandardFormSheet>
      )}

      {editing && <CustomerEdit customer={editing} onClose={() => setEditing(null)} />}
    </section>
  )

  function CustomerEdit({ customer, onClose }: { customer: Customer; onClose: () => void }) {
    const [draft, setDraft] = useState(customer)
    function save(event: React.FormEvent) {
      event.preventDefault()
      const updated = store.updateCustomer(customer.id, draft)
      if (updated) onClose()
    }
    return (
      <StandardFormSheet open title={<>{customer.name}</>} description={<>{customer.customerNo} · Kundendaten bearbeiten</>} onClose={onClose} onSubmit={save} formId="customers-page-sheet-2" footer={<><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button type="submit" form="customers-page-sheet-2" className="button primary">Änderungen speichern</button></>}><div className="form-grid">
            <label><span>Firma *</span><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value, legalName: e.target.value })} required/></label>
            <label><span>Ansprechperson</span><Input value={draft.contact ?? ''} onChange={(e) => setDraft({ ...draft, contact: e.target.value })}/></label>
            <label><span>E-Mail *</span><Input type="email" value={draft.email ?? ''} onChange={(e) => setDraft({ ...draft, email: e.target.value })} required/></label>
            <label><span>Telefon</span><Input value={draft.phone ?? ''} onChange={(e) => setDraft({ ...draft, phone: e.target.value })}/></label>
            <label className="full"><span>Adresse *</span><Input value={draft.address ?? ''} onChange={(e) => setDraft({ ...draft, address: e.target.value })} required/></label>
            <label><span>PLZ *</span><Input value={draft.zip ?? ''} onChange={(e) => setDraft({ ...draft, zip: e.target.value })} required/></label>
            <label><span>Ort *</span><Input value={draft.city ?? ''} onChange={(e) => setDraft({ ...draft, city: e.target.value })} required/></label>
            <label><span>Land *</span><Input value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })} required/></label>
            <label><span>UID / MWST</span><Input value={draft.uid ?? ''} onChange={(e) => setDraft({ ...draft, uid: e.target.value })}/></label>
            <label><span>Zahlungsziel *</span><Input type="number" min="1" value={draft.paymentDays} onChange={(e) => setDraft({ ...draft, paymentDays: Number(e.target.value) })} required/></label>
            <div className="form-toggle-field full"><span>Kunde aktiv</span><Toggle label="Kunde aktiv" checked={draft.status === 'active'} onChange={(value) => setDraft({ ...draft, status: value ? 'active' : 'inactive' })}/></div>
            <div className="form-toggle-field full"><span>Eigener Zeit-/Rapportprozess</span><Toggle label="Eigener Zeit- und Rapportprozess" checked={Boolean(draft.workflowOverride)} onChange={(value) => setDraft({ ...draft, workflowOverride: value ? { ...store.appSettings.workflow.customerProcess } : undefined })}/></div>
            {draft.workflowOverride && <>
              <label className="full"><span>Führende Zeiterfassung</span><Select value={draft.workflowOverride.timeTrackingMode ?? store.appSettings.workflow.customerProcess.timeTrackingMode} onChange={(e) => setDraft({ ...draft, workflowOverride: { ...draft.workflowOverride, timeTrackingMode: e.target.value as 'internal' | 'external_customer_system' | 'both' } })}><option value="external_customer_system">Kundensystem</option><option value="internal">Binso Admin</option><option value="both">Kundensystem und Binso</option></Select></label>
              <div className="form-toggle-field full"><span>Monatsrapport erforderlich</span><Toggle label="Monatsrapport erforderlich" checked={draft.workflowOverride.monthlyReportRequired ?? store.appSettings.workflow.customerProcess.monthlyReportRequired} onChange={(value) => setDraft({ ...draft, workflowOverride: { ...draft.workflowOverride, monthlyReportRequired: value } })}/></div>
              <div className="form-toggle-field full"><span>Unterschrift erforderlich</span><Toggle label="Unterschrift erforderlich" checked={draft.workflowOverride.customerSignatureRequired ?? store.appSettings.workflow.customerProcess.customerSignatureRequired} onChange={(value) => setDraft({ ...draft, workflowOverride: { ...draft.workflowOverride, customerSignatureRequired: value } })}/></div>
              <div className="form-toggle-field full"><span>Kundenfreigabe erforderlich</span><Toggle label="Kundenfreigabe erforderlich" checked={draft.workflowOverride.customerApprovalRequired ?? store.appSettings.workflow.customerProcess.customerApprovalRequired} onChange={(value) => setDraft({ ...draft, workflowOverride: { ...draft.workflowOverride, customerApprovalRequired: value } })}/></div>
              <div className="form-toggle-field full"><span>Fakturierung bis Rapportfreigabe sperren</span><Toggle label="Fakturierung bis Rapportfreigabe sperren" checked={draft.workflowOverride.blockBillingUntilReportApproved ?? store.appSettings.workflow.customerProcess.blockBillingUntilReportApproved} onChange={(value) => setDraft({ ...draft, workflowOverride: { ...draft.workflowOverride, blockBillingUntilReportApproved: value } })}/></div>
              <div className="form-toggle-field full"><span>Auszahlung bis Rapportfreigabe sperren</span><Toggle label="Auszahlung bis Rapportfreigabe sperren" checked={draft.workflowOverride.blockPayoutUntilReportApproved ?? store.appSettings.workflow.customerProcess.blockPayoutUntilReportApproved} onChange={(value) => setDraft({ ...draft, workflowOverride: { ...draft.workflowOverride, blockPayoutUntilReportApproved: value } })}/></div>
            </>}
          </div></StandardFormSheet>
    )
  }
}

function CustomerFields({ form, setForm }: { form: typeof emptyCustomer; setForm: (value: typeof emptyCustomer) => void }) {
  return <div className="form-grid">
    <label><span>Firma *</span><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required/></label>
    <label><span>Ansprechperson</span><Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })}/></label>
    <label><span>E-Mail</span><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}/></label>
    <label><span>Telefon</span><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}/></label>
    <label className="full"><span>Adresse</span><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}/></label>
    <label><span>PLZ</span><Input value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })}/></label>
    <label><span>Ort</span><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}/></label>
    <label><span>Land</span><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}/></label>
    <label><span>UID / MWST</span><Input value={form.uid} onChange={(e) => setForm({ ...form, uid: e.target.value })}/></label>
    <label><span>Zahlungsziel *</span><Input type="number" min="1" value={form.paymentDays} onChange={(e) => setForm({ ...form, paymentDays: Number(e.target.value) })} required/></label>
  </div>
}
