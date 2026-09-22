'use client'

import { Input, SearchField, Select } from '@/components/ui/form-controls'
import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'
import { StandardFormSheet } from '@/components/ui/sheet-system'
import { InteractiveRow } from '@/components/ui/interactive-row'
import { StatusBadge } from '@/components/ui/status-badge'
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
    let consumed = false
    if (params.get('new') === '1') {
      setForm(emptyCustomer)
      setOpen(true)
      params.delete('new')
      consumed = true
    }
    const editId = params.get('edit')
    if (editId) {
      const customer = store.customers.find((item) => item.id === editId)
      if (customer) { setEditing(customer); params.delete('edit'); consumed = true }
    }
    if (consumed) {
      const suffix = params.toString() ? `?${params.toString()}` : ''
      router.replace(`${pathname}${suffix}`, { scroll: false })
    }
  }, [pathname, router, searchParams, store.customers])

  const filtered = useMemo(() => {
    const cleaned = query.trim().toLocaleLowerCase('de-CH')
    if (!cleaned) return store.customers
    return store.customers.filter((customer) => `${customer.name} ${customer.customerNo} ${customer.contact ?? ''} ${customer.email ?? ''} ${customer.city ?? ''}`.toLocaleLowerCase('de-CH').includes(cleaned))
  }, [store.customers, query])

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
      country: form.country.trim() || 'Schweiz',
      uid: form.uid.trim(),
      paymentDays: form.paymentDays || 30,
      status: 'prospect',
    }
    store.addCustomer(customer)
    setOpen(false)
    setForm(emptyCustomer)
    setEditing(customer)
  }

  return (
    <section className="page">
      <PageHeader
        eyebrow="KUNDEN"
        title="Kunden"
        description="Kontakte und Kundendaten verwalten."
        action={<button className="button primary page-primary-action" onClick={() => { setForm(emptyCustomer); setOpen(true) }}><Icon name="plus" size={16}/><span>Kontakt erfassen</span></button>}
      />

      <div className="module-toolbar">
        <SearchField value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Kunden durchsuchen" aria-label="Kunden durchsuchen" />
        <span className="toolbar-meta">{filtered.length} Einträge</span>
      </div>

      <div className="data-list compact-overview-list">
        <div className="data-row customer-grid data-head"><span>Kunde</span><span>Kontakt</span><span>Zahlungsziel</span><span>Status</span><span /></div>
        {filtered.map((customer) => (
          <InteractiveRow className="data-row customer-grid compact-overview-row" key={customer.id} onActivate={() => setEditing(customer)} ariaLabel={`${customer.name} öffnen`}>
            <span className="primary-cell"><strong>{customer.customerNo} · {customer.name}</strong><small className="desktop-row-detail">{customer.address || 'Adresse noch nicht erfasst'}{customer.city ? ` · ${customer.zip ?? ''} ${customer.city}` : ''}</small><small className="mobile-row-summary">{customer.contact || 'Keine Ansprechperson'} · {customer.city || 'Ort noch offen'}</small></span>
            <span className="primary-cell overview-desktop-cell"><strong>{customer.contact || '–'}</strong><small>{customer.email || 'E-Mail noch offen'}</small></span>
            <span className="overview-desktop-cell">{customer.paymentDays} Tage</span>
            <StatusBadge status={customer.status} className="overview-desktop-cell" />
            <span className="row-disclosure" aria-hidden="true"><Icon name="chevron" size={15}/></span>
          </InteractiveRow>
        ))}
      </div>

      {open && (
        <StandardFormSheet open title={<>Kontakt erfassen</>} description={<>Für ein erstes Angebot reichen wenige Angaben. Weitere Kundendaten können später ergänzt werden.</>} onClose={() => setOpen(false)} onSubmit={createCustomer} formId="customers-page-sheet-1" footer={<><button type="button" className="button secondary" onClick={() => setOpen(false)}>Abbrechen</button><button type="submit" form="customers-page-sheet-1" className="button primary">Interessent speichern</button></>}>
          <div className="form-grid">
            <label className="full"><span>Firma / Name *</span><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required/></label>
            <label><span>Ansprechperson</span><Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })}/></label>
            <label><span>E-Mail</span><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}/></label>
            <label><span>Telefon</span><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}/></label>
          </div>
          <details className="edit-step compact-details"><summary><span><strong>Weitere Angaben</strong><small>Adresse und Abrechnung können später ergänzt werden.</small></span><Icon name="chevron" size={15}/></summary><div className="edit-step-body"><CustomerBillingFields form={form} setForm={setForm}/></div></details>
        </StandardFormSheet>
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
      <StandardFormSheet open title={<>{customer.name}</>} description={<>{customer.customerNo} · Kundendaten</>} onClose={onClose} onSubmit={save} formId="customers-page-sheet-2" footer={<><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button type="submit" form="customers-page-sheet-2" className="button primary">Änderungen speichern</button></>}>
        <div className="form-grid">
          <label><span>Firma / Name *</span><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value, legalName: e.target.value })} required/></label>
          <label><span>Ansprechperson</span><Input value={draft.contact ?? ''} onChange={(e) => setDraft({ ...draft, contact: e.target.value })}/></label>
          <label><span>E-Mail</span><Input type="email" value={draft.email ?? ''} onChange={(e) => setDraft({ ...draft, email: e.target.value })}/></label>
          <label><span>Telefon</span><Input value={draft.phone ?? ''} onChange={(e) => setDraft({ ...draft, phone: e.target.value })}/></label>
          <label><span>Status</span><Select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as Customer['status'] })}><option value="prospect">Interessent</option><option value="active">Aktiv</option><option value="inactive">Inaktiv</option></Select></label>
          <label className="full"><span>Adresse</span><Input value={draft.address ?? ''} onChange={(e) => setDraft({ ...draft, address: e.target.value })}/></label>
          <label><span>PLZ</span><Input value={draft.zip ?? ''} onChange={(e) => setDraft({ ...draft, zip: e.target.value })}/></label>
          <label><span>Ort</span><Input value={draft.city ?? ''} onChange={(e) => setDraft({ ...draft, city: e.target.value })}/></label>
          <label><span>Land</span><Input value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })}/></label>
          <label><span>UID / MWST</span><Input value={draft.uid ?? ''} onChange={(e) => setDraft({ ...draft, uid: e.target.value })}/></label>
          <label><span>Zahlungsziel</span><Input type="number" min="1" value={draft.paymentDays} onChange={(e) => setDraft({ ...draft, paymentDays: Number(e.target.value) })}/></label>
        </div>
      </StandardFormSheet>
    )
  }
}

function CustomerBillingFields({ form, setForm }: { form: typeof emptyCustomer; setForm: (value: typeof emptyCustomer) => void }) {
  return <div className="form-grid">
    <label className="full"><span>Adresse</span><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}/></label>
    <label><span>PLZ</span><Input value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })}/></label>
    <label><span>Ort</span><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}/></label>
    <label><span>Land</span><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}/></label>
    <label><span>UID / MWST</span><Input value={form.uid} onChange={(e) => setForm({ ...form, uid: e.target.value })}/></label>
    <label><span>Zahlungsziel</span><Input type="number" min="1" value={form.paymentDays} onChange={(e) => setForm({ ...form, paymentDays: Number(e.target.value) })}/></label>
  </div>
}
