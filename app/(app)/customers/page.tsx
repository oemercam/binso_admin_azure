'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'
import { Toggle } from '@/components/ui/toggle'
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
    setEditing(customer)
  }

  return (
    <section className="page">
      <PageHeader
        eyebrow="CRM"
        title="Kunden"
        description="Kunden, Kontakte und vollständige Rechnungsadressen verwalten."
        action={<button className="button primary" onClick={() => { setForm(emptyCustomer); setOpen(true) }}><Icon name="plus" size={16}/> Kunde erfassen</button>}
      />

      <div className="module-toolbar">
        <label className="search-field"><Icon name="search" size={16}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Kunden durchsuchen" /></label>
        <span className="toolbar-meta">{filtered.length} Kunden</span>
      </div>

      <div className="data-list">
        <div className="data-row customer-grid data-head"><span>Kunde</span><span>Kontakt</span><span>Zahlungsziel</span><span>Status</span><span /></div>
        {filtered.map((customer) => (
          <div className="data-row customer-grid" key={customer.id}>
            <span className="primary-cell"><strong>{customer.customerNo} · {customer.name}</strong><small>{customer.address || 'Adresse fehlt'}, {customer.zip} {customer.city}</small></span>
            <span className="primary-cell"><strong>{customer.contact || '–'}</strong><small>{customer.email || 'E-Mail fehlt'}</small></span>
            <span>{customer.paymentDays} Tage</span>
            <span className={`status ${customer.status}`}>{customer.status === 'active' ? 'Aktiv' : 'Inaktiv'}</span>
            <button className="row-link" onClick={() => setEditing(customer)} aria-label={`${customer.name} öffnen`}><Icon name="chevron" size={15}/></button>
          </div>
        ))}
      </div>

      {open && (
        <div className="overlay-layer sheet-layer" onMouseDown={() => setOpen(false)}>
          <form className="form-sheet" onSubmit={createCustomer} onMouseDown={(e) => e.stopPropagation()}>
            <div className="sheet-grabber"/>
            <div className="sheet-heading"><div><strong>Kunde erfassen</strong><span>Pflichtfelder stellen sicher, dass Angebote und Rechnungen versandbereit sind.</span></div><button type="button" className="icon-button" onClick={() => setOpen(false)}><Icon name="close" size={17}/></button></div>
            <CustomerFields form={form} setForm={setForm}/>
            <div className="sheet-actions"><button type="button" className="button secondary" onClick={() => setOpen(false)}>Abbrechen</button><button className="button primary">Kunde speichern</button></div>
          </form>
        </div>
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
      <div className="overlay-layer sheet-layer" onMouseDown={onClose}>
        <form className="form-sheet" onSubmit={save} onMouseDown={(e) => e.stopPropagation()}>
          <div className="sheet-grabber"/>
          <div className="sheet-heading"><div><strong>{customer.name}</strong><span>{customer.customerNo} · Kundendaten bearbeiten</span></div><button type="button" className="icon-button" onClick={onClose}><Icon name="close" size={17}/></button></div>
          <div className="form-grid">
            <label><span>Firma *</span><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value, legalName: e.target.value })} required/></label>
            <label><span>Ansprechperson</span><input value={draft.contact ?? ''} onChange={(e) => setDraft({ ...draft, contact: e.target.value })}/></label>
            <label><span>E-Mail *</span><input type="email" value={draft.email ?? ''} onChange={(e) => setDraft({ ...draft, email: e.target.value })} required/></label>
            <label><span>Telefon</span><input value={draft.phone ?? ''} onChange={(e) => setDraft({ ...draft, phone: e.target.value })}/></label>
            <label className="full"><span>Adresse *</span><input value={draft.address ?? ''} onChange={(e) => setDraft({ ...draft, address: e.target.value })} required/></label>
            <label><span>PLZ *</span><input value={draft.zip ?? ''} onChange={(e) => setDraft({ ...draft, zip: e.target.value })} required/></label>
            <label><span>Ort *</span><input value={draft.city ?? ''} onChange={(e) => setDraft({ ...draft, city: e.target.value })} required/></label>
            <label><span>Land *</span><input value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })} required/></label>
            <label><span>UID / MWST</span><input value={draft.uid ?? ''} onChange={(e) => setDraft({ ...draft, uid: e.target.value })}/></label>
            <label><span>Zahlungsziel *</span><input type="number" min="1" value={draft.paymentDays} onChange={(e) => setDraft({ ...draft, paymentDays: Number(e.target.value) })} required/></label>
            <div className="form-toggle-field full"><span>Kunde aktiv</span><Toggle label="Kunde aktiv" checked={draft.status === 'active'} onChange={(value) => setDraft({ ...draft, status: value ? 'active' : 'inactive' })}/></div>
          </div>
          <div className="sheet-actions"><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button className="button primary">Änderungen speichern</button></div>
        </form>
      </div>
    )
  }
}

function CustomerFields({ form, setForm }: { form: typeof emptyCustomer; setForm: (value: typeof emptyCustomer) => void }) {
  return <div className="form-grid">
    <label><span>Firma *</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required/></label>
    <label><span>Ansprechperson</span><input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })}/></label>
    <label><span>E-Mail *</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required/></label>
    <label><span>Telefon</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}/></label>
    <label className="full"><span>Adresse *</span><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required/></label>
    <label><span>PLZ *</span><input value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} required/></label>
    <label><span>Ort *</span><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required/></label>
    <label><span>Land *</span><input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} required/></label>
    <label><span>UID / MWST</span><input value={form.uid} onChange={(e) => setForm({ ...form, uid: e.target.value })}/></label>
    <label><span>Zahlungsziel *</span><input type="number" min="1" value={form.paymentDays} onChange={(e) => setForm({ ...form, paymentDays: Number(e.target.value) })} required/></label>
  </div>
}
