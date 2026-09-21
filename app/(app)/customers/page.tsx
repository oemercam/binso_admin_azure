'use client'

import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'
import { useBusinessStore } from '@/components/state/business-store'

export default function CustomersPage() {
  const store = useBusinessStore()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [form, setForm] = useState({ name: '', contact: '', email: '', phone: '', address: '', zip: '', city: '', country: 'Schweiz', uid: '', paymentDays: 30 })
  const filtered = useMemo(() => store.customers.filter((customer) => `${customer.name} ${customer.customerNo} ${customer.contact} ${customer.email}`.toLowerCase().includes(query.toLowerCase())), [store.customers, query])

  function createCustomer(event: React.FormEvent) {
    event.preventDefault()
    store.addCustomer({ id: `cus-${Date.now()}`, customerNo: `K-${1000 + store.customers.length + 1}`, name: form.name.trim(), legalName: form.name.trim(), contact: form.contact.trim(), email: form.email.trim(), phone: form.phone.trim(), address: form.address.trim(), zip: form.zip.trim(), city: form.city.trim(), country: form.country.trim(), uid: form.uid.trim(), paymentDays: form.paymentDays, status: 'active' })
    setOpen(false)
  }

  return <section className="page"><PageHeader eyebrow="CRM" title="Kunden" description="Kunden, Kontakte und vollständige Rechnungsadressen verwalten." action={<button className="button primary" onClick={() => setOpen(true)}><Icon name="plus" size={16}/> Kunde erfassen</button>} />
    <div className="module-toolbar"><label className="search-field"><Icon name="search" size={16}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Kunden durchsuchen" /></label><span className="toolbar-meta">{filtered.length} Kunden</span></div>
    <div className="data-list"><div className="data-row customer-grid data-head"><span>Kunde</span><span>Kontakt</span><span>Zahlungsziel</span><span>Status</span><span /></div>{filtered.map((customer) => <div className="data-row customer-grid" key={customer.id}><span className="primary-cell"><strong>{customer.customerNo} · {customer.name}</strong><small>{customer.address}, {customer.zip} {customer.city}</small></span><span className="primary-cell"><strong>{customer.contact || '–'}</strong><small>{customer.email}</small></span><span>{customer.paymentDays} Tage</span><span className="status active">Aktiv</span><span /></div>)}</div>
    {open && <div className="overlay-layer sheet-layer" onMouseDown={() => setOpen(false)}><form className="form-sheet" onSubmit={createCustomer} onMouseDown={(e) => e.stopPropagation()}><div className="sheet-heading"><div><strong>Kunde erfassen</strong><span>Pflichtfelder stellen sicher, dass Angebote und Rechnungen versandbereit sind.</span></div><button type="button" className="icon-button" onClick={() => setOpen(false)}><Icon name="close" size={17}/></button></div><div className="form-grid">
      <label><span>Firma *</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required/></label><label><span>Ansprechperson</span><input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })}/></label><label><span>E-Mail *</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required/></label><label><span>Telefon</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}/></label><label className="full"><span>Adresse *</span><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required/></label><label><span>PLZ *</span><input value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} required/></label><label><span>Ort *</span><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required/></label><label><span>Land *</span><input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} required/></label><label><span>UID / MWST</span><input value={form.uid} onChange={(e) => setForm({ ...form, uid: e.target.value })}/></label><label><span>Zahlungsziel *</span><input type="number" min="1" value={form.paymentDays} onChange={(e) => setForm({ ...form, paymentDays: Number(e.target.value) })} required/></label>
    </div><div className="sheet-actions"><button type="button" className="button secondary" onClick={() => setOpen(false)}>Abbrechen</button><button className="button primary">Kunde speichern</button></div></form></div>}
  </section>
}
