'use client'

import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'
import { useBusinessStore } from '@/components/state/business-store'

export default function CustomersPage() {
  const store = useBusinessStore()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')

  const filtered = useMemo(
    () => store.customers.filter((customer) => `${customer.name} ${customer.customerNo} ${customer.contact} ${customer.email}`.toLowerCase().includes(query.toLowerCase())),
    [store.customers, query],
  )

  function createCustomer(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    store.addCustomer({
      id: `cus-${Date.now()}`,
      customerNo: `K-${1000 + store.customers.length + 1}`,
      name: name.trim(),
      contact: contact.trim(),
      email: email.trim(),
      city: city.trim(),
      country: 'Schweiz',
      paymentDays: 30,
      status: 'active',
    })
    setName(''); setContact(''); setEmail(''); setCity(''); setOpen(false)
  }

  return (
    <section className="page">
      <PageHeader eyebrow="CRM" title="Kunden" description="Kunden, Vertragspartner und Rechnungsadressen zentral verwalten." action={<button className="button primary" onClick={() => setOpen(true)}><Icon name="plus" size={16}/> Kunde erfassen</button>} />

      <div className="module-toolbar">
        <label className="search-field"><Icon name="search" size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Kunden durchsuchen" /></label>
        <span className="toolbar-meta">{filtered.length} Kunden</span>
      </div>

      <div className="data-list">
        <div className="data-row customer-grid data-head"><span>Kunde</span><span>Kontakt</span><span>Zahlungsziel</span><span>Status</span><span /></div>
        {filtered.map((customer) => (
          <div className="data-row customer-grid" key={customer.id}>
            <span className="primary-cell"><strong>{customer.customerNo} · {customer.name}</strong><small>{customer.city || 'Schweiz'} · {customer.email || 'Keine E-Mail'}</small></span>
            <span className="primary-cell"><strong>{customer.contact || '–'}</strong><small>{customer.phone || customer.uid || ''}</small></span>
            <span>{customer.paymentDays} Tage</span>
            <span className="status active">Aktiv</span>
            <button className="row-link" aria-label={`${customer.name} öffnen`}><Icon name="chevron" size={15}/></button>
          </div>
        ))}
      </div>

      <div className="mobile-record-list">
        {filtered.map((customer) => (
          <article className="mobile-record" key={customer.id}>
            <div className="record-top"><span className="record-icon"><Icon name="building" size={17}/></span><span><strong>{customer.name}</strong><small>{customer.customerNo} · {customer.contact || 'Kein Kontakt'}</small></span><Icon name="chevron" size={15}/></div>
            <div className="record-meta"><span>{customer.city || customer.email || 'Schweiz'}</span><span>{customer.paymentDays} Tage</span></div>
          </article>
        ))}
      </div>

      {open && (
        <div className="overlay-layer sheet-layer" onMouseDown={() => setOpen(false)}>
          <form className="form-sheet" onSubmit={createCustomer} onMouseDown={(event) => event.stopPropagation()}>
            <div className="sheet-grabber"/>
            <div className="sheet-heading"><div><strong>Kunde erfassen</strong><span>Neue Firma oder Vertragspartner</span></div><button type="button" className="icon-button" onClick={() => setOpen(false)}><Icon name="close" size={17}/></button></div>
            <div className="form-grid">
              <label><span>Firma *</span><input value={name} onChange={(e) => setName(e.target.value)} required /></label>
              <label><span>Ansprechperson</span><input value={contact} onChange={(e) => setContact(e.target.value)} /></label>
              <label><span>E-Mail</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
              <label><span>Ort</span><input value={city} onChange={(e) => setCity(e.target.value)} /></label>
              <label><span>Zahlungsziel</span><select defaultValue="30"><option>10</option><option>20</option><option>30</option></select></label>
            </div>
            <div className="sheet-actions"><button type="button" className="button secondary" onClick={() => setOpen(false)}>Abbrechen</button><button className="button primary">Kunde speichern</button></div>
          </form>
        </div>
      )}
    </section>
  )
}
